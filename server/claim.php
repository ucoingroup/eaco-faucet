<?php
/**
 * EACO Faucet - Claim Endpoint
 * 
 * Handles EACO token claims with file-based anti-duplicate logic.
 * No database required - uses JSON files for state tracking.
 * 
 * Security:
 * - Faucet private key never exposed to client
 * - File locking for concurrent request safety
 * - IP rate limiting
 * - Address cooldown (168h = 7 days)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . CORS_ORIGIN);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Load config
require_once __DIR__ . '/config.php';

// Ensure data directory exists
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

// Get request body
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$address = isset($input['address']) ? trim($input['address']) : '';
$amount = isset($input['amount']) ? intval($input['amount']) : 50;

// -- Validation --
if (empty($address)) {
    echo json_encode(['success' => false, 'error' => 'Wallet address required']);
    exit;
}

// Basic Solana address validation (base58, 32-44 chars)
if (!preg_match('/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', $address)) {
    echo json_encode(['success' => false, 'error' => 'Invalid Solana address']);
    exit;
}

if ($amount < MIN_CLAIM || $amount > MAX_CLAIM) {
    echo json_encode(['success' => false, 'error' => 'Amount must be between ' . MIN_CLAIM . ' and ' . MAX_CLAIM]);
    exit;
}

// -- Rate limiting by IP --
$clientIP = getClientIP();
if (isRateLimited($clientIP)) {
    echo json_encode(['success' => false, 'error' => 'Rate limited. Please try again later.']);
    exit;
}

// -- Check address cooldown --
$lastClaim = getLastClaim($address);
if ($lastClaim) {
    $elapsed = time() - $lastClaim['timestamp'];
    $cooldownSecs = COOLDOWN_HOURS * 3600;
    if ($elapsed < $cooldownSecs) {
        $remainingSecs = $cooldownSecs - $elapsed;
        $remainingDays = floor($remainingSecs / 86400);
        $remainingHours = ceil(($remainingSecs % 86400) / 3600);
        $remainingText = $remainingDays > 0 ? "{$remainingDays}d {$remainingHours}h" : "{$remainingHours}h";
        echo json_encode(['success' => false, 'error' => "Already claimed. Please wait {$remainingText}."]);
        exit;
    }
}

// -- Process claim --
logMsg("Claim request: address={$address}, amount={$amount}, ip={$clientIP}");

// Check if faucet keypair exists
if (!file_exists(FAUCET_KEYPAIR_PATH)) {
    // Demo mode - no real transaction
    logMsg("DEMO MODE: No faucet keypair found. Simulating claim.");
    
    // Record the claim
    recordClaim($address, $amount, $clientIP, 'demo_' . bin2hex(random_bytes(8)));
    recordIPClaim($clientIP);
    
    echo json_encode([
        'success' => true,
        'txid' => 'demo_' . bin2hex(random_bytes(8)),
        'amount' => $amount,
        'mode' => 'demo'
    ]);
    exit;
}

// Real mode - send transaction via Node.js signer
$signerResult = callSigner($address, $amount);

if ($signerResult && isset($signerResult['success']) && $signerResult['success']) {
    // Record the claim
    recordClaim($address, $amount, $clientIP, $signerResult['txid']);
    recordIPClaim($clientIP);
    
    logMsg("Claim success: address={$address}, txid={$signerResult['txid']}");
    
    echo json_encode([
        'success' => true,
        'txid' => $signerResult['txid'],
        'amount' => $amount,
        'mode' => 'live'
    ]);
} else {
    $err = isset($signerResult['error']) ? $signerResult['error'] : 'Signer service unavailable';
    logMsg("Claim failed: address={$address}, error={$err}");
    echo json_encode(['success' => false, 'error' => $err]);
}

// -- Helper Functions --

/**
 * Get client IP address
 */
function getClientIP() {
    $ip = '';
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    } elseif (isset($_SERVER['HTTP_X_REAL_IP'])) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    } elseif (isset($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return trim($ip);
}

/**
 * Check if IP is rate limited
 */
function isRateLimited($ip) {
    $file = DATA_DIR . '/ip_records.json';
    if (!file_exists($file)) return false;
    
    $records = json_decode(file_get_contents($file), true);
    if (!$records || !isset($records[$ip])) return false;
    
    $elapsed = time() - $records[$ip];
    return $elapsed < (IP_RATE_LIMIT_MINUTES * 60);
}

/**
 * Record IP claim time
 */
function recordIPClaim($ip) {
    $file = DATA_DIR . '/ip_records.json';
    $records = [];
    if (file_exists($file)) {
        $records = json_decode(file_get_contents($file), true) ?: [];
    }
    $records[$ip] = time();
    
    // Clean old records (keep only last 24h - IP limit is 30min, 24h is sufficient)
    foreach ($records as $k => $v) {
        if (time() - $v > 86400) unset($records[$k]);
    }
    
    file_put_contents($file, json_encode($records), LOCK_EX);
}

/**
 * Get last claim record for an address
 */
function getLastClaim($address) {
    $file = DATA_DIR . '/claims.json';
    if (!file_exists($file)) return null;
    
    $records = json_decode(file_get_contents($file), true);
    if (!$records || !isset($records[$address])) return null;
    
    return $records[$address];
}

/**
 * Record a successful claim
 */
function recordClaim($address, $amount, $ip, $txid) {
    $file = DATA_DIR . '/claims.json';
    $records = [];
    if (file_exists($file)) {
        $records = json_decode(file_get_contents($file), true) ?: [];
    }
    
    $records[$address] = [
        'timestamp' => time(),
        'amount' => $amount,
        'ip' => $ip,
        'txid' => $txid
    ];
    
    // Clean records older than 7 days
    foreach ($records as $k => $v) {
        if (is_array($v) && isset($v['timestamp']) && time() - $v['timestamp'] > 604800) {
            unset($records[$k]);
        }
    }
    
    file_put_contents($file, json_encode($records), LOCK_EX);
    
    // Also append to log file for audit
    $logLine = date('Y-m-d H:i:s') . " | {$address} | {$amount} EACO | IP: {$ip} | TX: {$txid}\n";
    file_put_contents(LOG_FILE, $logLine, FILE_APPEND | LOCK_EX);
    
    // Update stats
    updateStats($amount);
}

/**
 * Update faucet statistics
 */
function updateStats($amount) {
    $file = DATA_DIR . '/stats.json';
    $stats = ['total_distributed' => 0, 'total_claimers' => 0, 'today_claims' => 0, 'today_date' => date('Y-m-d')];
    
    if (file_exists($file)) {
        $stats = json_decode(file_get_contents($file), true) ?: $stats;
    }
    
    // Reset daily counter
    if ($stats['today_date'] !== date('Y-m-d')) {
        $stats['today_claims'] = 0;
        $stats['today_date'] = date('Y-m-d');
    }
    
    $stats['total_distributed'] += $amount;
    $stats['total_claimers']++;
    $stats['today_claims']++;
    
    file_put_contents($file, json_encode($stats), LOCK_EX);
}

/**
 * Call Node.js signer service
 */
function callSigner($recipient, $amount) {
    $payload = json_encode([
        'recipient' => $recipient,
        'amount' => $amount,
        'mint' => EACO_MINT
    ]);
    
    $ch = curl_init(SIGNER_URL . '/send');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200 || !$response) {
        return ['success' => false, 'error' => 'Signer service error'];
    }
    
    return json_decode($response, true);
}

/**
 * Log message
 */
function logMsg($msg) {
    $line = date('Y-m-d H:i:s') . ' | ' . $msg . "\n";
    file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}
