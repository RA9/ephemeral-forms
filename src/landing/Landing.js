import { createIcons, Shield, Zap, Layout, BarChart2, Puzzle, ArrowRight, Share2, User, Sun, Moon, Sparkles } from 'lucide';
import { navigateTo } from '../router.js';
import { getCreatorId, saveCreatorId, setWorkspaceSession } from '../storage/creatorStore.js';
import { createCreator, verifyCreator } from '../firebase/creatorService.js';
import { showToast } from '../utils.js';
import { RefreshCw } from 'lucide';

export function renderLandingPage(container) {
  let hasIdentity = false;
  renderPage(container, hasIdentity);

  // Check identity in the background and re-render if needed
  getCreatorId().then(id => {
    if (id) {
      hasIdentity = true;
      renderPage(container, hasIdentity);
    }
  }).catch(() => {});
}

function renderPage(container, hasIdentity) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  container.innerHTML = `
    <div class="lp">

      <!-- ===== NAV ===== -->
      <nav class="lp-nav" id="lp-nav">
        <div class="lp-nav-inner">
          <div class="lp-logo">
            <div class="lp-logo-icon">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="2" width="20" height="26" rx="3" fill="#6c5ce7"/>
                <rect x="8" y="8" width="10" height="2" rx="1" fill="rgba(255,255,255,0.9)"/>
                <rect x="8" y="13" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
                <rect x="8" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
                <circle cx="26" cy="6" r="2" fill="#6c5ce7" opacity="0.7"/>
                <circle cx="28" cy="12" r="1.5" fill="#6c5ce7" opacity="0.45"/>
                <circle cx="26" cy="17" r="1" fill="#6c5ce7" opacity="0.25"/>
              </svg>
            </div>
            <span class="lp-logo-text">Ephemeral Forms</span>
          </div>
          <div class="lp-nav-links">
            <button class="lp-nav-link lp-theme-toggle" id="landing-theme-toggle" title="${isDark ? 'Light' : 'Dark'} mode">
              <i data-lucide="${isDark ? 'sun' : 'moon'}" style="width:16px;height:16px;"></i>
            </button>
            <button class="lp-nav-link" id="landing-nav-blog">Blog</button>
            ${hasIdentity ? '<button class="lp-nav-link" id="landing-nav-docs">Docs</button>' : ''}
            ${hasIdentity
              ? '<button class="lp-nav-cta" id="landing-cta-nav">Dashboard</button>'
              : '<button class="lp-nav-cta" id="landing-cta-nav">Get Started</button>'
            }
          </div>
        </div>
      </nav>

      <!-- ===== MORPH BACKDROP ===== -->
      <div class="lp-backdrop" aria-hidden="true">
        <svg class="lp-backdrop-svg" viewBox="0 0 1440 900" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lbg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--primary-500)" stop-opacity="0.07"/>
              <stop offset="100%" stop-color="var(--accent-500)" stop-opacity="0.03"/>
            </linearGradient>
            <linearGradient id="lbg2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--primary-400)" stop-opacity="0.04"/>
              <stop offset="100%" stop-color="var(--accent-400)" stop-opacity="0.07"/>
            </linearGradient>
            <radialGradient id="lbg3" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stop-color="var(--primary-500)" stop-opacity="0.05"/>
              <stop offset="100%" stop-color="var(--primary-500)" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <path class="lp-blob lp-blob--1" fill="url(#lbg1)"
            d="M0,400 C180,300 360,500 540,380 C720,260 900,440 1080,350 C1260,260 1380,400 1440,350 L1440,0 L0,0 Z"/>
          <path class="lp-blob lp-blob--2" fill="url(#lbg2)"
            d="M0,300 C240,420 480,260 720,360 C960,460 1200,300 1440,400 L1440,900 L0,900 Z"/>
          <circle class="lp-glow" cx="720" cy="280" r="400" fill="url(#lbg3)"/>
          <g class="lp-grid-dots" fill="var(--primary-500)" opacity="0.035">
            ${Array.from({ length: 80 }, (_, i) => {
              const x = (i % 16) * 95 + 30;
              const y = Math.floor(i / 16) * 160 + 80;
              return `<circle cx="${x}" cy="${y}" r="1.5"/>`;
            }).join('')}
          </g>
        </svg>
      </div>

      <!-- ===== HERO ===== -->
      <section class="lp-hero">
        <div class="lp-hero-body">
          <h1 class="lp-hero-title">Describe it. We'll build it.<br>AI-powered forms in seconds.</h1>
          <p class="lp-hero-sub">
            Just tell the AI what you need — a job application, feedback survey, or registration form — and
            it generates the whole thing. No sign-ups, no barriers, no learning curve.
          </p>
          <div class="lp-hero-actions">
            ${hasIdentity
              ? '<button class="lp-btn-primary" id="landing-cta-main">Go to Dashboard <i data-lucide="arrow-right" style="width:16px;height:16px;"></i></button>'
              : '<button class="lp-btn-primary" id="landing-cta-main">Get Started <i data-lucide="arrow-right" style="width:16px;height:16px;"></i></button>'
            }
          </div>
          <p class="lp-hero-note">Free forever. No sign-up required. Powered by AI.</p>
        </div>

        <div class="lp-hero-visual" aria-hidden="true">
          <div class="lp-mock-form">
            <div class="lp-mock-header">
              <div class="lp-mock-dot" style="background: #ff5f57;"></div>
              <div class="lp-mock-dot" style="background: #febc2e;"></div>
              <div class="lp-mock-dot" style="background: #28c840;"></div>
              <span class="lp-mock-tab"><i data-lucide="sparkles" style="width:12px;height:12px;vertical-align:-1px;margin-right:4px;"></i>AI Form Generator</span>
            </div>
            <div class="lp-mock-body">
              <div class="lp-mock-field lp-mock-field--active lp-mock-ai-prompt">
                <div class="lp-mock-label" style="color: var(--primary-500); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">Prompt</div>
                <div class="lp-mock-input">
                  <span class="lp-mock-typing">Create a job application form...</span>
                  <span class="lp-mock-cursor"></span>
                </div>
              </div>
              <div class="lp-mock-ai-divider">
                <span class="lp-mock-ai-badge"><i data-lucide="sparkles" style="width:10px;height:10px;"></i> Generated</span>
              </div>
              <div class="lp-mock-field lp-mock-ai-result">
                <div class="lp-mock-label">Full Name</div>
                <div class="lp-mock-input-line"></div>
              </div>
              <div class="lp-mock-field lp-mock-ai-result">
                <div class="lp-mock-label">Years of Experience</div>
                <div class="lp-mock-options">
                  <span class="lp-mock-option selected">1-3</span>
                  <span class="lp-mock-option">3-5</span>
                  <span class="lp-mock-option">5+</span>
                </div>
              </div>
              <div class="lp-mock-field lp-mock-ai-result">
                <div class="lp-mock-label">Cover Letter</div>
                <div class="lp-mock-input-line" style="height: 32px;"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ===== FEATURES ===== -->
      <section class="lp-features">
        <div class="lp-section-head">
          <h2 class="lp-section-title">What you get</h2>
        </div>
        <div class="lp-features-grid">
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #a855f7; --icon-bg: #a855f710;">
              <i data-lucide="sparkles"></i>
            </div>
            <h3>AI-powered generation</h3>
            <p>Describe your form in plain English and AI builds it for you — questions, types, and structure.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #fdcb6e; --icon-bg: #fdcb6e12;">
              <i data-lucide="zap"></i>
            </div>
            <h3>Instant & lightweight</h3>
            <p>No heavy frameworks. Loads instantly, auto-saves every change, works anywhere.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #00b894; --icon-bg: #00b89410;">
              <i data-lucide="share-2"></i>
            </div>
            <h3>Shareable links</h3>
            <p>Generate a magic link and share it. Respondents need no account. Updates sync in real-time.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #74b9ff; --icon-bg: #74b9ff10;">
              <i data-lucide="layout"></i>
            </div>
            <h3>Drag & drop builder</h3>
            <p>Multi-step forms with sections, conditional routing, and drag-to-reorder.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #e17055; --icon-bg: #e1705510;">
              <i data-lucide="bar-chart-2"></i>
            </div>
            <h3>Built-in analytics</h3>
            <p>Charts, completion rates, and response insights — all in your dashboard.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #a29bfe; --icon-bg: #a29bfe10;">
              <i data-lucide="puzzle"></i>
            </div>
            <h3>Plugin ecosystem</h3>
            <p>Extend with star ratings, signatures, math equations, and custom question types.</p>
          </div>
        </div>
      </section>

      <!-- ===== HOW IT WORKS ===== -->
      <section class="lp-how">
        <div class="lp-section-head">
          <h2 class="lp-section-title">Three steps. Zero friction.</h2>
          <p class="lp-section-sub">From idea to live form in under a minute.</p>
        </div>
        <div class="lp-steps-track">
          <div class="lp-step-card reveal">
            <div class="lp-step-card-icon" style="--step-color: #a855f7; --step-bg: rgba(168,85,247,0.1);">
              <i data-lucide="sparkles"></i>
            </div>
            <div class="lp-step-card-num">01</div>
            <h3 class="lp-step-card-title">Describe your form</h3>
            <p class="lp-step-card-desc">Type what you need in plain English — "a feedback survey with ratings and comments" — and the AI builds the entire form. Or go manual with drag & drop.</p>
          </div>
          <div class="lp-step-card reveal">
            <div class="lp-step-card-icon" style="--step-color: #00b894; --step-bg: rgba(0,184,148,0.1);">
              <i data-lucide="share-2"></i>
            </div>
            <div class="lp-step-card-num">02</div>
            <h3 class="lp-step-card-title">Share a magic link</h3>
            <p class="lp-step-card-desc">One click generates a shareable link. Respondents don't need an account. Edit your form anytime — changes sync to the live link instantly.</p>
          </div>
          <div class="lp-step-card reveal">
            <div class="lp-step-card-icon" style="--step-color: #e17055; --step-bg: rgba(225,112,85,0.1);">
              <i data-lucide="bar-chart-2"></i>
            </div>
            <div class="lp-step-card-num">03</div>
            <h3 class="lp-step-card-title">See results in real-time</h3>
            <p class="lp-step-card-desc">Responses stream into your dashboard with charts, completion rates, and per-question breakdowns. Manage everything from any device.</p>
          </div>
        </div>
      </section>

      <!-- ===== CTA BANNER ===== -->
      <section class="lp-cta-banner">
        ${hasIdentity
          ? '<h2 class="lp-cta-title">Welcome back.</h2><p class="lp-cta-sub">Pick up where you left off.</p>'
          : '<h2 class="lp-cta-title">Ready to try it?</h2><p class="lp-cta-sub">No sign-up. No credit card. Just start.</p>'
        }
        <button class="lp-btn-primary" id="landing-cta-bottom">
          ${hasIdentity ? 'Go to Dashboard' : 'Create a Form'} <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
        </button>
      </section>

      <!-- ===== FOOTER ===== -->
      <footer class="lp-footer">
        <div class="lp-footer-inner">
          <div class="lp-footer-brand">
            <svg viewBox="0 0 32 32" width="18" height="18" fill="none"><rect x="4" y="2" width="20" height="26" rx="3" fill="#6c5ce7"/><rect x="8" y="8" width="10" height="2" rx="1" fill="rgba(255,255,255,0.9)"/><rect x="8" y="13" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/><rect x="8" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/><circle cx="26" cy="6" r="2" fill="#6c5ce7" opacity="0.7"/><circle cx="28" cy="12" r="1.5" fill="#6c5ce7" opacity="0.45"/><circle cx="26" cy="17" r="1" fill="#6c5ce7" opacity="0.25"/></svg>
            <span>Ephemeral Forms</span>
          </div>
          <div class="lp-footer-links">
            ${hasIdentity
              ? `<button class="lp-footer-link" id="landing-footer-dashboard">Dashboard</button>
                 <button class="lp-footer-link" id="landing-footer-build">Builder</button>`
              : `<button class="lp-footer-link" id="landing-footer-getstarted">Get Started</button>`
            }
            <button class="lp-footer-link" id="landing-footer-blog">Blog</button>
            <button class="lp-footer-link" id="landing-footer-docs">Docs</button>
          </div>
          <div class="lp-footer-love">Made <span style="color:#6c5ce7;">&hearts;</span> Grand Kru.</div>
        </div>
      </footer>

    </div>
  `;

  createIcons({ icons: { Shield, Zap, Layout, BarChart2, Puzzle, ArrowRight, Share2, User, Sun, Moon, Sparkles, RefreshCw } });

  // ---- Event Bindings ----
  container.querySelector('#landing-cta-nav').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });
  container.querySelector('#landing-cta-main').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });
  container.querySelector('#landing-nav-blog')?.addEventListener('click', () => navigateTo('/blog'));
  container.querySelector('#landing-nav-docs')?.addEventListener('click', () => navigateTo('/docs'));
  container.querySelector('#landing-cta-bottom').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });

  // Footer links (only rendered when hasIdentity)
  container.querySelector('#landing-footer-dashboard')?.addEventListener('click', () => navigateTo('/dashboard'));
  container.querySelector('#landing-footer-build')?.addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#landing-footer-blog')?.addEventListener('click', () => navigateTo('/blog'));
  container.querySelector('#landing-footer-docs')?.addEventListener('click', () => navigateTo('/docs'));
  container.querySelector('#landing-footer-getstarted')?.addEventListener('click', () => showOnboarding(container));

  // Dark mode toggle
  container.querySelector('#landing-theme-toggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    renderPage(container, hasIdentity);
  });

  // ---- Reveal on scroll ----
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.15 });

  container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ============================================================
// Onboarding Overlay
// ============================================================

function showOnboarding(container) {
  const overlay = document.createElement('div');
  overlay.className = 'lp-onboarding-overlay';
  overlay.innerHTML = `
    <div class="lp-onboarding-card">
      <button class="lp-onboarding-close" id="onboard-close">&times;</button>

      <div class="lp-onboarding-tabs">
        <button class="lp-onboarding-tab active" data-tab="create">
          <i data-lucide="user" style="width:16px;height:16px;"></i> New Identity
        </button>
        <button class="lp-onboarding-tab" data-tab="sync">
          <i data-lucide="refresh-cw" style="width:16px;height:16px;"></i> Sync Device
        </button>
      </div>

      <!-- Create tab -->
      <div class="lp-onboarding-panel" id="panel-create">
        <p class="lp-onboarding-desc">Choose a name and passphrase so you can access your forms from any device.</p>

        <div class="lp-onboarding-field">
          <label for="onboard-name">Display Name</label>
          <input type="text" class="input" id="onboard-name" placeholder="e.g. Alex" autocomplete="off" />
        </div>
        <div class="lp-onboarding-field">
          <label for="onboard-pass">Passphrase</label>
          <input type="password" class="input" id="onboard-pass" placeholder="Something memorable" />
        </div>
        <div class="lp-onboarding-field">
          <label for="onboard-pass2">Confirm Passphrase</label>
          <input type="password" class="input" id="onboard-pass2" placeholder="Type it again" />
        </div>

        <div class="lp-onboarding-error" id="onboard-error"></div>

        <button class="btn btn-primary" id="onboard-submit" style="width:100%;">
          Create Identity & Start Building
        </button>
      </div>

      <!-- Sync tab -->
      <div class="lp-onboarding-panel" id="panel-sync" style="display:none;">
        <p class="lp-onboarding-desc">Already have an account? Enter your Creator ID and passphrase to sync this device.</p>

        <div class="lp-onboarding-field">
          <label for="sync-id">Creator ID</label>
          <input type="text" class="input" id="sync-id" placeholder="Your creator ID" autocomplete="off" />
        </div>
        <div class="lp-onboarding-field">
          <label for="sync-pass">Passphrase</label>
          <input type="password" class="input" id="sync-pass" placeholder="Your passphrase" />
        </div>

        <div class="lp-onboarding-error" id="sync-error"></div>

        <button class="btn btn-primary" id="sync-submit" style="width:100%;">
          Sync & Continue
        </button>
      </div>

      <button class="btn btn-ghost" id="onboard-skip" style="width:100%;margin-top:var(--space-2);">
        Skip for now
      </button>
    </div>
  `;

  container.appendChild(overlay);
  createIcons({ icons: { User, RefreshCw } });

  // Focus first field
  overlay.querySelector('#onboard-name')?.focus();

  const close = () => overlay.remove();

  overlay.querySelector('#onboard-close').addEventListener('click', close);
  overlay.querySelector('#onboard-skip').addEventListener('click', () => {
    close();
    navigateTo('/build');
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // ---- Tab switching ----
  overlay.querySelectorAll('.lp-onboarding-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      overlay.querySelectorAll('.lp-onboarding-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      overlay.querySelector('#panel-create').style.display = target === 'create' ? '' : 'none';
      overlay.querySelector('#panel-sync').style.display = target === 'sync' ? '' : 'none';
      // Clear errors on tab switch
      overlay.querySelectorAll('.lp-onboarding-error').forEach(e => e.textContent = '');
      // Focus first input of active panel
      const firstInput = overlay.querySelector(`#panel-${target} input`);
      if (firstInput) firstInput.focus();
    });
  });

  // Enter key submits active panel
  overlay.querySelectorAll('#panel-create input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') overlay.querySelector('#onboard-submit')?.click();
    });
  });
  overlay.querySelectorAll('#panel-sync input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') overlay.querySelector('#sync-submit')?.click();
    });
  });

  // ---- Create Identity ----
  overlay.querySelector('#onboard-submit').addEventListener('click', async () => {
    const name = overlay.querySelector('#onboard-name')?.value.trim();
    const pass = overlay.querySelector('#onboard-pass')?.value;
    const pass2 = overlay.querySelector('#onboard-pass2')?.value;
    const errEl = overlay.querySelector('#onboard-error');
    const btn = overlay.querySelector('#onboard-submit');

    errEl.textContent = '';

    if (!name) { errEl.textContent = 'Please enter a display name.'; return; }
    if (!pass || pass.length < 4) { errEl.textContent = 'Passphrase must be at least 4 characters.'; return; }
    if (pass !== pass2) { errEl.textContent = 'Passphrases do not match.'; return; }

    btn.textContent = 'Setting up...';
    btn.disabled = true;

    try {
      const creator = await createCreator(name, pass);
      await saveCreatorId(creator.creatorId, creator.displayName);
      setWorkspaceSession(creator);
      showToast(`Welcome, ${name}!`, 'success');
      close();
      navigateTo('/build');
    } catch (err) {
      errEl.textContent = 'Setup failed: ' + err.message;
      btn.textContent = 'Create Identity & Start Building';
      btn.disabled = false;
    }
  });

  // ---- Sync Device ----
  overlay.querySelector('#sync-submit').addEventListener('click', async () => {
    const creatorId = overlay.querySelector('#sync-id')?.value.trim();
    const pass = overlay.querySelector('#sync-pass')?.value;
    const errEl = overlay.querySelector('#sync-error');
    const btn = overlay.querySelector('#sync-submit');

    errEl.textContent = '';

    if (!creatorId) { errEl.textContent = 'Please enter your Creator ID.'; return; }
    if (!pass) { errEl.textContent = 'Please enter your passphrase.'; return; }

    btn.textContent = 'Verifying...';
    btn.disabled = true;

    try {
      const creator = await verifyCreator(creatorId, pass);
      if (!creator) {
        errEl.textContent = 'Invalid Creator ID or passphrase.';
        btn.textContent = 'Sync & Continue';
        btn.disabled = false;
        return;
      }
      await saveCreatorId(creator.creatorId, creator.displayName);
      setWorkspaceSession(creator);
      showToast(`Welcome back, ${creator.displayName}!`, 'success');
      close();
      navigateTo('/dashboard');
    } catch (err) {
      errEl.textContent = 'Sync failed: ' + err.message;
      btn.textContent = 'Sync & Continue';
      btn.disabled = false;
    }
  });
}
