import { createIcons, Shield, Zap, Layout, BarChart2, Puzzle, ArrowRight, Share2, User, Sun, Moon, Sparkles, Check } from 'lucide';
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
          <button class="lp-logo" id="landing-logo" aria-label="Ephemeral Forms home">
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
          </button>
          <div class="lp-nav-links">
            <button class="lp-nav-link lp-nav-section-link" id="landing-nav-features">Features</button>
            <button class="lp-nav-link lp-nav-section-link" id="landing-nav-how">How it works</button>
            <button class="lp-nav-link" id="landing-nav-blog">Blog</button>
            ${hasIdentity ? '<button class="lp-nav-link" id="landing-nav-docs">Docs</button>' : ''}
            <button class="lp-nav-link lp-theme-toggle" id="landing-theme-toggle" aria-label="Switch to ${isDark ? 'light' : 'dark'} mode" title="${isDark ? 'Light' : 'Dark'} mode">
              <i data-lucide="${isDark ? 'sun' : 'moon'}" style="width:16px;height:16px;"></i>
            </button>
            ${hasIdentity
              ? '<button class="lp-nav-cta" id="landing-cta-nav">Dashboard</button>'
              : '<button class="lp-nav-cta" id="landing-cta-nav">Get Started</button>'
            }
          </div>
        </div>
      </nav>


      <!-- ===== HERO ===== -->
      <main>
      <section class="lp-hero" aria-labelledby="landing-heading">
        <div class="lp-hero-body">
          <div class="lp-eyebrow"><i data-lucide="sparkles"></i> Form building, simplified</div>
          <h1 class="lp-hero-title" id="landing-heading">Turn an idea into a live form in seconds.</h1>
          <p class="lp-hero-sub">
            Describe what you need and let AI create the questions, structure, and flow. Edit anything, share one link, and see every response in one place.
          </p>
          <div class="lp-hero-actions">
            ${hasIdentity
              ? '<button class="lp-btn-primary" id="landing-cta-main">Open dashboard <i data-lucide="arrow-right"></i></button>'
              : '<button class="lp-btn-primary" id="landing-cta-main">Create your first form <i data-lucide="arrow-right"></i></button>'
            }
            <button class="lp-btn-secondary" id="landing-see-how">See how it works</button>
          </div>
          <ul class="lp-hero-benefits" aria-label="Key benefits">
            <li><i data-lucide="check"></i>No credit card</li>
            <li><i data-lucide="check"></i>No setup</li>
            <li><i data-lucide="check"></i>Free to start</li>
          </ul>
        </div>

        <div class="lp-hero-visual" aria-hidden="true">
          <div class="lp-mock-form">
            <div class="lp-mock-header">
              <span class="lp-mock-tab"><i data-lucide="sparkles"></i> AI form generator</span>
              <span class="lp-mock-status"><span></span> Live preview</span>
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
      <section class="lp-features" id="landing-features" aria-labelledby="features-heading">
        <div class="lp-section-head">
          <span class="lp-section-kicker">Everything you need</span>
          <h2 class="lp-section-title" id="features-heading">Create, share, and understand your forms.</h2>
          <p class="lp-section-sub">Powerful where it matters, simple everywhere else.</p>
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
      <section class="lp-how" id="landing-how" aria-labelledby="how-heading">
        <div class="lp-section-head">
          <span class="lp-section-kicker">How it works</span>
          <h2 class="lp-section-title" id="how-heading">From idea to insight in three steps.</h2>
          <p class="lp-section-sub">No tutorials or complicated setup required.</p>
        </div>
        <div class="lp-steps-track">
          <div class="lp-step-card reveal">
            <div class="lp-step-card-icon"><i data-lucide="sparkles"></i></div>
            <div class="lp-step-card-num">Step 01</div>
            <h3 class="lp-step-card-title">Describe your form</h3>
            <p class="lp-step-card-desc">Type what you need in plain English — "a feedback survey with ratings and comments" — and the AI builds the entire form. Or go manual with drag & drop.</p>
          </div>
          <div class="lp-step-card reveal">
            <div class="lp-step-card-icon"><i data-lucide="share-2"></i></div>
            <div class="lp-step-card-num">Step 02</div>
            <h3 class="lp-step-card-title">Share a magic link</h3>
            <p class="lp-step-card-desc">One click generates a shareable link. Respondents don't need an account. Edit your form anytime — changes sync to the live link instantly.</p>
          </div>
          <div class="lp-step-card reveal">
            <div class="lp-step-card-icon"><i data-lucide="bar-chart-2"></i></div>
            <div class="lp-step-card-num">Step 03</div>
            <h3 class="lp-step-card-title">See results in real-time</h3>
            <p class="lp-step-card-desc">Responses stream into your dashboard with charts, completion rates, and per-question breakdowns. Manage everything from any device.</p>
          </div>
        </div>
      </section>

      <!-- ===== INTEGRATIONS ===== -->
      <section class="lp-integrations">
        <div class="lp-section-head">
          <h2 class="lp-section-title">Integrations</h2>
          <p class="lp-section-sub">Bring Ephemeral Forms to your existing tools.</p>
        </div>
        <div class="lp-integrations-grid">
          <a href="/ephemeral-forms-wp.zip" download class="lp-integration-card reveal">
            <div class="lp-integration-icon">
              <svg viewBox="0 0 32 32" width="32" height="32" fill="none"><circle cx="16" cy="16" r="16" fill="#21759b"/><path d="M4.8 16c0 3.6 2.1 6.7 5.1 8.2L5.6 12.4C5.1 13.5 4.8 14.7 4.8 16zm18.8-.6c0-1.1-.4-1.9-.7-2.5-.5-.7-.9-1.4-.9-2.1 0-.8.6-1.6 1.5-1.6h.1A11.2 11.2 0 0 0 5 11.8h.7c1.2 0 3-.1 3-.1a.5.5 0 0 1 .1.7s-.6.1-.7.1l-2 5.8 2.9 8.7 4.8-14.5-.1-.1c-.6 0-1.2-.1-1.2-.1a.5.5 0 0 1 .1-.7s1.9.1 3 .1c1.2 0 3-.1 3-.1a.5.5 0 0 1 .1.7s-.7.1-.7.1l-2 5.9 1.6 5.3c.1 0 2.3-7.3 2.3-7.3.6-1.5.8-2.4.8-3.3z" fill="white"/><path d="M16.3 17.2l-2.8 8.3a11.2 11.2 0 0 0 6.9-.2l-.1-.1-3-8zM25.6 11.3c.1.5.1 1.1.1 1.7 0 1.7-.3 3.6-1.3 6l-5.1 14.7A11.2 11.2 0 0 0 25.6 11.3z" fill="white"/></svg>
            </div>
            <div class="lp-integration-info">
              <h3>WordPress Plugin</h3>
              <p>Embed forms in any page or post with a shortcode or Gutenberg block.</p>
            </div>
            <span class="lp-integration-badge">Download ZIP</span>
          </a>
        </div>
      </section>

      <!-- ===== CTA BANNER ===== -->
      <section class="lp-cta-banner">
        ${hasIdentity
          ? '<h2 class="lp-cta-title">Welcome back.</h2><p class="lp-cta-sub">Pick up where you left off.</p>'
          : '<h2 class="lp-cta-title">Your next form is one prompt away.</h2><p class="lp-cta-sub">Start from a description or build it yourself. No credit card required.</p>'
        }
        <button class="lp-btn-primary" id="landing-cta-bottom">
          ${hasIdentity ? 'Go to Dashboard' : 'Create a Form'} <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
        </button>
      </section>

      </main>

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
            <a href="https://github.com/ra9/ephemeral-forms" target="_blank" rel="noopener noreferrer" class="lp-footer-link">GitHub</a>
          </div>
          <div class="lp-footer-love">Made <span style="color:#6c5ce7;">&hearts;</span> Grand Kru.</div>
        </div>
      </footer>

    </div>
  `;

  createIcons({ icons: { Shield, Zap, Layout, BarChart2, Puzzle, ArrowRight, Share2, User, Sun, Moon, Sparkles, RefreshCw, Check } });

  // ---- Event Bindings ----
  container.querySelector('#landing-cta-nav').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });
  container.querySelector('#landing-cta-main').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });
  container.querySelector('#landing-logo')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  container.querySelector('#landing-nav-features')?.addEventListener('click', () => container.querySelector('#landing-features')?.scrollIntoView({ behavior: 'smooth' }));
  container.querySelector('#landing-nav-how')?.addEventListener('click', () => container.querySelector('#landing-how')?.scrollIntoView({ behavior: 'smooth' }));
  container.querySelector('#landing-see-how')?.addEventListener('click', () => container.querySelector('#landing-how')?.scrollIntoView({ behavior: 'smooth' }));
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
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
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
    <div class="lp-onboarding-card" role="dialog" aria-modal="true" aria-label="Get started with Ephemeral Forms">
      <button class="lp-onboarding-close" id="onboard-close" aria-label="Close onboarding">&times;</button>

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
