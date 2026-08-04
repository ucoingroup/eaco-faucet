/**
 * EACO Faucet - Node.js Signer Service
 * 
 * This service holds the faucet wallet keypair and signs SPL token transfers.
 * It receives claim requests from the PHP backend and broadcasts transactions
 * to the Solana network.
 * 
 * Prerequisites:
 *   npm install @solana/web3.js @solana/spl-token
 * 
 * Usage:
 *   node signer.js
 * 
 * The service listens on http://127.0.0.1:3001
 * 
 * Security:
 * - Only listens on localhost (127.0.0.1)
 * - Faucet keypair loaded from file, never sent over network
 * - No CORS headers (internal service only)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load dependencies (install with npm)
let Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction;
let TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, createTransferInstruction;

try {
  const web3 = require('@solana/web3.js');
  const splToken = require('@solana/spl-token');
  Connection = web3.Connection;
  PublicKey = web3.PublicKey;
  Keypair = web3.Keypair;
  Transaction = web3.Transaction;
  sendAndConfirmTransaction = web3.sendAndConfirmTransaction;
  TOKEN_PROGRAM_ID = splToken.TOKEN_PROGRAM_ID;
  getOrCreateAssociatedTokenAccount = splToken.getOrCreateAssociatedTokenAccount;
  createTransferInstruction = splToken.createTransferInstruction;
} catch (e) {
  console.error('[EACO Signer] Missing dependencies. Run: npm install @solana/web3.js @solana/spl-token');
  console.error(e.message);
  process.exit(1);
}

// -- Configuration --
const EACO_MINT = 'DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH';
const RPC_URL = 'https://api.mainnet-beta.solana.com';
const KEYPAIR_PATH = path.join(__dirname, 'faucet-keypair.json');
const PORT = 3001;
const HOST = '127.0.0.1'; // Localhost only!

// -- Initialize --
const connection = new Connection(RPC_URL, 'confirmed');
let faucetKeypair = null;

// Load faucet keypair
if (fs.existsSync(KEYPAIR_PATH)) {
  try {
    const keypairData = JSON.parse(fs.readFileSync(KEYPAIR_PATH, 'utf8'));
    faucetKeypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
    console.log('[EACO Signer] Faucet wallet loaded:', faucetKeypair.publicKey.toString());
  } catch (e) {
    console.error('[EACO Signer] Failed to load keypair:', e.message);
  }
} else {
  console.warn('[EACO Signer] No keypair found at', KEYPAIR_PATH);
  console.warn('[EACO Signer] Running in DEMO mode. Generate with: solana-keygen new -o', KEYPAIR_PATH);
}

// -- HTTP Server --
const server = http.createServer(async (req, res) => {
  // Only accept POST to /send
  if (req.method === 'POST' && req.url === '/send') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const recipient = data.recipient;
        const amount = data.amount || 50;
        const mint = data.mint || EACO_MINT;

        if (!recipient) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Recipient address required' }));
          return;
        }

        // Demo mode if no keypair
        if (!faucetKeypair) {
          console.log('[EACO Signer] DEMO: Would send', amount, 'EACO to', recipient);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            txid: 'demo_' + Math.random().toString(36).substring(2, 18),
            mode: 'demo'
          }));
          return;
        }

        // Real transaction
        console.log('[EACO Signer] Sending', amount, 'EACO to', recipient);

        const mintPubkey = new PublicKey(mint);
        const recipientPubkey = new PublicKey(recipient);

        // Get faucet ATA
        const faucetATA = await getOrCreateAssociatedTokenAccount(
          connection,
          faucetKeypair,
          mintPubkey,
          faucetKeypair.publicKey
        );

        // Get or create recipient ATA
        const recipientATA = await getOrCreateAssociatedTokenAccount(
          connection,
          faucetKeypair,
          mintPubkey,
          recipientPubkey
        );

        // EACO has 9 decimals (standard SPL)
        const decimals = 9;
        const transferAmount = BigInt(amount) * BigInt(10 ** decimals);

        // Create transfer instruction
        const instruction = createTransferInstruction(
          faucetATA.address,
          recipientATA.address,
          faucetKeypair.publicKey,
          transferAmount,
          [],
          TOKEN_PROGRAM_ID
        );

        // Build and send transaction
        const transaction = new Transaction().add(instruction);
        const txid = await sendAndConfirmTransaction(connection, transaction, [faucetKeypair]);

        console.log('[EACO Signer] Transaction confirmed:', txid);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          txid: txid,
          amount: amount,
          mode: 'live'
        }));

      } catch (err) {
        console.error('[EACO Signer] Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      mode: faucetKeypair ? 'live' : 'demo',
      faucet: faucetKeypair ? faucetKeypair.publicKey.toString() : null
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, HOST, () => {
  console.log('[EACO Signer] Service running on http://' + HOST + ':' + PORT);
  console.log('[EACO Signer] Mode:', faucetKeypair ? 'LIVE' : 'DEMO');
  console.log('[EACO Signer] EACO Mint:', EACO_MINT);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[EACO Signer] Shutting down...');
  server.close();
  process.exit(0);
});
