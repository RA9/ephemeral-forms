import { createIcons, Sparkles, Shield, Zap, Globe, MousePointer2, Layout, BarChart2, Puzzle } from 'lucide';
import { navigateTo } from '../router.js';

export function renderLandingPage(container) {
  container.innerHTML = `
    <div class="landing-page">
      <nav class="landing-nav fade-in">
        <div class="landing-logo">
          <div class="logo-icon"><i data-lucide="sparkles"></i></div>
          <span>Ephemeral Forms</span>
        </div>
        <div class="landing-nav-links">
          <button class="btn btn-ghost" id="landing-login-btn">Dashboard</button>
          <button class="btn btn-primary" id="landing-cta-nav">Get Started</button>
        </div>
      </nav>

      <section class="hero-section">
        <div class="hero-content slide-up">
          <div class="hero-badge">
            <i data-lucide="shield" style="width: 14px; height: 14px; margin-right: 6px;"></i>
            100% Private • Offline-First • No Login
          </div>
          <h1 class="hero-title">
            Build beautiful forms <br>
            <span class="text-gradient">in seconds, not minutes.</span>
          </h1>
          <p class="hero-subtitle">
            The zero-login form builder that respects your privacy. All data stays in your browser. 
            Powerful analytics, offline support, and a modular plugin system.
          </p>
          <div class="hero-cta">
            <button class="btn btn-primary btn-lg" id="landing-cta-main">
              Create Your First Form <i data-lucide="zap" style="margin-left: 8px;"></i>
            </button>
            <p class="hero-cta-note">Free forever. No account required.</p>
          </div>
        </div>
        
        <div class="hero-visual fade-in" style="animation-delay: 0.4s">
          <div class="floating-card card-1">
            <i data-lucide="layout" style="color: var(--primary-500);"></i>
            <span>Drag & Drop Builder</span>
          </div>
          <div class="floating-card card-2">
            <i data-lucide="bar-chart-2" style="color: var(--accent-500);"></i>
            <span>Real-time Analytics</span>
          </div>
          <div class="floating-card card-3">
            <i data-lucide="puzzle" style="color: #00b894;"></i>
            <span>Modular Plugins</span>
          </div>
          <div class="hero-preview-box card">
            <div class="preview-header">
              <div class="preview-dot"></div>
              <div class="preview-dot"></div>
              <div class="preview-dot"></div>
            </div>
            <div class="preview-content">
              <div class="preview-skeleton-title"></div>
              <div class="preview-skeleton-text"></div>
              <div class="preview-skeleton-input"></div>
              <div class="preview-skeleton-button"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="features-section grid grid-3">
        <div class="feature-card reveal">
          <div class="feature-icon"><i data-lucide="shield"></i></div>
          <h3>Privacy First</h3>
          <p>No servers involve. Your data never leaves your device. We use IndexedDB for secure local storage.</p>
        </div>
        <div class="feature-card reveal">
          <div class="feature-icon"><i data-lucide="zap"></i></div>
          <h3>Blazing Fast</h3>
          <p>Instant loading and real-time auto-save. Built with performance in mind using Vite and Vanilla JS.</p>
        </div>
        <div class="feature-card reveal">
          <div class="feature-icon"><i data-lucide="globe"></i></div>
          <h3>PWA & Offline</h3>
          <p>Works perfectly without an internet connection. Install it on your home screen like a native app.</p>
        </div>
      </section>

      <footer class="landing-footer">
        <div class="footer-content">
          <p>© 2026 Ephemeral Forms. Open Source Privacy-First Tooling.</p>
        </div>
      </footer>
    </div>
  `;

  createIcons({
    icons: {
      Sparkles, Shield, Zap, Globe, MousePointer2, Layout, BarChart2, Puzzle
    }
  });

  // Bind Events
  container.querySelector('#landing-login-btn').addEventListener('click', () => navigateTo('/dashboard'));
  container.querySelector('#landing-cta-nav').addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#landing-cta-main').addEventListener('click', () => navigateTo('/build'));

  // Intersection Observer for reveal animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}
