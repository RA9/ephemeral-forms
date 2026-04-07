import { createIcons, Sparkles, Shield, Zap, Globe, Layout, BarChart2, Puzzle, ArrowRight, CheckCircle } from 'lucide';
import { navigateTo } from '../router.js';

export function renderLandingPage(container) {
  container.innerHTML = `
    <div class="lp">

      <!-- ===== NAV ===== -->
      <nav class="lp-nav" id="lp-nav">
        <div class="lp-nav-inner">
          <div class="lp-logo">
            <div class="lp-logo-icon">✦</div>
            <span class="lp-logo-text">Ephemeral Forms</span>
          </div>
          <div class="lp-nav-links">
            <button class="lp-nav-ghost" id="landing-login-btn">Dashboard</button>
            <button class="lp-nav-cta" id="landing-cta-nav">
              Get Started <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </div>
      </nav>

      <!-- ===== HERO ===== -->
      <section class="lp-hero">
        <div class="lp-hero-mesh"></div>

        <div class="lp-hero-body">
          <div class="lp-hero-text slide-up">
            <div class="lp-badge">
              <span class="lp-badge-pulse"></span>
              Zero-Login &nbsp;•&nbsp; Offline-First &nbsp;•&nbsp; 100% Private
            </div>
            <h1 class="lp-hero-title">
              Build forms that<br>
              <span class="lp-gradient-text">respect privacy.</span>
            </h1>
            <p class="lp-hero-sub">
              The form builder where all data stays in your browser.
              No accounts, no servers, no tracking — ever.
            </p>
            <div class="lp-hero-actions">
              <button class="lp-btn-primary" id="landing-cta-main">
                Start Building Free
                <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
              </button>
              <button class="lp-btn-ghost" id="landing-dashboard-btn">
                View Dashboard
              </button>
            </div>
            <div class="lp-trust-row">
              <span><i data-lucide="check-circle" style="width:13px;height:13px;"></i> No account needed</span>
              <span><i data-lucide="check-circle" style="width:13px;height:13px;"></i> Free forever</span>
              <span><i data-lucide="check-circle" style="width:13px;height:13px;"></i> Open source</span>
            </div>
          </div>

          <div class="lp-hero-visual fade-in" style="animation-delay:0.3s">
            <div class="lp-form-mockup">
              <div class="lp-mockup-topbar">
                <div class="lp-mockup-dots">
                  <span></span><span></span><span></span>
                </div>
                <div class="lp-mockup-url">ephemeral.app/form/survey-2026</div>
              </div>
              <div class="lp-mockup-body">
                <div class="lp-mockup-hero-strip"></div>
                <div class="lp-mockup-content">
                  <div class="lp-mockup-form-title">Customer Feedback</div>
                  <div class="lp-mockup-form-desc">We'd love to hear from you!</div>
                  <div class="lp-mockup-q">
                    <div class="lp-mockup-label">Full Name <span>*</span></div>
                    <div class="lp-mockup-input">
                      <span class="lp-mockup-cursor"></span>
                    </div>
                  </div>
                  <div class="lp-mockup-q">
                    <div class="lp-mockup-label">How satisfied are you?</div>
                    <div class="lp-mockup-choices">
                      <div class="lp-mockup-choice selected">Very satisfied</div>
                      <div class="lp-mockup-choice">Satisfied</div>
                      <div class="lp-mockup-choice">Neutral</div>
                    </div>
                  </div>
                  <div class="lp-mockup-submit">Submit Response</div>
                </div>
              </div>
            </div>

            <div class="lp-float-chip chip-a">
              <i data-lucide="bar-chart-2" style="width:14px;height:14px;color:var(--accent-500)"></i>
              12 responses today
            </div>
            <div class="lp-float-chip chip-b">
              <i data-lucide="shield" style="width:14px;height:14px;color:var(--primary-500)"></i>
              Data stays local
            </div>
          </div>
        </div>
      </section>

      <!-- ===== STATS STRIP ===== -->
      <section class="lp-stats">
        <div class="lp-stats-inner">
          <div class="lp-stat reveal">
            <span class="lp-stat-num">10+</span>
            <span class="lp-stat-label">Question Types</span>
          </div>
          <div class="lp-stat-divider"></div>
          <div class="lp-stat reveal" style="animation-delay:0.1s">
            <span class="lp-stat-num">100%</span>
            <span class="lp-stat-label">Private by Design</span>
          </div>
          <div class="lp-stat-divider"></div>
          <div class="lp-stat reveal" style="animation-delay:0.2s">
            <span class="lp-stat-num">0</span>
            <span class="lp-stat-label">Servers Required</span>
          </div>
          <div class="lp-stat-divider"></div>
          <div class="lp-stat reveal" style="animation-delay:0.3s">
            <span class="lp-stat-num">PWA</span>
            <span class="lp-stat-label">Works Offline</span>
          </div>
        </div>
      </section>

      <!-- ===== FEATURES ===== -->
      <section class="lp-features">
        <div class="lp-section-head">
          <p class="lp-section-eyebrow">Features</p>
          <h2 class="lp-section-title">Everything you need, nothing you don't.</h2>
          <p class="lp-section-sub">A full-featured form platform that lives entirely in your browser.</p>
        </div>
        <div class="lp-features-grid">
          <div class="lp-feature-card reveal">
            <div class="lp-feature-icon" style="--icon-color: #6c5ce7; --icon-bg: #6c5ce715;">
              <i data-lucide="shield"></i>
            </div>
            <h3>Privacy First</h3>
            <p>Your data never leaves your device. IndexedDB stores everything locally — no cloud, no leaks.</p>
          </div>
          <div class="lp-feature-card reveal" style="animation-delay:0.05s">
            <div class="lp-feature-icon" style="--icon-color: #fdcb6e; --icon-bg: #fdcb6e18;">
              <i data-lucide="zap"></i>
            </div>
            <h3>Instant & Fast</h3>
            <p>Built with Vite and Vanilla JS — no framework bloat. Loads instantly, auto-saves in real time.</p>
          </div>
          <div class="lp-feature-card reveal" style="animation-delay:0.1s">
            <div class="lp-feature-icon" style="--icon-color: #00b894; --icon-bg: #00b89415;">
              <i data-lucide="globe"></i>
            </div>
            <h3>Offline PWA</h3>
            <p>Install it like a native app and keep using it with no internet. Service worker handles the rest.</p>
          </div>
          <div class="lp-feature-card reveal" style="animation-delay:0.15s">
            <div class="lp-feature-icon" style="--icon-color: #74b9ff; --icon-bg: #74b9ff15;">
              <i data-lucide="layout"></i>
            </div>
            <h3>Drag & Drop Builder</h3>
            <p>Reorder questions effortlessly with SortableJS. Add sections, conditional logic, and more.</p>
          </div>
          <div class="lp-feature-card reveal" style="animation-delay:0.2s">
            <div class="lp-feature-icon" style="--icon-color: #e17055; --icon-bg: #e1705515;">
              <i data-lucide="bar-chart-2"></i>
            </div>
            <h3>Built-in Analytics</h3>
            <p>Track responses with Chart.js visualizations. See trends and insights without leaving the app.</p>
          </div>
          <div class="lp-feature-card reveal" style="animation-delay:0.25s">
            <div class="lp-feature-icon" style="--icon-color: #a29bfe; --icon-bg: #a29bfe15;">
              <i data-lucide="puzzle"></i>
            </div>
            <h3>Plugin System</h3>
            <p>Star ratings, signature pads, conditional logic — extend the app with custom JS plugins.</p>
          </div>
        </div>
      </section>

      <!-- ===== HOW IT WORKS ===== -->
      <section class="lp-how">
        <div class="lp-section-head">
          <p class="lp-section-eyebrow">How it works</p>
          <h2 class="lp-section-title">Up and running in three steps.</h2>
        </div>
        <div class="lp-steps">
          <div class="lp-step reveal">
            <div class="lp-step-num">01</div>
            <h3 class="lp-step-title">Build your form</h3>
            <p class="lp-step-desc">Drag and drop question types, configure settings, set a theme color. Done in seconds.</p>
          </div>
          <div class="lp-step-arrow">→</div>
          <div class="lp-step reveal" style="animation-delay:0.1s">
            <div class="lp-step-num">02</div>
            <h3 class="lp-step-title">Share the link</h3>
            <p class="lp-step-desc">Copy the unique form URL and send it to anyone. No account needed to fill it out.</p>
          </div>
          <div class="lp-step-arrow">→</div>
          <div class="lp-step reveal" style="animation-delay:0.2s">
            <div class="lp-step-num">03</div>
            <h3 class="lp-step-title">Collect responses</h3>
            <p class="lp-step-desc">View submissions in the dashboard with charts and filters. All stored locally, always yours.</p>
          </div>
        </div>
      </section>

      <!-- ===== CTA BANNER ===== -->
      <section class="lp-cta-banner">
        <div class="lp-cta-banner-bg"></div>
        <div class="lp-cta-banner-inner">
          <h2 class="lp-cta-title">Ready to build your first form?</h2>
          <p class="lp-cta-sub">No sign-up. No credit card. Just open it and start.</p>
          <button class="lp-btn-primary lp-btn-lg" id="landing-cta-bottom">
            Create a Form Now
            <i data-lucide="arrow-right" style="width:18px;height:18px;"></i>
          </button>
        </div>
      </section>

      <!-- ===== FOOTER ===== -->
      <footer class="lp-footer">
        <div class="lp-footer-inner">
          <div class="lp-footer-brand">
            <div class="lp-logo-icon" style="width:28px;height:28px;font-size:14px;">✦</div>
            <span class="lp-logo-text">Ephemeral Forms</span>
          </div>
          <p class="lp-footer-copy">© 2026 Ephemeral Forms. Open-source, privacy-first tooling.</p>
          <div class="lp-footer-links">
            <button class="lp-footer-link" id="landing-footer-dashboard">Dashboard</button>
            <button class="lp-footer-link" id="landing-footer-build">Builder</button>
            <button class="lp-footer-link" id="landing-footer-docs">Docs</button>
          </div>
        </div>
      </footer>

    </div>
  `;

  createIcons({ icons: { Sparkles, Shield, Zap, Globe, Layout, BarChart2, Puzzle, ArrowRight, CheckCircle } });

  // ---- Event Bindings ----
  container.querySelector('#landing-login-btn').addEventListener('click', () => navigateTo('/dashboard'));
  container.querySelector('#landing-cta-nav').addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#landing-cta-main').addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#landing-dashboard-btn').addEventListener('click', () => navigateTo('/dashboard'));
  container.querySelector('#landing-cta-bottom').addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#landing-footer-dashboard').addEventListener('click', () => navigateTo('/dashboard'));
  container.querySelector('#landing-footer-build').addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#landing-footer-docs').addEventListener('click', () => navigateTo('/docs'));

  // ---- Sticky nav glass effect on scroll ----
  const nav = container.querySelector('#lp-nav');
  const onScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Reveal on scroll ----
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('active');
    });
  }, { threshold: 0.12 });

  container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
