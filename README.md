# EACO Faucet - Free EACO Token Claim Website

> **EACO** - Earth's Best Coin = E = Energy x Attitude x Cooperation x Optimization
> 
> A free EACO SPL token faucet for Earth villagers. Built with HTML + JS + PHP + Rust (optional).

**GitHub**: https://github.com/ucoingroup/eaco-faucet

## Welcome Earth Villagers / 欢迎地球村网友共建共享

This is an open-source community project. Everyone is welcome to contribute - code, translations, bug reports, or ideas!

这是一个开源社区项目，欢迎所有人参与共建 - 代码、翻译、Bug 报告或创意都可以！

### How to Contribute / 参与方式

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Contributors can earn EACO rewards (50-500 EACO per accepted PR).

## Features

- **Free EACO Claims** - 50-100 EACO per claim, once per 7 days (168 hours) per wallet
- **3 Themes** - Space (default), Earth, Business
- **6 Languages** - Chinese, English, Spanish, French, Russian, Arabic
- **Bilingual Toggle** - One-click EN/CN switch
- **No Database** - File-based (PHP) or on-chain (Rust PDA) anti-duplicate
- **Wallet Connect** - Phantom, Solflare, OKX, Backpack, Gate, Binance, Coinbase, Glow
- **Responsive** - Mobile-friendly design
- **Safe** - Private keys never exposed to frontend

## Project Structure

```
eaco-faucet/
|-- index.html          # Main frontend page
|-- js/
|   |-- config.js       # Frontend config (backend URL)
|   |-- i18n.js         # 6-language translations + links data
|   |-- app.js          # Wallet connect, claim logic, themes, starfield
|-- server/
|   |-- config.php      # Backend configuration
|   |-- claim.php       # Claim endpoint (file-based anti-duplicate)
|   |-- stats.php       # Stats endpoint
|   |-- signer.js       # Node.js signing service
|   |-- package.json    # Node.js dependencies
|-- rust/
|   |-- eaco_faucet.rs  # Solana program (Anchor framework)
|   |-- Cargo.toml      # Rust dependencies
|   |-- Anchor.toml     # Anchor config
|-- .gitignore
|-- README.md
```

## Quick Start

### Option A: Demo Mode (GitHub Pages)

1. Upload all files to your GitHub repository
2. Enable GitHub Pages in repo settings
3. The site runs in **demo mode** - claims are simulated

### Option B: Live Mode (Self-hosted)

1. **Frontend**: Upload `index.html` and `js/` to your web server
2. **Backend**: 
   - Install PHP 7.4+ on your server
   - Install Node.js 16+ for the signer service
3. **Configure**:
   - Edit `js/config.js`: Set `window.EACO_BACKEND` to your server URL
   - Edit `server/config.php`: Set `CORS_ORIGIN` to your frontend URL
4. **Generate faucet keypair**:
   ```bash
   solana-keygen new -o server/faucet-keypair.json
   ```
5. **Fund the faucet wallet** with EACO tokens
6. **Start signer service**:
   ```bash
   cd server
   npm install
   node signer.js
   ```
7. **Start PHP** (if using Apache/Nginx, PHP is already served)

## EACO Token Info

| Field | Value |
|-------|-------|
| Name | EACO (Earth's Best Coin) |
| Symbol | EACO / E |
| Blockchain | Solana |
| Type | SPL Token |
| Contract Address | `DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH` |
| Core Concept | Energy x Attitude x Cooperation x Optimization |

## Security Architecture

### Layer 1: Frontend (HTML + JS)
- Wallet connection via Phantom/Solflare
- Local cooldown check (localStorage)
- No private keys in frontend code

### Layer 2: Backend (PHP, file-based)
- Address cooldown tracking (JSON files)
- IP rate limiting (JSON files)
- File locking for concurrent safety
- Calls Node.js signer for actual transactions

### Layer 3: Signer (Node.js)
- Holds faucet keypair in memory
- Only listens on 127.0.0.1 (localhost)
- Signs SPL token transfer transactions
- No CORS headers (internal only)

### Layer 4: On-chain (Rust, optional)
- PDA-based claim records
- On-chain anti-duplicate
- Authority-controlled parameters
- No external database needed

## Claim Flow

```
User connects wallet
    |
    v
User selects amount (50-100) and clicks "Claim"
    |
    v
Frontend checks localStorage cooldown ---> if < 168h, reject
    |
    v
Frontend POST to PHP backend /claim.php
    |
    v
PHP checks file-based claim records ---> if < 168h, reject
    |
    v
PHP checks IP rate limit ---> if < 30min, reject
    |
    v
PHP calls Node.js signer /send
    |
    v
Signer loads faucet keypair, builds SPL transfer tx
    |
    v
Signer broadcasts to Solana RPC
    |
    v
PHP records claim (claims.json), updates stats
    |
    v
Frontend shows success + tx link to Solscan
```

## Deployment: GitHub Pages

1. Create a repo like `ucoingroup.github.io/eaco-faucet`
2. Push all files
3. Settings -> Pages -> Source: main branch
4. Site will be at `https://ucoingroup.github.io/eaco-faucet/`
5. Runs in **demo mode** (no backend)

For live mode, deploy frontend to GitHub Pages and backend to a VPS.

## Language Support

| Code | Language | RTL |
|------|----------|-----|
| zh-CN | Chinese | No |
| en | English | No |
| es | Spanish | No |
| fr | French | No |
| ru | Russian | No |
| ar | Arabic | Yes |

## Theme Switching

| Theme | Description |
|-------|-------------|
| Space (default) | Deep blue background + neon colors + animated starfield |
| Earth | Green natural tones |
| Business | Blue-white professional style |

## Footer Links

The footer contains 12 EACO ecosystem links:
1. Earth's Best Coin
2. EACO 50 Rate
3. 100 Ways To Wealth
4. Earth 100 Friends
5. EACO SWAP
6. Good Books
7. EUR-EACO
8. AU Trade
9. Mohist Tech
10. Earth Village School
11. EACO Build World
12. EACO Web3

## Important Warnings

- **Never share your private key or mnemonic phrase**
- **Always verify the contract address**: `DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH`
- **EACO is a community MEME token** - not financial advice (DYOR)
- **Crypto is volatile** - prices can go to zero
- **Only connect wallets to sites you trust**

## Tech Stack

- Frontend: HTML5, CSS3, vanilla JavaScript (no framework)
- Backend: PHP 7.4+ (file-based storage, no database)
- Signer: Node.js 16+ with @solana/web3.js and @solana/spl-token
- On-chain: Rust with Anchor framework (optional)
- Wallet: Phantom / Solflare / Backpack

## License

MIT - Free to use, modify, and distribute.

## EACO Community

- Contract: `DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH`
- EACO = Energy x Attitude x Cooperation x Optimization
- Earth's Best AI + RWA + Web3 Coin
