(function () {
  'use strict';

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Mobile nav toggle
  --------------------------------------------------------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------
     Live token generator (60s cycle), synced hero + contact game
  --------------------------------------------------------- */
  function randomCode() {
    var n = Math.floor(100000 + Math.random() * 900000).toString();
    return n.slice(0, 3) + ' ' + n.slice(3);
  }

  var currentToken = randomCode();
  var tokenTargets = [
    document.getElementById('heroToken'),
    document.getElementById('gameToken')
  ].filter(Boolean);

  function renderToken() {
    var parts = currentToken.split(' ');
    tokenTargets.forEach(function (el) {
      el.innerHTML =
        '<span class="token-half">' + parts[0] + '</span>' +
        '<span class="token-sep"> </span>' +
        '<span class="token-half">' + parts[1] + '</span>';
    });
  }
  renderToken();

  var CYCLE_MS = 60000;
  var cycleStart = Date.now();
  var progressBar = document.getElementById('heroProgress');

  function tick() {
    var elapsed = Date.now() - cycleStart;
    var pct = Math.max(0, 1 - elapsed / CYCLE_MS);
    if (progressBar) progressBar.style.transform = 'scaleX(' + pct + ')';
    if (elapsed >= CYCLE_MS) {
      currentToken = randomCode();
      renderToken();
      cycleStart = Date.now();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---------------------------------------------------------
     Decode / scramble text effect for eyebrow + mini terminal labels
  --------------------------------------------------------- */
  var SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#________';

  function scrambleInto(el, finalText, duration) {
    var start = null;
    var len = finalText.length;
    function frame(ts) {
      if (!start) start = ts;
      var progress = Math.min(1, (ts - start) / duration);
      var revealCount = Math.floor(progress * len);
      var out = '';
      for (var i = 0; i < len; i++) {
        if (i < revealCount || finalText[i] === ' ' || finalText[i] === '·') {
          out += finalText[i];
        } else {
          out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
      }
      el.textContent = out;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = finalText;
      }
    }
    requestAnimationFrame(frame);
  }

  var decodeEls = document.querySelectorAll('[data-decode]');
  var decodeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.decoded) {
        entry.target.dataset.decoded = 'true';
        var finalText = entry.target.getAttribute('data-decode');
        var dot = entry.target.querySelector('.dot');
        // separate the text node from the optional status dot
        var textNode = document.createElement('span');
        entry.target.textContent = '';
        if (dot) entry.target.appendChild(dot);
        entry.target.appendChild(textNode);
        scrambleInto(textNode, finalText, 700);
        decodeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  decodeEls.forEach(function (el) { decodeObserver.observe(el); });

  /* ---------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    '.terrain-card, .work-card, .hop-detail, .impact-copy, .impact-panels, .section-head, .timeline-item, .cert-card, .skill-category, .highlight-card, .edu-card, .blog-card'
  );
  revealTargets.forEach(function (el) { el.classList.add('reveal'); });
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(function (el) { revealObserver.observe(el); });

  /* ---------------------------------------------------------
     Blog carousel — 3-up on desktop, arrows + drag/swipe
  --------------------------------------------------------- */
  (function () {
    var viewport = document.querySelector('#blogCarousel .blog-viewport');
    var track = document.getElementById('blogTrack');
    var prevBtn = document.getElementById('blogPrev');
    var nextBtn = document.getElementById('blogNext');
    if (!viewport || !track || !prevBtn || !nextBtn) return;

    var slides = Array.prototype.slice.call(track.children);
    if (!slides.length) return;

    var GAP = 20;
    var index = 0;
    var itemsPerView = 3;
    var cardWidth = 0;
    var step = 0;

    var isDragging = false;
    var dragStartX = 0;
    var dragBaseTranslate = 0;
    var dragDelta = 0;

    function itemsForWidth(w) {
      if (w >= 900) return 3;
      if (w >= 640) return 2;
      return 1;
    }

    function maxIndex() {
      return Math.max(0, slides.length - itemsPerView);
    }

    function measure() {
      itemsPerView = itemsForWidth(viewport.clientWidth);
      cardWidth = (viewport.clientWidth - GAP * (itemsPerView - 1)) / itemsPerView;
      step = cardWidth + GAP;
      slides.forEach(function (card) { card.style.width = cardWidth + 'px'; });
      index = Math.min(index, maxIndex());
    }

    function render() {
      track.style.transform = 'translateX(-' + (index * step) + 'px)';
      prevBtn.disabled = index <= 0;
      nextBtn.disabled = index >= maxIndex();
    }

    function goTo(i) {
      index = Math.max(0, Math.min(maxIndex(), i));
      render();
    }

    prevBtn.addEventListener('click', function () { goTo(index - 1); });
    nextBtn.addEventListener('click', function () { goTo(index + 1); });

    var resizeTimer = null;
    function scheduleRemeasure() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (isDragging) return;
        measure();
        render();
      }, 120);
    }

    window.addEventListener('resize', scheduleRemeasure);
    window.addEventListener('orientationchange', scheduleRemeasure);
    window.addEventListener('load', scheduleRemeasure);

    /* Catches layout shifts a resize event wouldn't fire for
       (web fonts settling, dynamic content, etc.) so the card
       width/count stays correct on every device. */
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(scheduleRemeasure).observe(viewport);
    }

    /* Click-hold / touch drag — unified via Pointer Events */
    track.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button, a')) return;
      isDragging = true;
      dragDelta = 0;
      dragStartX = e.clientX;
      dragBaseTranslate = -index * step;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      dragDelta = e.clientX - dragStartX;
      track.style.transform = 'translateX(' + (dragBaseTranslate + dragDelta) + 'px)';
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      var threshold = Math.max(40, cardWidth * 0.18);
      if (dragDelta <= -threshold) {
        goTo(index + 1);
      } else if (dragDelta >= threshold) {
        goTo(index - 1);
      } else {
        render();
      }
      dragDelta = 0;
    }

    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', function () { if (isDragging) endDrag(); });

    measure();
    render();
  })();

  /* ---------------------------------------------------------
     Feed ticker (synthetic PingAM-style authentication tree log)
  --------------------------------------------------------- */
  var AUTH_NODES = ['UsernamePassword', 'DeviceProfile', 'PushNotification', 'LDAPDecision', 'ScriptedNode', 'OIDCTokenIssuer'];
  var RESULTS = ['AUTH_TREE_SUCCESS', 'AUTH_TREE_SUCCESS', 'AUTH_TREE_SUCCESS', 'AUTH_TREE_CHALLENGE', 'AUTH_TREE_FAIL'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function randomUser() {
    return 'u***' + Math.floor(10 + Math.random() * 89);
  }
  function makeLogLine(baseDate) {
    var result = RESULTS[Math.floor(Math.random() * RESULTS.length)];
    var node = AUTH_NODES[Math.floor(Math.random() * AUTH_NODES.length)];
    var rtt = Math.floor(6 + Math.random() * 35);
    return pad(baseDate.getHours()) + ':' + pad(baseDate.getMinutes()) + ':' + pad(baseDate.getSeconds()) +
      ' ' + result + ' user=' + randomUser() + ' node=' + node + ' rtt=' + rtt + 'ms';
  }

  function buildFeed(containerId, count, withRtt) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var lines = [];
    var now = new Date();
    for (var i = 0; i < count; i++) {
      now = new Date(now.getTime() + (2000 + Math.random() * 3000));
      lines.push(withRtt ? makeLogLine(now) : makeLogLine(now).replace(/ rtt=\d+ms$/, ''));
    }
    // duplicate for seamless scroll loop
    var html = lines.concat(lines).map(function (l) {
      return '<span>' + l + '</span>';
    }).join('');
    container.innerHTML = html;
  }

  buildFeed('feedTrack', 18, true);

  /* ---------------------------------------------------------
     Impact section: splunk feed, hex dump, bar chart
  --------------------------------------------------------- */
  (function buildSplunkFeed() {
    var el = document.getElementById('splunkFeed');
    if (!el) return;
    var now = new Date();
    var out = [];
    for (var i = 0; i < 9; i++) {
      now = new Date(now.getTime() + 900);
      out.push(makeLogLine(now).replace(/ rtt=\d+ms$/, '').replace('user=', '').replace('node=', ''));
    }
    el.textContent = out.join('\n');
  })();

  (function buildTokenSample() {
    var el = document.getElementById('hexDump');
    if (!el) return;
    // Illustrative OIDC ID token payload — sample claims only, not a real token.
    var sample = {
      iss: 'https://openam.example.com/am/oauth2',
      sub: 'usr-' + Math.random().toString(16).slice(2, 10),
      aud: 'my-client-app',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      amr: ['pwd', 'otp'],
      acr: 'urn:ping:loa:step-up'
    };
    el.textContent = JSON.stringify(sample, null, 2);
  })();

  (function buildBarChart() {
    var el = document.getElementById('barChart');
    if (!el) return;
    var html = '';
    for (var i = 0; i < 24; i++) {
      var h = 30 + Math.random() * 70;
      html += '<span style="height:' + h.toFixed(0) + '%"></span>';
    }
    el.innerHTML = html;
  })();

  /* ---------------------------------------------------------
     Five Hops tab switching
  --------------------------------------------------------- */
  var hopData = [
    {
      label: 'STEP 01 · REQUEST',
      title: 'User Requests a Protected Application',
      body: 'A user tries to open an application that requires authentication. The app redirects the browser to PingAM, which starts the configured authentication tree for that application.',
      telemetryLabel: 'ILLUSTRATIVE TREE CONTEXT',
      telemetry: 'APP: protected-app\nTREE: LoginJourney\nSTATUS: TREE_STARTED'
    },
    {
      label: 'STEP 02 · AUTHENTICATION TREE',
      title: 'PingAM Routes the Journey Through Configured Nodes',
      body: 'PingAM evaluates the authentication tree node by node — username/password, social login, or risk signals — deciding which path the user takes next based on the journey design.',
      telemetryLabel: 'ILLUSTRATIVE TREE CONTEXT',
      telemetry: 'NODE: UsernamePassword\nNEXT: DeviceProfile\nSTATUS: IN_PROGRESS'
    },
    {
      label: 'STEP 03 · CUSTOM NODE',
      title: 'A Custom Node Applies Business Logic',
      body: 'A custom authentication node (JavaScript / Groovy) runs — calling an internal REST API, checking a business rule, or enriching the session with extra context before the journey continues.',
      telemetryLabel: 'ILLUSTRATIVE TREE CONTEXT',
      telemetry: 'NODE: ScriptedDecisionNode\nAPI_CALL: internal-service/verify\nSTATUS: CONDITION_MET'
    },
    {
      label: 'STEP 04 · STEP-UP MFA',
      title: 'Policy Triggers a Step-Up Challenge',
      body: 'Where policy requires it, the journey challenges the user with a one-time code or push notification and confirms it before letting the session proceed.',
      telemetryLabel: 'ILLUSTRATIVE TREE CONTEXT',
      telemetry: 'NODE: PushNotification\nPOLICY: step-up-required\nSTATUS: OTP_CONFIRMED'
    },
    {
      label: 'STEP 05 · TOKEN ISSUED',
      title: 'Session Is Federated via OIDC or SAML',
      body: 'PingAM issues the session and, where the application needs it, an OIDC ID token or SAML assertion — federating identity to the application with the claims it needs.',
      telemetryLabel: 'ILLUSTRATIVE TREE CONTEXT',
      telemetry: 'TOKEN_TYPE: OIDC ID Token\nAMR: pwd, otp\nSTATUS: ISSUED'
    }
  ];

  var hopTabs = document.querySelectorAll('.hop-tab');
  var hopDetail = document.getElementById('hopDetail');

  function renderHop(index) {
    if (!hopDetail) return;
    var d = hopData[index];
    hopDetail.innerHTML =
      '<div>' +
      '<span class="hop-detail-label">' + d.label + '</span>' +
      '<h3>' + d.title + '</h3>' +
      '<p>' + d.body + '</p>' +
      '</div>' +
      '<div>' +
      '<span class="hop-telemetry-label">' + d.telemetryLabel + '</span>' +
      '<div class="hop-telemetry">' + d.telemetry + '</div>' +
      '</div>';
  }

  hopTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      hopTabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      renderHop(parseInt(tab.getAttribute('data-hop'), 10));
    });
  });

  if (hopDetail) renderHop(0);

  /* ---------------------------------------------------------
     Contact token-match game
  --------------------------------------------------------- */
  var tokenInput = document.getElementById('tokenInput');
  var authenticateBtn = document.getElementById('authenticateBtn');
  var skipBtn = document.getElementById('skipBtn');
  var tokenResult = document.getElementById('tokenResult');
  var tokenGame = document.getElementById('tokenGame');
  var contactGateMsg = document.getElementById('contactGateMsg');
  var gatedLinks = document.querySelectorAll('.gated-link');
  var isAuthenticated = false;

  function normalize(v) { return (v || '').replace(/\s+/g, ''); }

  function unlockContact() {
    isAuthenticated = true;
    if (contactGateMsg) contactGateMsg.textContent = '';
  }

  if (authenticateBtn) {
    authenticateBtn.addEventListener('click', function () {
      var expected = normalize(currentToken);
      var given = normalize(tokenInput.value);
      if (!given) {
        tokenResult.textContent = 'Enter the 6 digits shown above first.';
        tokenResult.className = 'token-game-result bad';
        return;
      }
      if (given === expected) {
        tokenResult.textContent = 'Authenticated — that’s step-up MFA working as intended. Reach out any time.';
        tokenResult.className = 'token-game-result ok';
        unlockContact();
      } else {
        tokenResult.textContent = 'That code just rotated or doesn’t match — try the current one.';
        tokenResult.className = 'token-game-result bad';
      }
    });
  }
  if (skipBtn) {
    skipBtn.addEventListener('click', function () {
      tokenResult.textContent = 'Skipped — step-up is optional, after all.';
      tokenResult.className = 'token-game-result ok';
      unlockContact();
    });
  }

  if (gatedLinks.length && tokenGame) {
    gatedLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (isAuthenticated) return;
        e.preventDefault();
        if (contactGateMsg) {
          contactGateMsg.textContent = '🔒 Please complete the authentication below to unlock contact details.';
        }
        tokenGame.scrollIntoView({ behavior: 'smooth', block: 'center' });
        tokenGame.classList.remove('is-highlight');
        void tokenGame.offsetWidth; /* restart animation */
        tokenGame.classList.add('is-highlight');
        if (tokenInput) tokenInput.focus();
      });
    });
  }
  if (tokenInput) {
    tokenInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') authenticateBtn.click();
    });
  }

  /* ---------------------------------------------------------
     Blog post modal
  --------------------------------------------------------- */
  (function () {
    var modal = document.getElementById('blogModal');
    var modalTitle = document.getElementById('blogModalTitle');
    var modalBody = document.getElementById('blogModalBody');
    var closeTop = document.getElementById('blogModalCloseTop');
    var closeBottom = document.getElementById('blogModalCloseBottom');
    var triggers = document.querySelectorAll('.blog-card .blog-link');
    if (!modal || !triggers.length) return;

    var lastFocused = null;

    function openModal(title, body) {
      lastFocused = document.activeElement;
      modalTitle.textContent = title;
      modalBody.textContent = body;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeTop.focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(
          btn.getAttribute('data-post-title') || '',
          btn.getAttribute('data-post-body') || ''
        );
      });
    });

    if (closeTop) closeTop.addEventListener('click', closeModal);
    if (closeBottom) closeBottom.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  })();

})();
