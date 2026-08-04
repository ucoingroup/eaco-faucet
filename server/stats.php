<?php
/**
 * EACO Faucet - Stats Endpoint
 * Returns faucet statistics (total distributed, claimers, today's claims)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/config.php';

$statsFile = DATA_DIR . '/stats.json';

if (!file_exists($statsFile)) {
    echo json_encode([
        'success' => true,
        'total_distributed' => 0,
        'total_claimers' => 0,
        'today_claims' => 0
    ]);
    exit;
}

$stats = json_decode(file_get_contents($statsFile), true);

// Reset daily if needed
if (isset($stats['today_date']) && $stats['today_date'] !== date('Y-m-d')) {
    $stats['today_claims'] = 0;
    $stats['today_date'] = date('Y-m-d');
    file_put_contents($statsFile, json_encode($stats), LOCK_EX);
}

echo json_encode([
    'success' => true,
    'total_distributed' => $stats['total_distributed'] ?? 0,
    'total_claimers' => $stats['total_claimers'] ?? 0,
    'today_claims' => $stats['today_claims'] ?? 0
]);
