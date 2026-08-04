# EACO Faucet 程序使用说明书

> EACO Faucet - 免费 Solana SPL 代币 EACO 领取网站
>
> Earth's Best Coin = EACO = E
>
> CA: `DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH`

---

## 目录

1. [钱包支持说明](#1-钱包支持说明)
2. [快速开始](#2-快速开始)
3. [用户操作指南](#3-用户操作指南)
4. [部署指南](#4-部署指南)
5. [后端配置详解](#5-后端配置详解)
6. [安全架构说明](#6-安全架构说明)
7. [多语言与主题](#7-多语言与主题)
8. [Rust 链上程序](#8-rust-链上程序)
9. [API 接口文档](#9-api-接口文档)
10. [常见问题](#10-常见问题)
11. [文件清单](#11-文件清单)

---

## 1. 钱包支持说明

### 支持的 Web3 钱包

EACO Faucet 支持所有主流 Solana 链 Web3 钱包。用户连接钱包后，可直接领取 EACO 等 SPL 代币。

| 钱包名称 | 注入方式 | 官网 | 支持状态 |
|----------|----------|------|----------|
| Phantom | `window.solana` (isPhantom) | https://phantom.app/ | 完整支持 |
| Solflare | `window.solflare` | https://solflare.com/ | 完整支持 |
| OKX Web3 Wallet | `window.okxwallet` | https://www.okx.com/web3 | 完整支持 |
| Backpack | `window.backpack` | https://backpack.app/ | 完整支持 |
| Gate Web3 Wallet | `window.gatewallet` | https://www.gate.io/web3 | 完整支持 |
| Binance Web3 Wallet | `window.BinanceChain` | https://www.binance.com/en/web3wallet | 完整支持 |
| Coinbase Wallet | `window.coinbaseSolana` | https://www.coinbase.com/wallet | 完整支持 |
| Glow Wallet | `window.glow` | https://glow.app/ | 完整支持 |

### 钱包检测逻辑

程序按以下顺序自动检测已安装的钱包：

```
1. window.solana?.isPhantom    -> Phantom
2. window.solflare              -> Solflare
3. window.okxwallet             -> OKX
4. window.backpack              -> Backpack
5. window.gatewallet            -> Gate
6. window.BinanceChain          -> Binance
7. window.coinbaseSolana        -> Coinbase
8. window.glow                  -> Glow
9. window.solana (fallback)     -> Generic Solana
```

- 如果只安装了**1个钱包**：自动直接连接
- 如果安装了**多个钱包**：弹出钱包选择器，用户点击选择
- 如果**没有安装钱包**：弹出安装引导，显示所有钱包的下载链接

### 钱包选择器 UI

点击"连接钱包"按钮后：

- **多钱包场景**：弹出模态框，列出所有已检测到的钱包，每个钱包显示图标和名称，用户点击选择
- **未安装场景**：弹出安装引导面板，以网格布局显示 8 个主流钱包的下载链接
- 用户可随时点击"断开连接"按钮安全退出

### 可以领取哪些代币

EACO Faucet 的核心功能是免费领取 **EACO** (Solana SPL 代币)。但底层架构是通用的 SPL Token 转账机制，理论上可用于领取任何 Solana 链上的 SPL 代币。只需在配置中修改代币合约地址即可。

---

## 2. 快速开始

### 模式选择

| 模式 | 适用场景 | 后端需求 | 私钥需求 |
|------|----------|----------|----------|
| Demo 模式 | GitHub Pages、本地预览 | 无 | 无 |
| Live 模式 | 自建服务器、VPS | PHP + Node.js | 需要水龙头钱包私钥 |

### Demo 模式（无需后端）

1. 将 `eaco-faucet/` 目录下所有文件上传到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 访问 `https://用户名.github.io/仓库名/`
4. 网站运行在 Demo 模式：领取操作模拟执行，不发送真实代币

### Live 模式（真实代币分发）

1. 前端部署到任意静态服务器或 GitHub Pages
2. 后端部署到支持 PHP 的服务器
3. 配置 `js/config.js` 指向后端地址
4. 启动 Node.js 签名服务
5. 用 EACO 代币充入水龙头钱包

---

## 3. 用户操作指南

### 3.1 连接钱包

1. 打开 EACO Faucet 网站
2. 点击 **"连接钱包"** 按钮
3. 如果弹出钱包选择器，点击你想使用的钱包
4. 在钱包弹窗中确认连接
5. 连接成功后，页面显示你的钱包地址和 SOL 余额

### 3.2 领取 EACO

1. 连接钱包后，使用滑块选择领取数量（50-100 EACO）
2. 点击 **"领取 EACO"** 按钮
3. 等待交易确认（通常 5-15 秒）
4. 成功后页面显示领取数量和交易哈希
5. 点击交易链接可在 Solscan 上查看交易详情

### 3.3 领取规则

- 每个钱包地址每 **168 小时（7 天）**可领取一次
- 单次领取数量：**50-100 EACO**（10 的倍数）
- 同一 IP 地址每 **30 分钟**限领一次（防刷机制）
- 领取完全免费，不需要支付任何费用

### 3.4 断开连接

- 点击 **"断开连接"** 按钮即可安全退出
- 断开后钱包不再与网站交互
- 可随时重新连接

### 3.5 切换语言

- 使用导航栏的**语言下拉框**切换 6 种语言
- 或点击 **"EN" / "中文"** 按钮一键切换中英文
- 所有界面文字、安全提示、链接名称均跟随切换
- 阿拉伯语自动切换为 RTL（从右到左）布局

### 3.6 切换主题

点击导航栏的三个圆点切换主题：

| 主题 | 说明 |
|------|------|
| 星际深空 | 深蓝背景 + 霓虹色 + 动态星空动画 |
| 地球绿洲 | 绿色自然色调 |
| 经典商务 | 蓝白专业风格 |

主题选择保存在 localStorage，刷新后保持。

### 3.7 复制合约地址

点击页面顶部的合约地址框即可复制 CA 到剪贴板：

```
DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH
```

---

## 4. 部署指南

### 4.1 GitHub Pages 部署（Demo 模式）

```bash
# 1. 创建 GitHub 仓库
git init
git add .
git commit -m "EACO Faucet initial release"

# 2. 推送到 GitHub
git remote add origin https://github.com/ucoingroup/eaco-faucet.git
git push -u origin main

# 3. 在 GitHub 仓库设置中：
#    Settings -> Pages -> Source -> main branch
#    网站地址: https://ucoingroup.github.io/eaco-faucet/
```

### 4.2 自建服务器部署（Live 模式）

#### 前端部署

将以下文件上传到 Web 服务器的根目录或子目录：

```
index.html
js/config.js
js/i18n.js
js/app.js
```

#### 后端部署

```bash
# 1. 在服务器上创建目录
mkdir -p /var/www/eaco-faucet/server
cd /var/www/eaco-faucet/server

# 2. 上传后端文件
# config.php, claim.php, stats.php, signer.js, package.json

# 3. 安装 Node.js 依赖
npm install

# 4. 生成水龙头钱包密钥
solana-keygen new -o faucet-keypair.json

# 5. 用 EACO 代币充入水龙头钱包地址
#    (用 Phantom/Solflare 等钱包向水龙头地址转 EACO)

# 6. 配置 PHP (确保 PHP 7.4+ 已安装)
# 确保 server/data/ 目录可写: chmod 755 data

# 7. 启动签名服务
node signer.js
# 输出: [EACO Signer] Service running on http://127.0.0.1:3001
```

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name eaco-faucet.yourdomain.com;
    
    # 前端
    root /var/www/eaco-faucet;
    index index.html;
    
    # PHP 后端
    location /server/ {
        alias /var/www/eaco-faucet/server/;
        location ~ \.php$ {
            fastcgi_pass unix:/run/php/php7.4-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
    
    # 签名服务代理（仅内部访问）
    location /signer/ {
        proxy_pass http://127.0.0.1:3001/;
        deny all;  # 不对外暴露
    }
}
```

#### 前端配置

编辑 `js/config.js`，设置后端地址：

```javascript
// Live 模式
window.EACO_BACKEND = "https://eaco-faucet.yourdomain.com/server";

// Demo 模式
window.EACO_BACKEND = null;
```

---

## 5. 后端配置详解

### 5.1 PHP 配置 (server/config.php)

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `EACO_MINT` | `DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH` | EACO 代币合约地址 |
| `RPC_URL` | `https://api.mainnet-beta.solana.com` | Solana RPC 节点 |
| `FAUCET_KEYPAIR_PATH` | `__DIR__/faucet-keypair.json` | 水龙头钱包密钥文件路径 |
| `MIN_CLAIM` | `50` | 最小领取数量 |
| `MAX_CLAIM` | `100` | 最大领取数量 |
| `COOLDOWN_HOURS` | `168` | 领取冷却时间（小时） |
| `IP_RATE_LIMIT_MINUTES` | `30` | IP 限频间隔（分钟） |
| `CORS_ORIGIN` | `*` | 跨域允许来源（生产环境改为具体域名） |
| `SIGNER_URL` | `http://127.0.0.1:3001` | Node.js 签名服务地址 |
| `DATA_DIR` | `__DIR__/data` | 数据文件目录 |
| `LOG_FILE` | `DATA_DIR/faucet.log` | 操作日志文件 |

### 5.2 数据文件说明

后端不使用数据库，所有状态保存在 JSON 文件中：

```
server/data/
|-- claims.json        # 地址领取记录（地址 -> {时间, 数量, IP, 交易哈希}）
|-- ip_records.json    # IP 领取记录（IP -> 时间戳）
|-- stats.json         # 全局统计数据（总分发量, 总人数, 今日数量）
|-- faucet.log         # 操作日志（文本格式，每行一条）
```

### 5.3 生成水龙头钱包密钥

```bash
# 方法 1: 使用 Solana CLI
solana-keygen new -o /var/www/eaco-faucet/server/faucet-keypair.json

# 方法 2: 使用 Node.js
node -e "
const web3 = require('@solana/web3.js');
const kp = web3.Keypair.generate();
const fs = require('fs');
fs.writeFileSync('faucet-keypair.json', JSON.stringify(Array.from(kp.secretKey)));
console.log('Public key:', kp.publicKey.toString());
"
```

生成后，记录公钥地址，向该地址转入足够的 EACO 代币作为水龙头储备。

---

## 6. 安全架构说明

### 6.1 四层安全防护

```
第一层: 前端 (HTML + JS)
  |- 钱包连接通过标准 Provider 接口
  |- localStorage 客户端冷却检查
  |- 私钥永远不接触前端代码
  
第二层: PHP 后端
  |- 地址级防重复（168小时/7天冷却，JSON 文件 + 文件锁）
  |- IP 级限流（30分钟一次）
  |- Solana 地址格式验证（Base58, 32-44 字符）
  |- 领取数量范围校验
  
第三层: Node.js 签名服务
  |- 仅监听 127.0.0.1（不对外暴露）
  |- 水龙头私钥仅存在于服务端内存
  |- 无 CORS 头（仅接受 PHP 后端调用）
  |- 交易签名后立即广播到 Solana 主网
  
第四层: Rust 链上程序（可选）
  |- PDA 账户记录领取状态
  |- 链上防重放（不可篡改）
  |- 权限控制（仅 authority 可修改参数）
```

### 6.2 私钥安全

- 水龙头钱包私钥**仅**存在于 `faucet-keypair.json` 文件中
- 该文件位于 `server/` 目录，**不在 Web 根目录下**
- `.gitignore` 已配置忽略该文件
- Node.js 签名服务加载密钥到内存后，不通过任何网络接口暴露
- 前端代码中**没有任何私钥**

### 6.3 防刷机制

| 层级 | 机制 | 说明 |
|------|------|------|
| 客户端 | localStorage | 同一浏览器 168 小时（7 天）冷却 |
| 服务端 | claims.json | 同一钱包地址 168 小时（7 天）冷却 |
| 服务端 | ip_records.json | 同一 IP 30 分钟限一次 |
| 链上 | PDA 账户 | 链上不可篡改的领取记录（Rust 程序） |

---

## 7. 多语言与主题

### 7.1 支持语言

| 代码 | 语言 | 方向 | 状态 |
|------|------|------|------|
| `zh-CN` | 中文 | LTR | 81 个翻译键 |
| `en` | English | LTR | 81 个翻译键 |
| `es` | Espanol | LTR | 81 个翻译键 |
| `fr` | Francais | LTR | 81 个翻译键 |
| `ru` | Русский | LTR | 81 个翻译键 |
| `ar` | العربية | RTL | 81 个翻译键 |

### 7.2 语言切换方式

1. **下拉框选择**：导航栏语言下拉框，6 种语言可选
2. **中英一键切换**：点击导航栏 `EN` / `中文` 按钮，快速切换中英文
3. 语言偏好保存在 localStorage，刷新后保持

### 7.3 主题系统

三种主题通过 CSS 变量实现，切换时无需重载页面：

```css
/* 默认: 星际深空 */
:root { --bg: #0a0e17; --accent: #00d4aa; ... }

/* 地球绿洲 */
[data-theme="green"] { --bg: #0d1410; --accent: #4ade80; ... }

/* 经典商务 */
[data-theme="business"] { --bg: #f0f4f8; --accent: #2563eb; ... }
```

星际深空主题包含 Canvas 动态星空动画（粒子系统），在经典商务主题下自动隐藏。

---

## 8. Rust 链上程序

### 8.1 程序概述

`rust/eaco_faucet.rs` 是基于 Anchor 框架的 Solana 链上程序，提供：

- `initialize`: 初始化水龙头配置（设置代币合约、领取范围、冷却时间）
- `claim`: 用户领取代币（PDA 防重复）
- `update_config`: 更新参数（仅管理员）
- `get_stats`: 查询统计数据

### 8.2 PDA 防重复机制

```
Claim Record PDA = seeds = [b"claim", claimer_pubkey]
```

每个钱包地址对应一个唯一的 PDA 账户，记录：
- `last_claim_time`: 上次领取时间
- `total_claimed`: 累计领取数量
- `claim_count`: 领取次数

链上程序自动检查 `current_time - last_claim_time >= cooldown_seconds`，未到冷却时间则拒绝领取。

### 8.3 构建与部署

```bash
# 前提：已安装 Solana CLI 和 Anchor

cd rust/

# 构建
anchor build

# 部署到 devnet 测试
anchor deploy --provider.cluster devnet

# 部署到 mainnet
anchor deploy --provider.cluster mainnet

# 初始化程序（调用 initialize 指令）
# 需要：配置账户、金库代币账户、管理员签名
```

### 8.4 前端调用链上程序

如果使用 Rust 链上程序代替 PHP 后端，前端需要修改 `claimEACO()` 函数，使用 `@solana/web3.js` 和 `@coral-xyz/anchor` 直接调用链上 `claim` 指令：

```javascript
// 伪代码示例
const program = new Program(IDL, programId, provider);
await program.methods
  .claim(new BN(amount))
  .accounts({
    config: configPda,
    claimRecord: claimRecordPda,
    claimer: wallet.publicKey,
    treasuryAccount: treasuryAta,
    claimerTokenAccount: claimerAta,
    treasury: treasuryAuthority,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([])
  .rpc();
```

---

## 9. API 接口文档

### 9.1 领取代币

**POST** `/claim.php`

请求体：
```json
{
  "address": "7Np41oeYqPefeNQEJv7dE1bRGbM7UwWZqX",
  "amount": 80
}
```

成功响应：
```json
{
  "success": true,
  "txid": "5xK...signature...abc",
  "amount": 80,
  "mode": "live"
}
```

失败响应：
```json
{
  "success": false,
  "error": "Already claimed. Please wait 18 hours."
}
```

### 9.2 查询统计

**GET** `/stats.php`

响应：
```json
{
  "success": true,
  "total_distributed": 12350,
  "total_claimers": 247,
  "today_claims": 18
}
```

### 9.3 签名服务健康检查

**GET** `http://127.0.0.1:3001/health` (仅本地)

响应：
```json
{
  "status": "ok",
  "mode": "live",
  "faucet": "7Np41oeYqPefeNQEJv7dE1bRGbM7UwWZqX"
}
```

### 9.4 签名服务发送代币

**POST** `http://127.0.0.1:3001/send` (仅本地，PHP 后端调用)

请求体：
```json
{
  "recipient": "7Np41oeYqPefeNQEJv7dE1bRGbM7UwWZqX",
  "amount": 80,
  "mint": "DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH"
}
```

---

## 10. 常见问题

### Q: 支持哪些钱包？

**A:** 支持 8 种主流 Solana Web3 钱包：Phantom、Solflare、OKX、Backpack、Gate、Binance、Coinbase、Glow。如果只安装了一个钱包，自动连接；多个钱包则弹出选择器。

### Q: 可以领取 Solana 链上其他 SPL 代币吗？

**A:** 可以。底层是通用 SPL Token 转账机制。修改 `server/config.php` 中的 `EACO_MINT` 和 `rust/eaco_faucet.rs` 中的 mint 地址即可分发其他代币。前端合约地址也需同步修改。

### Q: 不用数据库真的安全吗？

**A:** 文件存储 + 文件锁可以满足小规模水龙头需求。对于大规模空投（万人级别），推荐使用 Rust 链上程序（PDA 防重复），安全性最高。也可以搭配 PHP 文件方案做双重防护。

### Q: 水龙头钱包需要多少 EACO？

**A:** 按每天 100 人领取、每人 50-100 EACO 计算，每天需要 5000-10000 EACO。建议至少储备 1 个月的量（15-30 万 EACO）。

### Q: 用户需要支付 gas 费吗？

**A:** 领取代币本身免费。如果使用 PHP + Node.js 方案，gas 由水龙头钱包支付。如果使用 Rust 链上程序方案，用户需要少量 SOL 作为交易费（约 0.000005 SOL）。

### Q: 如何防止机器人刷量？

**A:** 三重防护：(1) 钱包地址 168 小时（7 天）冷却，(2) IP 地址 30 分钟限频，(3) 可选接入验证码或链上 PDA 记录。对于高安全场景，推荐使用 Rust 链上程序。

### Q: 如何添加新语言？

**A:** 在 `js/i18n.js` 的 `EACO_I18N` 对象中添加新语言条目，复制 `en` 的所有键并翻译值即可。同时在 `index.html` 的 `langSelect` 下拉框中添加对应选项。

### Q: 如何添加新主题？

**A:** 在 `index.html` 的 `<style>` 中添加 `[data-theme="新主题名"]` 的 CSS 变量定义，然后在 `.theme-switcher` 中添加对应的 `.theme-dot` 元素。

### Q: GitHub Pages 上能发真实代币吗？

**A:** GitHub Pages 只能部署静态文件，无法运行 PHP/Node.js 后端。但可以将前端放 GitHub Pages，后端放 VPS，通过 `js/config.js` 连接。或者使用 Rust 链上程序方案，前端直接与 Solana 链交互。

---

## 11. 文件清单

```
eaco-faucet/
|
|-- index.html                  # 主页面 (387行)
|
|-- js/
|   |-- config.js               # 前端配置 - 后端地址
|   |-- i18n.js                 # 6种语言翻译 (81键 x 6 = 486条翻译)
|   |-- app.js                  # 前端核心逻辑 (813行)
|       |-- 钱包检测 (8种钱包)
|       |-- 钱包选择器 UI
|       |-- 连接/断开逻辑
|       |-- 领取逻辑
|       |-- 主题切换 (3种)
|       |-- 语言切换 (6种 + 中英一键)
|       |-- 星空动画 (Canvas)
|       |-- 合约地址复制
|       |-- 统计数据获取
|
|-- server/
|   |-- config.php              # 后端配置
|   |-- claim.php               # 领取接口 (283行)
|   |-- stats.php               # 统计接口
|   |-- signer.js               # Node.js 签名服务 (183行)
|   |-- package.json            # Node.js 依赖
|
|-- rust/
|   |-- eaco_faucet.rs          # Solana 链上程序 (293行)
|   |-- Cargo.toml              # Rust 依赖
|   |-- Anchor.toml             # Anchor 配置
|
|-- .gitignore                  # Git 忽略规则
|-- README.md                   # 项目说明
|-- MANUAL.md                   # 本文档
```

---

## EACO 基本信息

| 项目 | 内容 |
|------|------|
| 名称 | EACO (Earth's Best Coin) |
| 简称 | EACO / E |
| 区块链 | Solana |
| 类型 | SPL Token |
| 合约地址 | `DqfoyZH96RnvZusSp3Cdncjpyp3C74ZmJzGhjmHnDHRH` |
| 核心概念 | Energy x Attitude x Cooperation x Optimization |
| 定位 | Earth's Best AI + RWA + Web3 crypto asset |
| 公式 | EACO = Positive Energy x Positive Mindset x Global Collaboration x Continuous Optimization |
| 目标 | 提升个人认知 / 提升组织效率 / 提升社会文明 / 促进地球可持续发展 / 与100个认知模型结合 |

---

*EACO is a community MEME token on Solana. Not financial advice. DYOR.*
*EACO 是 Solana 上的社区 MEME 通证。不构成投资建议。请自行研究 (DYOR)。*
