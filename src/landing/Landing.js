import { createIcons, Shield, Zap, Layout, BarChart2, Puzzle, ArrowRight, Share2, User, Sun, Moon } from 'lucide';
import { navigateTo } from '../router.js';
import { getCreatorId, saveCreatorId, setWorkspaceSession } from '../storage/creatorStore.js';
import { createCreator } from '../firebase/creatorService.js';
import { showToast } from '../utils.js';

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
                <rect width="32" height="32" rx="8" fill="#6c5ce7"/>
                <text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">ef</text>
              </svg>
            </div>
            <span class="lp-logo-text">Ephemeral Forms</span>
          </div>
          <div class="lp-nav-links">
            <button class="lp-nav-link lp-theme-toggle" id="landing-theme-toggle" title="${isDark ? 'Light' : 'Dark'} mode">
              <i data-lucide="${isDark ? 'sun' : 'moon'}" style="width:16px;height:16px;"></i>
            </button>
            ${hasIdentity ? '<button class="lp-nav-link" id="landing-nav-docs">Docs</button>' : ''}
            ${hasIdentity
              ? '<button class="lp-nav-cta" id="landing-cta-nav">Dashboard</button>'
              : '<button class="lp-nav-cta" id="landing-cta-nav">Get Started</button>'
            }
          </div>
        </div>
      </nav>

      <!-- ===== HERO ===== -->
      <section class="lp-hero">
        <div class="lp-hero-body">
          <h1 class="lp-hero-title">Build forms. Collect responses.<br>Keep everything private.</h1>
          <p class="lp-hero-sub">
            A form builder that works offline and stores data in your browser.
            No accounts, no tracking, no servers between you and your respondents.
          </p>
          <div class="lp-hero-actions">
            ${hasIdentity
              ? '<button class="lp-btn-primary" id="landing-cta-main">Go to Dashboard <i data-lucide="arrow-right" style="width:16px;height:16px;"></i></button>'
              : '<button class="lp-btn-primary" id="landing-cta-main">Get Started <i data-lucide="arrow-right" style="width:16px;height:16px;"></i></button>'
            }
          </div>
          <p class="lp-hero-note">Free forever. No sign-up required.</p>
        </div>
      </section>

      <!-- ===== FEATURES ===== -->
      <section class="lp-features">
        <div class="lp-section-head">
          <h2 class="lp-section-title">What you get</h2>
        </div>
        <div class="lp-features-grid">
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #6c5ce7; --icon-bg: #6c5ce710;">
              <i data-lucide="shield"></i>
            </div>
            <h3>Private by default</h3>
            <p>Data stays in your browser. No cookies, no analytics, no third parties.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #fdcb6e; --icon-bg: #fdcb6e12;">
              <i data-lucide="zap"></i>
            </div>
            <h3>Fast</h3>
            <p>Vanilla JS, no framework. Loads instantly, auto-saves every change.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #00b894; --icon-bg: #00b89410;">
              <i data-lucide="share-2"></i>
            </div>
            <h3>Shareable links</h3>
            <p>Generate a link, send it. Anyone can respond without creating an account.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #74b9ff; --icon-bg: #74b9ff10;">
              <i data-lucide="layout"></i>
            </div>
            <h3>Drag & drop</h3>
            <p>Multi-step forms with sections, routing logic, and reordering.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #e17055; --icon-bg: #e1705510;">
              <i data-lucide="bar-chart-2"></i>
            </div>
            <h3>Analytics</h3>
            <p>Charts, completion rates, and word frequency — computed locally.</p>
          </div>
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #a29bfe; --icon-bg: #a29bfe10;">
              <i data-lucide="puzzle"></i>
            </div>
            <h3>Plugins</h3>
            <p>Extend with star ratings, signatures, validators, and custom types.</p>
          </div>
        </div>
      </section>

      <!-- ===== HOW IT WORKS ===== -->
      <section class="lp-how">
        <div class="lp-section-head">
          <h2 class="lp-section-title">How it works</h2>
        </div>
        <div class="lp-steps">
          <div class="lp-step reveal">
            <div class="lp-step-num">1</div>
            <h3 class="lp-step-title">Design</h3>
            <p class="lp-step-desc">Pick question types, add steps, set a theme.</p>
          </div>
          <div class="lp-step-divider"></div>
          <div class="lp-step reveal">
            <div class="lp-step-num">2</div>
            <h3 class="lp-step-title">Share</h3>
            <p class="lp-step-desc">Generate a link. Anyone can fill it out.</p>
          </div>
          <div class="lp-step-divider"></div>
          <div class="lp-step reveal">
            <div class="lp-step-num">3</div>
            <h3 class="lp-step-title">Analyze</h3>
            <p class="lp-step-desc">View charts, export CSV, manage from anywhere.</p>
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
            <svg viewBox="0 0 32 32" width="18" height="18" fill="none"><rect width="32" height="32" rx="8" fill="#6c5ce7"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">ef</text></svg>
            <span>Ephemeral Forms</span>
          </div>
          <div class="lp-footer-links">
            ${hasIdentity
              ? `<button class="lp-footer-link" id="landing-footer-dashboard">Dashboard</button>
                 <button class="lp-footer-link" id="landing-footer-build">Builder</button>
                 <button class="lp-footer-link" id="landing-footer-docs">Docs</button>`
              : `<button class="lp-footer-link" id="landing-footer-getstarted">Get Started</button>`
            }
          </div>
        </div>
      </footer>

    </div>
  `;

  createIcons({ icons: { Shield, Zap, Layout, BarChart2, Puzzle, ArrowRight, Share2, User, Sun, Moon } });

  // ---- Event Bindings ----
  container.querySelector('#landing-cta-nav').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });
  container.querySelector('#landing-cta-main').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });
  container.querySelector('#landing-nav-docs')?.addEventListener('click', () => navigateTo('/dashboard/docs'));
  container.querySelector('#landing-cta-bottom').addEventListener('click', () => {
    if (hasIdentity) navigateTo('/dashboard');
    else showOnboarding(container);
  });

  // Footer links (only rendered when hasIdentity)
  container.querySelector('#landing-footer-dashboard')?.addEventListener('click', () => navigateTo('/dashboard'));
  container.querySelector('#landing-footer-build')?.addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#landing-footer-docs')?.addEventListener('click', () => navigateTo('/dashboard/docs'));
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
      <div class="lp-onboarding-icon">
        <i data-lucide="user" style="width:28px;height:28px;"></i>
      </div>
      <h2 class="lp-onboarding-title">Set up your identity</h2>
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
      <button class="btn btn-ghost" id="onboard-skip" style="width:100%;margin-top:var(--space-2);">
        Skip for now
      </button>
    </div>
  `;

  container.appendChild(overlay);
  createIcons({ icons: { User } });

  // Focus name field
  overlay.querySelector('#onboard-name')?.focus();

  const close = () => overlay.remove();

  overlay.querySelector('#onboard-close').addEventListener('click', close);
  overlay.querySelector('#onboard-skip').addEventListener('click', () => {
    close();
    navigateTo('/build');
  });

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Enter key submits
  overlay.querySelectorAll('input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') overlay.querySelector('#onboard-submit')?.click();
    });
  });

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
}
