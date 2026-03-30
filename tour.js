/* ═══════════════════════════════════════════════════════════════════
   CITY OF LIES — Virtual Tour Engine · tour.js
   Include this script in any participating page before </body>.
   Start the tour from index.html via startTour() or window.__colTour.start()
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const LS_ACTIVE = 'col_tour_active';
  const LS_STEP   = 'col_tour_step';

  /* ══════════════════════════════════════════════════════════════
     TOUR STEPS
     page:     filename that must be active for this step
     selector: CSS selector to spotlight (null = full-dim, centred card)
     title:    header text
     text:     body — supports \n for paragraph breaks
     position: preferred card placement relative to spotlight
               'right' | 'left' | 'top' | 'bottom' | 'center'
  ══════════════════════════════════════════════════════════════ */
  const STEPS = [

    /* ── index.html ─────────────────────────────────────────── */
    {
      page:     'index.html',
      selector: null,
      title:    'Welcome to City of Lies',
      text:     'Merrehope doesn\'t give up its secrets easily.\n\nThis briefing will walk you through every tool at your disposal — the same tools a detective in a city this compromised needs just to survive. Follow along carefully. You won\'t get a second chance to ask questions.',
      position: 'center',
    },

    /* ── game.html — The Desk ───────────────────────────────── */
    {
      page:     'game.html',
      selector: null,
      title:    'The Detective\'s Desk',
      text:     'This is your command post. Every lead, every piece of evidence, every person connected to this case flows through here.\n\nSeven items are pinned to this board. Each one opens a different part of the investigation. Learn what they do before you touch anything.',
      position: 'center',
    },
    {
      page:     'game.html',
      selector: '#note-evidence',
      title:    'Evidence Locker',
      text:     'Every item recovered from the scene is catalogued here. Evidence moves through three states — Pending, In Analysis, and Logged.\n\nOnly logged evidence is actionable. Submit items to the correct forensic laboratory and wait for the result. Routing matters — the wrong lab wastes time.',
      position: 'right',
    },
    {
      page:     'game.html',
      selector: '#note-suspects',
      title:    'Suspects Board',
      text:     'As you classify characters during your investigation, anyone you mark as a Suspect appears here for quick reference.\n\nNo need to scroll through the full portrait gallery when you already know who you\'re watching.',
      position: 'right',
    },
    {
      page:     'game.html',
      selector: '#note-board',
      title:    'Investigation Board',
      text:     'The nerve centre of the case. CCTV footage, forensic lab reports, audio spectrograms, interview transcripts, metadata snippets, and your active theory all live here.\n\nWatch for amber badges in the sidebar — they mean new material has arrived that you haven\'t reviewed yet.',
      position: 'left',
    },
    {
      page:     'game.html',
      selector: '#note-journal',
      title:    'Field Journal',
      text:     'Your private notebook. Record observations, track leads, and work through your theory before committing to a final report.\n\nThe case timeline is also here — a running log of confirmed events in sequence. It updates as new evidence is logged and transcripts are filed.',
      position: 'left',
    },
    {
      page:     'game.html',
      selector: '#note-audio',
      title:    'Forensics Lab',
      text:     'This is where raw evidence becomes intelligence. Submit physical and digital items to the appropriate division — DNA, Digital & Multimedia, Toxicology, Trace Chemistry, or Metallurgy.\n\nResults take time. Some lab returns will unlock secondary evidence items. Keep checking the board.',
      position: 'left',
    },
    {
      page:     'game.html',
      selector: '#note-report',
      title:    'Final Report',
      text:     'When you are ready to close the case, this is where you do it. Name a perpetrator. State the method. Set out the motive.\n\nBe certain before you sign. The report cannot be retracted. The outcome — one of eight possible endings — depends entirely on the evidence, your meter levels, and your standing with the city\'s factions at the moment of submission.',
      position: 'left',
    },

    /* ── board.html — Investigation Board ──────────────────── */
    {
      page:     'board.html',
      selector: '#sidebar',
      title:    'Navigating the Board',
      text:     'The sidebar organises everything the case has generated. Use it to move between CCTV footage, spectrograms, interview transcripts, metadata snippets, lab documents, and the submission lab.\n\nAmber number badges on any section mean new material has arrived that you haven\'t opened yet.',
      position: 'right',
    },
    {
      page:     'board.html',
      selector: null,
      title:    'Forensic Reports & Documents',
      text:     'Every lab result that comes back from the forensics division is filed here as a formal report — complete with analyst credentials, methodology notes, and findings.\n\nSome reports unlock secondary evidence items. Others gate interview access. A new result will alert you with a modal the moment it arrives.',
      position: 'center',
    },
    {
      page:     'board.html',
      selector: '#panel-lab',
      title:    'The Lab',
      text:     'From inside the board, you can submit evidence directly to any of the five forensic divisions. Select an item from the dropdown, choose the correct lab, and confirm submission.\n\nItems enter analysis immediately. The result returns over time and is filed automatically to your Documents panel.',
      position: 'center',
    },

    /* ── portraits.html — Characters ────────────────────────── */
    {
      page:     'portraits.html',
      selector: '#portrait-grid',
      title:    'Character Portraits',
      text:     'Nineteen individuals are connected to this case. Open any dossier to read their background, classify their role — Suspect, Witness, Person of Interest, or Informant — and access their interview when the time is right.\n\nClassification affects what options are available and how the board organises your case.',
      position: 'top',
    },
    {
      page:     'portraits.html',
      selector: '#filterbar',
      title:    'Interviews & Interrogations',
      text:     'Interviews are evidence-gated — you cannot speak to a character about evidence you haven\'t recovered yet. When an interview is available, the button in their dossier will unlock.\n\nThe outcome is determined by your three meters at the moment you proceed: Influence, City Corruption, and Street Credibility.\n\nUnder § 14-207(b) of the Merrehope Municipal Code, each person may only be formally interviewed once. Choose your moment carefully.',
      position: 'bottom',
    },

    /* ── Final card ─────────────────────────────────────────── */
    {
      page:     'portraits.html',
      selector: null,
      title:    'That\'s Everything.',
      text:     'You have the tools. You have the case.\n\nOne body. Nineteen people with something to hide. Eight possible endings. Merrehope is waiting.\n\nGood luck, Detective.',
      position: 'center',
    },
  ];


  /* ══════════════════════════════════════════════════════════════
     PAGE DETECTION
  ══════════════════════════════════════════════════════════════ */
  function currentPage() {
    const parts = window.location.pathname.split('/');
    const file  = parts[parts.length - 1];
    return file || 'index.html';
  }


  /* ══════════════════════════════════════════════════════════════
     BUILD OVERLAY DOM (once per page load)
  ══════════════════════════════════════════════════════════════ */
  function buildDOM() {
    if (document.getElementById('col-tour-root')) return;

    const root = document.createElement('div');
    root.id = 'col-tour-root';
    root.innerHTML = `
      <style>
        #col-tour-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Four darkening panels that frame the spotlight ── */
        .col-tp {
          position: fixed; z-index: 9000;
          background: rgba(4,2,1,.87);
          pointer-events: all;
          transition: top .35s cubic-bezier(.4,0,.2,1),
                      left .35s cubic-bezier(.4,0,.2,1),
                      width .35s cubic-bezier(.4,0,.2,1),
                      height .35s cubic-bezier(.4,0,.2,1);
        }
        #col-tp-top    { top:0; left:0; right:0; }
        #col-tp-bottom { left:0; right:0; bottom:0; }
        #col-tp-left   { }
        #col-tp-right  { right:0; }

        /* ── Amber ring around the spotlit element ── */
        #col-tour-ring {
          position: fixed; z-index: 9001; pointer-events: none;
          border: 1px solid rgba(168,131,46,.5);
          box-shadow: 0 0 0 3px rgba(168,131,46,.07),
                      inset 0 0 24px rgba(168,131,46,.05);
          border-radius: 3px;
          transition: all .35s cubic-bezier(.4,0,.2,1);
        }

        /* ── Tooltip card ── */
        #col-tour-card {
          position: fixed; z-index: 9010;
          width: clamp(270px, 28vw, 390px);
          background: #0d0904;
          border: 1px solid rgba(168,131,46,.38);
          box-shadow: 0 0 0 1px rgba(168,131,46,.07),
                      0 24px 70px rgba(0,0,0,.95),
                      0 0 50px rgba(168,131,46,.04);
          display: flex; flex-direction: column;
          opacity: 1; pointer-events: all;
          transition: opacity .22s ease, transform .22s ease;
        }
        #col-tour-card.col-fade {
          opacity: 0; transform: translateY(7px);
        }

        /* Card header */
        #col-tour-head {
          padding: 13px 17px 10px;
          border-bottom: 1px solid rgba(168,131,46,.14);
          display: flex; flex-direction: column; gap: 3px;
        }
        #col-tour-counter {
          font-family: 'Courier Prime', monospace;
          font-size: 8px; letter-spacing: .4em; text-transform: uppercase;
          color: rgba(168,131,46,.45);
        }
        #col-tour-title {
          font-family: 'Courier Prime', monospace;
          font-size: clamp(11px, 1.3vw, 13px); letter-spacing: .1em;
          text-transform: uppercase; color: #c47c1a; line-height: 1.3;
        }

        /* Card body */
        #col-tour-body {
          padding: 13px 17px;
          font-family: 'Courier Prime', monospace;
          font-size: clamp(10px, 1.1vw, 12px);
          line-height: 1.78; color: rgba(200,175,130,.72);
          white-space: pre-wrap; flex: 1;
          min-height: 55px;
        }

        /* Card footer */
        #col-tour-foot {
          padding: 9px 17px 13px;
          border-top: 1px solid rgba(168,131,46,.1);
          display: flex; align-items: center; gap: 7px;
        }
        #col-tour-pips {
          display: flex; gap: 4px; align-items: center; flex: 1; flex-wrap: wrap;
        }
        .col-pip {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(168,131,46,.18);
          transition: background .25s;
          flex-shrink: 0;
        }
        .col-pip.col-pip-done   { background: rgba(168,131,46,.42); }
        .col-pip.col-pip-active { background: #c47c1a; }

        /* Buttons */
        .col-tour-btn {
          font-family: 'Courier Prime', monospace;
          font-size: 8px; letter-spacing: .22em; text-transform: uppercase;
          background: none; cursor: pointer; border: 1px solid rgba(168,131,46,.22);
          color: rgba(168,131,46,.55); padding: 6px 11px;
          transition: border-color .2s, color .2s; flex-shrink: 0;
          line-height: 1;
        }
        .col-tour-btn:hover { border-color: rgba(168,131,46,.55); color: #c47c1a; }
        #col-tour-btn-exit {
          border-color: rgba(180,50,50,.22); color: rgba(180,50,50,.45);
        }
        #col-tour-btn-exit:hover { border-color: rgba(196,48,48,.55); color: #c43030; }
        #col-tour-btn-next.col-finish {
          border-color: rgba(168,131,46,.5); color: #c47c1a;
          background: rgba(168,131,46,.08);
        }

        /* Keyboard hint */
        #col-tour-hint {
          position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
          z-index: 9011; pointer-events: none;
          font-family: 'Courier Prime', monospace;
          font-size: 8px; letter-spacing: .3em; text-transform: uppercase;
          color: rgba(168,131,46,.3);
          opacity: 1; transition: opacity .4s;
        }
        #col-tour-hint.col-hide { opacity: 0; }
      </style>

      <!-- Spotlight panels -->
      <div class="col-tp" id="col-tp-top"></div>
      <div class="col-tp" id="col-tp-bottom"></div>
      <div class="col-tp" id="col-tp-left"></div>
      <div class="col-tp" id="col-tp-right"></div>

      <!-- Spotlight ring -->
      <div id="col-tour-ring"></div>

      <!-- Tooltip card -->
      <div id="col-tour-card">
        <div id="col-tour-head">
          <span id="col-tour-counter"></span>
          <span id="col-tour-title"></span>
        </div>
        <div id="col-tour-body"></div>
        <div id="col-tour-foot">
          <div id="col-tour-pips"></div>
          <button class="col-tour-btn" id="col-tour-btn-exit" onclick="window.__colTour.end()">✕ Exit</button>
          <button class="col-tour-btn" id="col-tour-btn-prev" onclick="window.__colTour.prev()">← Back</button>
          <button class="col-tour-btn" id="col-tour-btn-next" onclick="window.__colTour.next()">Next →</button>
        </div>
      </div>

      <!-- Keyboard hint -->
      <div id="col-tour-hint">← → Arrow keys to navigate · Esc to exit</div>
    `;

    document.body.appendChild(root);
  }


  /* ══════════════════════════════════════════════════════════════
     TYPEWRITER
  ══════════════════════════════════════════════════════════════ */
  let _twTimer = null;

  function typewrite(el, text) {
    clearTimeout(_twTimer);
    el.textContent = '';
    let i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent += text[i];
        const ch = text[i]; i++;
        const delay = (ch === '.' || ch === '\n') ? 55 : (ch === ',' ? 30 : 16);
        _twTimer = setTimeout(tick, delay);
      }
    }
    tick();
  }


  /* ══════════════════════════════════════════════════════════════
     SPOTLIGHT — four-panel frame
  ══════════════════════════════════════════════════════════════ */
  const PAD = 9; // px padding around spotlit element

  function setSpotlight(rect) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    if (!rect) {
      // Full cover
      document.getElementById('col-tp-top').style.cssText    = `top:0;left:0;right:0;height:${H}px`;
      document.getElementById('col-tp-bottom').style.cssText = `bottom:0;left:0;right:0;height:0`;
      document.getElementById('col-tp-left').style.cssText   = `top:0;left:0;width:0;height:0`;
      document.getElementById('col-tp-right').style.cssText  = `top:0;right:0;width:0;height:0`;
      document.getElementById('col-tour-ring').style.opacity = '0';
      return;
    }

    const x1 = Math.max(0, Math.round(rect.left   - PAD));
    const y1 = Math.max(0, Math.round(rect.top    - PAD));
    const x2 = Math.min(W, Math.round(rect.right  + PAD));
    const y2 = Math.min(H, Math.round(rect.bottom + PAD));
    const sw = x2 - x1;
    const sh = y2 - y1;

    document.getElementById('col-tp-top').style.cssText
      = `top:0;left:0;right:0;height:${y1}px`;
    document.getElementById('col-tp-bottom').style.cssText
      = `top:${y2}px;left:0;right:0;bottom:0`;
    document.getElementById('col-tp-left').style.cssText
      = `top:${y1}px;left:0;width:${x1}px;height:${sh}px`;
    document.getElementById('col-tp-right').style.cssText
      = `top:${y1}px;left:${x2}px;right:0;height:${sh}px`;

    const ring = document.getElementById('col-tour-ring');
    ring.style.cssText = `top:${y1}px;left:${x1}px;width:${sw}px;height:${sh}px;opacity:1`;
  }


  /* ══════════════════════════════════════════════════════════════
     CARD POSITIONING
  ══════════════════════════════════════════════════════════════ */
  function positionCard(rect, pref) {
    const card = document.getElementById('col-tour-card');
    const W    = window.innerWidth;
    const H    = window.innerHeight;
    const cw   = card.offsetWidth  || 340;
    const ch   = card.offsetHeight || 220;
    const GAP  = 18;
    let top, left;

    if (!rect || pref === 'center') {
      top  = (H - ch) / 2;
      left = (W - cw) / 2;
    } else {
      // Try preferred, fall back intelligently
      const fits = {
        right:  rect.right  + GAP + cw <= W,
        left:   rect.left   - GAP - cw >= 0,
        top:    rect.top    - GAP - ch >= 0,
        bottom: rect.bottom + GAP + ch <= H,
      };
      const dir = fits[pref] ? pref
        : fits.right ? 'right' : fits.left ? 'left'
        : fits.bottom ? 'bottom' : 'top';

      if (dir === 'right') {
        left = rect.right + GAP;
        top  = clamp(rect.top + (rect.height - ch) / 2, GAP, H - ch - GAP);
      } else if (dir === 'left') {
        left = rect.left - GAP - cw;
        top  = clamp(rect.top + (rect.height - ch) / 2, GAP, H - ch - GAP);
      } else if (dir === 'top') {
        top  = rect.top - GAP - ch;
        left = clamp(rect.left + (rect.width - cw) / 2, GAP, W - cw - GAP);
      } else {
        top  = rect.bottom + GAP;
        left = clamp(rect.left + (rect.width - cw) / 2, GAP, W - cw - GAP);
      }
      // Final safety clamp
      top  = clamp(top,  GAP, H - ch - GAP);
      left = clamp(left, GAP, W - cw - GAP);
    }

    card.style.top  = Math.round(top)  + 'px';
    card.style.left = Math.round(left) + 'px';
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }


  /* ══════════════════════════════════════════════════════════════
     PIPS
  ══════════════════════════════════════════════════════════════ */
  function renderPips(idx) {
    const el = document.getElementById('col-tour-pips');
    if (!el) return;
    el.innerHTML = '';
    STEPS.forEach((_, i) => {
      const pip = document.createElement('div');
      pip.className = 'col-pip'
        + (i < idx ? ' col-pip-done' : i === idx ? ' col-pip-active' : '');
      el.appendChild(pip);
    });
  }


  /* ══════════════════════════════════════════════════════════════
     SHOW STEP
  ══════════════════════════════════════════════════════════════ */
  let _step = 0;

  function showStep(n) {
    _step = n;
    localStorage.setItem(LS_STEP, n);

    const step = STEPS[n];
    if (!step) { endTour(); return; }

    // Cross-page navigation — set a flag so maybeResume knows WE drove this
    const pg = currentPage();
    if (pg !== step.page) {
      localStorage.setItem(LS_ACTIVE, '1');
      localStorage.setItem(LS_STEP, n);
      localStorage.setItem('col_tour_nav', '1');   // tour-driven, not player-driven
      window.location.href = step.page;
      return;
    }

    buildDOM();

    const card    = document.getElementById('col-tour-card');
    const titleEl = document.getElementById('col-tour-title');
    const bodyEl  = document.getElementById('col-tour-body');
    const counter = document.getElementById('col-tour-counter');
    const btnNext = document.getElementById('col-tour-btn-next');
    const btnPrev = document.getElementById('col-tour-btn-prev');
    const hint    = document.getElementById('col-tour-hint');

    // Fade card out briefly
    card.classList.add('col-fade');

    setTimeout(() => {
      counter.textContent   = `Step ${n + 1} of ${STEPS.length}`;
      titleEl.textContent   = step.title;
      bodyEl.textContent    = '';

      btnPrev.style.display = (n === 0) ? 'none' : '';
      const isLast = n === STEPS.length - 1;
      btnNext.textContent = isLast ? 'Finish ✓' : 'Next →';
      btnNext.classList.toggle('col-finish', isLast);

      renderPips(n);

      // Hide keyboard hint after step 1
      if (hint) hint.classList.toggle('col-hide', n > 0);

      // If step has a selector, scroll to and spotlight the element
      if (step.selector) {
        const el = document.querySelector(step.selector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Wait for scroll + transition
          setTimeout(() => {
            const rect = el.getBoundingClientRect();
            setSpotlight(rect);
            card.classList.remove('col-fade');
            positionCard(rect, step.position);
            typewrite(bodyEl, step.text);
          }, 380);
          return;
        }
      }

      // No selector — full dim + centred card
      setSpotlight(null);
      card.classList.remove('col-fade');
      positionCard(null, 'center');
      typewrite(bodyEl, step.text);

    }, 210);
  }


  /* ══════════════════════════════════════════════════════════════
     NAVIGATION
  ══════════════════════════════════════════════════════════════ */
  function nextStep() {
    if (_step < STEPS.length - 1) showStep(_step + 1);
    else endTour();
  }

  function prevStep() {
    if (_step > 0) showStep(_step - 1);
  }

  function endTour() {
    clearTimeout(_twTimer);
    localStorage.removeItem(LS_ACTIVE);
    localStorage.removeItem(LS_STEP);
    const root = document.getElementById('col-tour-root');
    if (root) {
      root.style.transition = 'opacity .4s ease';
      root.style.opacity    = '0';
      setTimeout(() => root.remove(), 420);
    }
  }

  function startTour(fromStep) {
    localStorage.setItem(LS_ACTIVE, '1');
    buildDOM();
    showStep(typeof fromStep === 'number' ? fromStep : 0);
  }


  /* ══════════════════════════════════════════════════════════════
     AUTO-RESUME on page load
  ══════════════════════════════════════════════════════════════ */
  function maybeResume() {
    if (localStorage.getItem(LS_ACTIVE) !== '1') return;

    // Only auto-resume if the tour itself triggered this page load.
    // If the player navigated here manually (menu, back button, etc.)
    // we must NOT redirect them — consume the flag and stop.
    const tourDriven = localStorage.getItem('col_tour_nav') === '1';
    localStorage.removeItem('col_tour_nav');   // always consume immediately

    if (!tourDriven) {
      // Player navigated manually while a tour was in progress.
      // Clear tour state so we don't keep redirecting them.
      localStorage.removeItem(LS_ACTIVE);
      localStorage.removeItem(LS_STEP);
      return;
    }

    const n = parseInt(localStorage.getItem(LS_STEP) || '0', 10);
    // Safety: if the saved step doesn't belong to this page, abort
    const step = STEPS[n];
    if (!step || step.page !== currentPage()) {
      localStorage.removeItem(LS_ACTIVE);
      localStorage.removeItem(LS_STEP);
      return;
    }
    // Clear any stale nav flag that might have survived
    localStorage.removeItem('col_tour_nav');

    startTour(n);
  }


  /* ══════════════════════════════════════════════════════════════
     KEYBOARD & RESIZE
  ══════════════════════════════════════════════════════════════ */
  document.addEventListener('keydown', e => {
    if (localStorage.getItem(LS_ACTIVE) !== '1') return;
    if (e.key === 'Escape')     { e.preventDefault(); endTour();  }
    if (e.key === 'ArrowRight') { e.preventDefault(); nextStep(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prevStep(); }
  });

  let _resizeTimer;
  window.addEventListener('resize', () => {
    if (localStorage.getItem(LS_ACTIVE) !== '1') return;
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => showStep(_step), 120);
  });


  /* ══════════════════════════════════════════════════════════════
     PUBLIC API
  ══════════════════════════════════════════════════════════════ */
  window.__colTour = { start: startTour, next: nextStep, prev: prevStep, end: endTour };
  window.startTour = startTour;


  /* ══════════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeResume);
  } else {
    maybeResume();
  }

})();
