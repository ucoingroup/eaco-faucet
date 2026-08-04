/* EACO Faucet - Frontend Application Logic */
/* Features: Wallet connect, Claim, Theme switch, Language switch, Starfield animation */

(function() {
  'use strict';

  // -- State --
  var currentLang = localStorage.getItem('eaco_lang') || 'zh-CN';
  var currentTheme = localStorage.getItem('eaco_theme') || 'default';
  var walletConnected = false;
  var walletAddress = null;
  var walletProvider = null;

  // -- DOM refs --
  var $ = function(id) { return document.getElementById(id); };
  var $$ = function(sel) { return document.querySelectorAll(sel); };

  // -- i18n --
  function t(key) {
    var lang = EACO_I18N[currentLang] || EACO_I18N['en'];
    return lang[key] || EACO_I18N['en'][key] || key;
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('eaco_lang', lang);
    document.documentElement.lang = lang;

    // RTL for Arabic
    if (lang === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }

    // Update all data-i18n elements
    $$('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    // Update lang select
    var ls = $('langSelect');
    if (ls) ls.value = lang;

    // Update CA label
    var caLabel = document.querySelector('[data-i18n="ca_label"]');
    if (caLabel) caLabel.textContent = t('ca_label');

    // Update slider label
    updateSliderLabel();
  }

  // -- Theme --
  function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('eaco_theme', theme);

    if (theme === 'default') {
      document.body.removeAttribute('data-theme');
    } else {
      document.body.setAttribute('data-theme', theme);
    }

    // Update theme dots
    $$('.theme-dot').forEach(function(dot) {
      if (dot.getAttribute('data-t') === theme) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // Restart starfield for new theme
    if (theme === 'business') {
      var sf = $('starfield');
      if (sf) sf.style.display = 'none';
    } else {
      var sf2 = $('starfield');
      if (sf2) sf2.style.display = '';
      initStarfield();
    }
  }

  // -- Footer Links --
  function buildFooterLinks() {
    var container = $('footerLinks');
    if (!container) return;
    container.innerHTML = '';
    EACO_LINKS.forEach(function(link) {
      var a = document.createElement('a');
      a.className = 'footer-link';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = t(link.key);
      container.appendChild(a);
    });
  }

  // -- CA Copy --
  function initCACopy() {
    var caBox = $('caBox');
    if (!caBox) return;
    caBox.addEventListener('click', function() {
      var ca = EACO_CA;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ca).then(function() {
          showCopyHint();
        });
      } else {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = ca;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(e) {}
        document.body.removeChild(ta);
        showCopyHint();
      }
    });
  }

  function showCopyHint() {
    var hint = document.querySelector('.copy-hint');
    if (hint) {
      var orig = t('ca_copy_hint');
      hint.textContent = t('ca_copied');
      setTimeout(function() { hint.textContent = orig; }, 2000);
    }
  }

  // -- Donation Address Copy --
  // FAUCET_WALLET is the public Solana address for receiving community donations
  var FAUCET_WALLET = '5dcBHpYzXXBmN2qUU4a7QytuVbJ77K5YBa3LCwNqDwXD';

  window.copyDonateAddr = function() {
    var addr = FAUCET_WALLET;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(addr).then(function() {
        showDonateCopyHint();
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = addr;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(ta);
      showDonateCopyHint();
    }
  };

  function showDonateCopyHint() {
    var hint = document.querySelector('.donate-copy-hint');
    if (hint) {
      var orig = t('donate_copy_hint');
      hint.textContent = t('ca_copied');
      setTimeout(function() { hint.textContent = orig; }, 2000);
    }
  }

  // -- Donation QR Code (using public API, no dependency) --
  function initDonateQR() {
    var qrContainer = $('donateQR');
    if (!qrContainer) return;
    // Use api.qrserver.com (free, no key needed) to generate QR
    var addr = FAUCET_WALLET;
    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' + encodeURIComponent(addr);
    var img = document.createElement('img');
    img.src = qrUrl;
    img.alt = 'EACO Faucet Wallet QR';
    img.onload = function() { qrContainer.style.display = 'flex'; };
    img.onerror = function() { qrContainer.style.display = 'none'; };
    qrContainer.innerHTML = '';
    qrContainer.appendChild(img);
  }

  // -- Slider --
  function updateSliderLabel() {
    var slider = $('amountSlider');
    var val = $('sliderValue');
    var display = $('amountDisplay');
    if (!slider) return;
    val.textContent = slider.value + ' EACO';
    display.textContent = slider.value;
  }

  function initSlider() {
    var slider = $('amountSlider');
    if (!slider) return;
    slider.addEventListener('input', updateSliderLabel);
  }

  // -- Starfield Animation --
  var starCanvas, starCtx, stars = [], animId = null;

  function initStarfield() {
    starCanvas = $('starfield');
    if (!starCanvas) return;
    if (currentTheme === 'business') {
      starCanvas.style.display = 'none';
      return;
    }
    starCanvas.style.display = '';
    starCtx = starCanvas.getContext('2d');

    resizeCanvas();
    createStars();

    if (animId) cancelAnimationFrame(animId);
    animateStars();

    window.addEventListener('resize', function() {
      resizeCanvas();
      createStars();
    });
  }

  function resizeCanvas() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    var count = Math.floor((starCanvas.width * starCanvas.height) / 8000);
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * starCanvas.width,
        y: Math.random() * starCanvas.height,
        r: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleDir: 1,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05
      });
    }
  }

  function animateStars() {
    if (currentTheme === 'business') return;
    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);

    var starColor = getComputedStyle(document.body).getPropertyValue('--star-color').trim() || '#fff';

    stars.forEach(function(s) {
      // Twinkle
      s.opacity += s.twinkleSpeed * s.twinkleDir;
      if (s.opacity > 1) { s.opacity = 1; s.twinkleDir = -1; }
      if (s.opacity < 0.15) { s.opacity = 0.15; s.twinkleDir = 1; }

      // Drift
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = starCanvas.width;
      if (s.x > starCanvas.width) s.x = 0;
      if (s.y < 0) s.y = starCanvas.height;
      if (s.y > starCanvas.height) s.y = 0;

      // Draw
      starCtx.beginPath();
      starCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      var rgba = hexToRgba(starColor, s.opacity);
      starCtx.fillStyle = rgba;
      starCtx.fill();
    });

    animId = requestAnimationFrame(animateStars);
  }

  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '').replace('rgb(', '').replace(')', '').trim();
    if (hex.length === 3) {
      hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    if (hex.length === 6) {
      var r = parseInt(hex.substr(0,2), 16);
      var g = parseInt(hex.substr(2,2), 16);
      var b = parseInt(hex.substr(4,2), 16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    // If it's already like "d4e8d4" without #
    if (hex.indexOf(',') > -1) {
      return 'rgba(' + hex + ',' + alpha + ')';
    }
    return 'rgba(255,255,255,' + alpha + ')';
  }

  // -- Wallet Connection --
  // Supports all major Solana Web3 wallets:
  //   Phantom, Solflare, OKX, Backpack, Gate, Binance, Coinbase, Glow
  function getInstalledWallets() {
    var wallets = [];

    // Phantom - injects window.solana with isPhantom=true
    if (window.solana && window.solana.isPhantom) {
      wallets.push({
        provider: window.solana,
        name: 'Phantom',
        icon: 'https://phantom.app/img/logo.png',
        url: 'https://phantom.app/',
        inject: 'window.solana'
      });
    }

    // Solflare - injects window.solflare
    if (window.solflare) {
      wallets.push({
        provider: window.solflare,
        name: 'Solflare',
        icon: 'https://solflare.com/assets/logo.svg',
        url: 'https://solflare.com/',
        inject: 'window.solflare'
      });
    }

    // OKX Wallet - injects window.okxwallet
    if (window.okxwallet) {
      wallets.push({
        provider: window.okxwallet,
        name: 'OKX',
        icon: 'https://static.okx.com/cdn/assets/imgs/247/58E63FEA47A2B7D7.png',
        url: 'https://www.okx.com/web3',
        inject: 'window.okxwallet'
      });
    }

    // Backpack - injects window.backpack
    if (window.backpack) {
      wallets.push({
        provider: window.backpack,
        name: 'Backpack',
        icon: 'https://backpack.app/favicon.ico',
        url: 'https://backpack.app/',
        inject: 'window.backpack'
      });
    }

    // Gate Web3 Wallet - injects window.gatewallet
    if (window.gatewallet) {
      wallets.push({
        provider: window.gatewallet,
        name: 'Gate',
        icon: 'https://www.gate.io/favicon.ico',
        url: 'https://www.gate.io/web3',
        inject: 'window.gatewallet'
      });
    }

    // Binance Web3 Wallet - injects window.BinanceChain (BSC) or via window.ethereum.providers
    // Binance W3W often registers via EIP-6963 or as window.bn or window.BinanceChain
    if (window.BinanceChain) {
      wallets.push({
        provider: window.BinanceChain,
        name: 'Binance',
        icon: 'https://public.bnbstatic.com/static/images/common/favicon.ico',
        url: 'https://www.binance.com/en/web3wallet',
        inject: 'window.BinanceChain'
      });
    }

    // Coinbase Wallet - injects window.coinbaseSolana or via coinbaseWalletExtension
    if (window.coinbaseSolana) {
      wallets.push({
        provider: window.coinbaseSolana,
        name: 'Coinbase',
        icon: 'https://www.coinbase.com/favicon.ico',
        url: 'https://www.coinbase.com/wallet',
        inject: 'window.coinbaseSolana'
      });
    }

    // Glow Wallet - injects window.glow
    if (window.glow) {
      wallets.push({
        provider: window.glow,
        name: 'Glow',
        icon: 'https://glow.app/favicon.ico',
        url: 'https://glow.app/',
        inject: 'window.glow'
      });
    }

    // Generic window.solana fallback (some wallets override window.solana)
    if (window.solana && !window.solana.isPhantom && wallets.length === 0) {
      wallets.push({
        provider: window.solana,
        name: 'Solana',
        icon: '',
        url: '',
        inject: 'window.solana'
      });
    }

    return wallets;
  }

  // Known wallet download links for when wallet is not installed
  var WALLET_DOWNLOADS = {
    'Phantom':  'https://phantom.app/',
    'Solflare': 'https://solflare.com/',
    'OKX':      'https://www.okx.com/web3',
    'Backpack': 'https://backpack.app/',
    'Gate':     'https://www.gate.io/web3',
    'Binance':  'https://www.binance.com/en/web3wallet',
    'Coinbase': 'https://www.coinbase.com/wallet',
    'Glow':     'https://glow.app/'
  };

  // Show wallet selector modal
  function showWalletSelector() {
    var installed = getInstalledWallets();

    // Build modal
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:20px';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:var(--card);border:1px solid var(--border);border-radius:16px;padding:28px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3)';

    var title = document.createElement('h3');
    title.textContent = t('wallet_select_title');
    title.style.cssText = 'font-size:18px;font-weight:700;margin-bottom:16px;text-align:center;color:var(--text)';
    modal.appendChild(title);

    if (installed.length === 0) {
      // No wallets installed - show download links
      var noWalletMsg = document.createElement('p');
      noWalletMsg.textContent = t('status_no_wallet');
      noWalletMsg.style.cssText = 'font-size:13px;color:var(--text2);text-align:center;margin-bottom:16px';
      modal.appendChild(noWalletMsg);

      var downloadGrid = document.createElement('div');
      downloadGrid.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px';

      Object.keys(WALLET_DOWNLOADS).forEach(function(name) {
        var a = document.createElement('a');
        a.href = WALLET_DOWNLOADS[name];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = name;
        a.style.cssText = 'display:block;text-align:center;padding:10px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);text-decoration:none;font-size:13px;cursor:pointer;transition:all .2s';
        a.onmouseenter = function() { this.style.borderColor = 'var(--accent)'; };
        a.onmouseleave = function() { this.style.borderColor = 'var(--border)'; };
        downloadGrid.appendChild(a);
      });

      modal.appendChild(downloadGrid);
    } else {
      // Show installed wallets
      var list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;gap:8px';

      installed.forEach(function(w) {
        var btn = document.createElement('button');
        btn.style.cssText = 'display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all .2s;width:100%;color:var(--text);font-size:14px;font-family:inherit';
        btn.onmouseenter = function() { this.style.borderColor = 'var(--accent)'; this.style.transform = 'translateY(-1px)'; };
        btn.onmouseleave = function() { this.style.borderColor = 'var(--border)'; this.style.transform = ''; };

        var icon = document.createElement('span');
        icon.style.cssText = 'width:28px;height:28px;border-radius:50%;background:var(--accent);display:inline-flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:12px;flex-shrink:0';
        icon.textContent = w.name.charAt(0);
        if (w.icon) {
          var img = document.createElement('img');
          img.src = w.icon;
          img.style.cssText = 'width:28px;height:28px;border-radius:50%';
          img.onerror = function() { this.style.display = 'none'; };
          icon.innerHTML = '';
          icon.appendChild(img);
        }

        var label = document.createElement('span');
        label.textContent = w.name;

        btn.appendChild(icon);
        btn.appendChild(label);

        btn.onclick = function() {
          overlay.remove();
          doConnect(w);
        };

        list.appendChild(btn);
      });

      modal.appendChild(list);

      // Also show "more wallets" download links
      if (installed.length < Object.keys(WALLET_DOWNLOADS).length) {
        var moreLabel = document.createElement('p');
        moreLabel.textContent = t('wallet_more');
        moreLabel.style.cssText = 'font-size:12px;color:var(--text2);text-align:center;margin:16px 0 8px';
        modal.appendChild(moreLabel);

        var moreGrid = document.createElement('div');
        moreGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:6px';

        var installedNames = installed.map(function(w) { return w.name; });
        Object.keys(WALLET_DOWNLOADS).forEach(function(name) {
          if (installedNames.indexOf(name) > -1) return;
          var a = document.createElement('a');
          a.href = WALLET_DOWNLOADS[name];
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = name;
          a.style.cssText = 'display:block;text-align:center;padding:8px 4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text2);text-decoration:none;font-size:11px';
          moreGrid.appendChild(a);
        });

        modal.appendChild(moreGrid);
      }
    }

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.textContent = t('wallet_close');
    closeBtn.style.cssText = 'margin-top:16px;width:100%;padding:10px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--text2);cursor:pointer;font-size:13px;font-family:inherit';
    closeBtn.onclick = function() { overlay.remove(); };
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);

    // Click outside to close
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
  }

  async function connectWallet() {
    var installed = getInstalledWallets();

    if (installed.length === 0) {
      showWalletSelector();
      return;
    }

    if (installed.length === 1) {
      // Only one wallet, connect directly
      doConnect(installed[0]);
      return;
    }

    // Multiple wallets, show selector
    showWalletSelector();
  }

  async function doConnect(walletInfo) {
    walletProvider = walletInfo.provider;
    showStatus(t('status_connecting') + ' (' + walletInfo.name + ')', 'info');

    try {
      var resp = await walletProvider.connect();
      walletAddress = resp.publicKey.toString();
      walletConnected = true;

      // Save to sessionStorage for auto-reconnect
      sessionStorage.setItem('eaco_wallet', walletAddress);

      // Update UI
      $('connectBtn').style.display = 'none';
      $('walletInfo').classList.add('show');
      $('walletAddress').textContent = walletAddress.slice(0,6) + '...' + walletAddress.slice(-6);
      $('claimBtn').disabled = false;
      $('disconnectBtn').style.display = '';
      $('disconnectBtn').textContent = t('btn_disconnect') + ' (' + walletInfo.name + ')';

      // Fetch SOL balance
      await fetchBalance();

      showStatus(t('status_connected') + ' - ' + walletInfo.name, 'success');

      // Listen for disconnect
      if (walletProvider.on) {
        walletProvider.on('disconnect', function() {
          disconnectWallet();
        });
      }
    } catch (err) {
      showStatus(t('status_claim_failed') + ' ' + (err.message || err), 'error');
    }
  }

  function disconnectWallet() {
    if (walletProvider && walletProvider.disconnect) {
      try { walletProvider.disconnect(); } catch(e) {}
    }
    walletConnected = false;
    walletAddress = null;
    walletProvider = null;

    sessionStorage.removeItem('eaco_wallet');

    $('connectBtn').style.display = '';
    $('walletInfo').classList.remove('show');
    $('claimBtn').disabled = true;
    $('disconnectBtn').style.display = 'none';
    showStatus(t('status_disconnected'), 'info');
  }

  async function fetchBalance() {
    if (!walletAddress) return;
    try {
      var resp = await fetch(EACO_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [walletAddress]
        })
      });
      var data = await resp.json();
      if (data.result) {
        var sol = (data.result.value / 1000000000).toFixed(4);
        $('walletBalance').textContent = sol + ' SOL';
      }
    } catch (err) {
      $('walletBalance').textContent = '-';
    }
  }

  // -- Claim Logic --
  async function claimEACO() {
    if (!walletConnected || !walletAddress) {
      showStatus(t('status_no_wallet'), 'error');
      return;
    }

    var amount = parseInt($('amountSlider').value);
    var claimBtn = $('claimBtn');

    claimBtn.disabled = true;
    claimBtn.innerHTML = '<span class="spinner"></span> ' + t('status_claiming');
    showStatus(t('status_claiming'), 'info');

    try {
      // Step 1: Check local localStorage for recent claim
      var localKey = 'eaco_last_claim_' + walletAddress;
      var lastClaim = parseInt(localStorage.getItem(localKey) || '0');
      var now = Date.now();
      var cooldown = 168 * 60 * 60 * 1000; // 168 hours = 7 days

      if (now - lastClaim < cooldown) {
        var remainingMs = cooldown - (now - lastClaim);
        var remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
        var remainingHours = Math.ceil((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        var remainingText = remainingDays > 0 ? remainingDays + 'd ' + remainingHours + 'h' : remainingHours + 'h';
        showStatus(t('status_already_claimed') + ' (' + remainingText + ')', 'error');
        claimBtn.disabled = false;
        claimBtn.textContent = t('btn_claim');
        return;
      }

      // Step 2: Try backend API (if available)
      var backendUrl = getBackendUrl();
      if (backendUrl) {
        var resp = await fetch(backendUrl + '/claim.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: walletAddress,
            amount: amount
          })
        });
        var data = await resp.json();

        if (data.success) {
          // Success
          localStorage.setItem(localKey, String(now));
          var txMsg = t('status_claim_success') + ' ' + amount + ' EACO!';
          if (data.txid) {
            txMsg += '<br><a href="https://solscan.io/tx/' + data.txid + '" target="_blank" rel="noopener" class="tx-link">' + t('status_tx_link') + ': ' + data.txid.slice(0,16) + '...</a>';
          }
          showStatus(txMsg, 'success');
          await fetchBalance();
        } else {
          showStatus(t('status_claim_failed') + ' ' + (data.error || 'Unknown error'), 'error');
        }
      } else {
        // Step 3: No backend - use client-side transfer (demo mode)
        // User signs a transaction to receive EACO from faucet wallet
        // This requires the faucet wallet to have pre-funded EACO
        showStatus(t('status_claiming') + ' (Demo Mode - No Backend)', 'info');

        // In demo mode, we simulate a claim
        // For real implementation, connect to PHP backend or Rust program
        setTimeout(function() {
          localStorage.setItem(localKey, String(now));
          var demoMsg = t('status_claim_success') + ' ' + amount + ' EACO! (Demo)';
          showStatus(demoMsg, 'success');
          claimBtn.disabled = false;
          claimBtn.textContent = t('btn_claim');
        }, 2000);
        return;
      }
    } catch (err) {
      showStatus(t('status_claim_failed') + ' ' + (err.message || err), 'error');
    }

    claimBtn.disabled = false;
    claimBtn.textContent = t('btn_claim');
  }

  function getBackendUrl() {
    // Check if a backend URL is configured
    // This can be set in a config.js file or window.EACO_BACKEND
    if (window.EACO_BACKEND) return window.EACO_BACKEND;
    // Try to detect if PHP backend is available on same host
    // For GitHub Pages deployment, this will be null (demo mode)
    if (window.location.protocol === 'file:' || window.location.hostname.indexOf('github.io') > -1) {
      return null;
    }
    // For self-hosted, assume backend is at same origin
    return window.location.origin + '/server';
  }

  // -- Status Display --
  function showStatus(msg, type) {
    var el = $('statusMsg');
    el.className = 'status-msg show ' + type;
    el.innerHTML = msg;
  }

  function hideStatus() {
    var el = $('statusMsg');
    el.className = 'status-msg';
    el.innerHTML = '';
  }

  // -- Stats Fetch --
  async function fetchStats() {
    var backendUrl = getBackendUrl();
    if (!backendUrl) {
      // Demo mode - show placeholder numbers
      var st = $('statTotal');
      var sc = $('statClaimers');
      var sd = $('statToday');
      if (st) st.textContent = '12,350';
      if (sc) sc.textContent = '247';
      if (sd) sd.textContent = '18';
      return;
    }
    try {
      var resp = await fetch(backendUrl + '/stats.php');
      var data = await resp.json();
      if (data.success) {
        var st = $('statTotal');
        var sc = $('statClaimers');
        var sd = $('statToday');
        if (st) st.textContent = (data.total_distributed || 0).toLocaleString();
        if (sc) sc.textContent = (data.total_claimers || 0).toLocaleString();
        if (sd) sd.textContent = (data.today_claims || 0).toLocaleString();
      }
    } catch (e) {
      // Silent fail for stats
    }
  }

  // -- Event Listeners --
  function initEventListeners() {
    // Language select
    var ls = $('langSelect');
    if (ls) ls.addEventListener('change', function() { applyLanguage(this.value); });

    // Theme dots
    $$('.theme-dot').forEach(function(dot) {
      dot.addEventListener('click', function() {
        applyTheme(this.getAttribute('data-t'));
      });
    });

    // CA copy
    initCACopy();

    // Slider
    initSlider();

    // Wallet connect
    var cb = $('connectBtn');
    if (cb) cb.addEventListener('click', connectWallet);

    // Claim
    var clb = $('claimBtn');
    if (clb) clb.addEventListener('click', claimEACO);

    // Disconnect
    var db = $('disconnectBtn');
    if (db) db.addEventListener('click', disconnectWallet);

    // Auto-reconnect if previously connected (sessionStorage)
    var prevWallet = sessionStorage.getItem('eaco_wallet');
    if (prevWallet) {
      // Try to reconnect using any installed wallet that is still connected
      setTimeout(function() {
        var installed = getInstalledWallets();
        for (var i = 0; i < installed.length; i++) {
          var w = installed[i];
          if (w.provider && w.provider.connected && w.provider.publicKey) {
            walletProvider = w.provider;
            walletAddress = w.provider.publicKey.toString();
            walletConnected = true;
            $('connectBtn').style.display = 'none';
            $('walletInfo').classList.add('show');
            $('walletAddress').textContent = walletAddress.slice(0,6) + '...' + walletAddress.slice(-6);
            $('claimBtn').disabled = false;
            $('disconnectBtn').style.display = '';
            $('disconnectBtn').textContent = t('btn_disconnect') + ' (' + w.name + ')';
            fetchBalance();
            break;
          }
        }
      }, 500);
    }
  }

  // -- Init --
  function init() {
    applyLanguage(currentLang);
    applyTheme(currentTheme);
    initStarfield();
    initEventListeners();

    // Set CA text
    var caText = $('caText');
    if (caText) caText.textContent = EACO_CA;

    // Build footer links
    buildFooterLinks();

    // Initialize donation QR
    initDonateQR();

    // Update slider
    updateSliderLabel();

    // Fetch stats
    fetchStats();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
