/* EACO Faucet v0.01 - Zero-Barrier Frontend (No Wallet Required) - DEMO */
/* Features: Address input, Claim, Theme switch, Language switch, Starfield animation */

(function() {
  'use strict';

  // -- State --
  var currentLang = localStorage.getItem('eaco_lang') || 'zh-CN';
  var currentTheme = localStorage.getItem('eaco_theme') || 'default';

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

  // -- Donation QR Code --
  function initDonateQR() {
    var qrContainer = $('donateQR');
    if (!qrContainer) return;
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
      s.opacity += s.twinkleSpeed * s.twinkleDir;
      if (s.opacity > 1) { s.opacity = 1; s.twinkleDir = -1; }
      if (s.opacity < 0.15) { s.opacity = 0.15; s.twinkleDir = 1; }

      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = starCanvas.width;
      if (s.x > starCanvas.width) s.x = 0;
      if (s.y < 0) s.y = starCanvas.height;
      if (s.y > starCanvas.height) s.y = 0;

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
    if (hex.indexOf(',') > -1) {
      return 'rgba(' + hex + ',' + alpha + ')';
    }
    return 'rgba(255,255,255,' + alpha + ')';
  }

  // -- Address Validation --
  function isValidSolanaAddress(addr) {
    if (!addr || typeof addr !== 'string') return false;
    // Base58 Solana address: 32-44 chars, alphanumeric excluding 0, O, I, l
    var base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(addr.trim());
  }

  // -- Claim Logic (Zero-Barrier) --
  async function claimEACO() {
    var addressInput = $('addressInput');
    var address = addressInput ? addressInput.value.trim() : '';
    var amount = parseInt($('amountSlider').value);
    var claimBtn = $('claimBtn');

    // Validate address
    if (!address) {
      showStatus(t('status_enter_address'), 'error');
      return;
    }
    if (!isValidSolanaAddress(address)) {
      showStatus(t('status_invalid_address'), 'error');
      return;
    }

    claimBtn.disabled = true;
    claimBtn.innerHTML = '<span class="spinner"></span> ' + t('status_claiming');
    showStatus(t('status_claiming'), 'info');

    try {
      var backendUrl = getBackendUrl();
      if (backendUrl) {
        var resp = await fetch(backendUrl + '/claim.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: address,
            amount: amount
          })
        });
        var data = await resp.json();

        if (data.success) {
          var txMsg = t('status_claim_success') + ' ' + amount + ' EACO!';
          if (data.txid) {
            txMsg += '<br><a href="https://solscan.io/tx/' + data.txid + '" target="_blank" rel="noopener" class="tx-link">' + t('status_tx_link') + ': ' + data.txid.slice(0,16) + '...</a>';
          }
          showStatus(txMsg, 'success');
        } else {
          showStatus(t('status_claim_failed') + ' ' + (data.error || 'Unknown error'), 'error');
        }
      } else {
        // Demo mode
        showStatus(t('status_claiming') + ' (Demo Mode - No Backend)', 'info');
        setTimeout(function() {
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
    if (window.EACO_BACKEND) return window.EACO_BACKEND;
    if (window.location.protocol === 'file:' || window.location.hostname.indexOf('github.io') > -1) {
      return null;
    }
    return window.location.origin + '/server';
  }

  // -- Status Display --
  function showStatus(msg, type) {
    var el = $('statusMsg');
    el.className = 'status-msg show ' + type;
    el.innerHTML = msg;
  }

  function showSuccess(msg) { showStatus(msg, 'success'); }
  function showError(msg) { showStatus(msg, 'error'); }

  function hideStatus() {
    var el = $('statusMsg');
    el.className = 'status-msg';
    el.innerHTML = '';
  }

  // -- Stats Fetch --
  async function fetchStats() {
    var backendUrl = getBackendUrl();
    if (!backendUrl) {
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

  function formatNumber(n) {
    return (n || 0).toLocaleString();
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

    // Address input validation
    var addressInput = $('addressInput');
    if (addressInput) {
      addressInput.addEventListener('input', function() {
        var val = this.value.trim();
        if (val && !isValidSolanaAddress(val)) {
          this.style.borderColor = 'var(--danger)';
        } else {
          this.style.borderColor = '';
        }
      });
    }

    // Claim button
    var clb = $('claimBtn');
    if (clb) clb.addEventListener('click', claimEACO);
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
