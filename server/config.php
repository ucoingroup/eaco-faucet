<?php
/**
 * EACO Faucet - Backend Configuration
 * 
 * Security notes:
 * - FAUCET_SECRET_KEY is never exposed to the frontend
 * - Set the path to your faucet wallet keypair JSON file
 * - The keypair file should be outside the web root
 */

// EACO Token Contract Address (Solana SPL)
define('EACO_MINT', 'DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH');

// Solana RPC endpoint
define('RPC_URL', 'https://api.mainnet-beta.solana.com');

// Faucet wallet keypair file path (OUTSIDE web root!)
// Generate with: solana-keygen new -o /path/to/faucet-keypair.json
define('FAUCET_KEYPAIR_PATH', __DIR__ . '/faucet-keypair.json');

// Claim limits
define('MIN_CLAIM', 50);
define('MAX_CLAIM', 100);
define('COOLDOWN_HOURS', 168);

// Data directory for claim records (file-based, no database)
define('DATA_DIR', __DIR__ . '/data');

// Rate limiting (per IP)
define('IP_RATE_LIMIT_MINUTES', 30); // 1 claim per IP per 30 min

// CORS origin (set to your frontend URL)
define('CORS_ORIGIN', '*'); // Use specific domain in production

// Node.js signer URL (if using Node.js helper for signing)
define('SIGNER_URL', 'http://127.0.0.1:3001');

// Log file
define('LOG_FILE', DATA_DIR . '/faucet.log');
