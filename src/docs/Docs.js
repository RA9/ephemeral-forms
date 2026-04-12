import { createIcons, BookOpen, Code, FileText, Settings, Key, Zap, ArrowRight, Sun, Moon } from 'lucide';
import { navigateTo } from '../router.js';

export function renderDocs(container) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  container.innerHTML = `
    <div class="docs-page fade-in">

      <!-- Morph backdrop -->
      <div class="docs-backdrop" aria-hidden="true">
        <svg class="docs-backdrop-svg" viewBox="0 0 1440 560" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="dbg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--primary-500)" stop-opacity="0.06"/>
              <stop offset="100%" stop-color="var(--accent-500)" stop-opacity="0.03"/>
            </linearGradient>
            <linearGradient id="dbg2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--primary-400)" stop-opacity="0.04"/>
              <stop offset="100%" stop-color="var(--accent-400)" stop-opacity="0.06"/>
            </linearGradient>
          </defs>
          <path class="docs-blob docs-blob--1" fill="url(#dbg1)"
            d="M0,320 C180,240 360,400 540,300 C720,200 900,360 1080,280 C1260,200 1380,320 1440,280 L1440,0 L0,0 Z"/>
          <path class="docs-blob docs-blob--2" fill="url(#dbg2)"
            d="M0,200 C240,320 480,160 720,260 C960,360 1200,200 1440,300 L1440,560 L0,560 Z"/>
          <g class="docs-dots" fill="var(--primary-500)" opacity="0.04">
            ${Array.from({ length: 30 }, (_, i) => {
              const x = (i % 10) * 150 + 45;
              const y = Math.floor(i / 10) * 180 + 60;
              return `<circle cx="${x}" cy="${y}" r="2"/>`;
            }).join('')}
          </g>
        </svg>
      </div>

      <!-- Nav (same style as landing) -->
      <nav class="docs-nav">
        <div class="docs-nav-inner">
          <a class="docs-nav-logo" id="docs-nav-home">
            <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="2" width="20" height="26" rx="3" fill="#6c5ce7"/>
              <rect x="8" y="8" width="10" height="2" rx="1" fill="rgba(255,255,255,0.9)"/>
              <rect x="8" y="13" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
              <rect x="8" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
              <circle cx="26" cy="6" r="2" fill="#6c5ce7" opacity="0.7"/>
              <circle cx="28" cy="12" r="1.5" fill="#6c5ce7" opacity="0.45"/>
              <circle cx="26" cy="17" r="1" fill="#6c5ce7" opacity="0.25"/>
            </svg>
            <span>Ephemeral Forms</span>
          </a>
          <div class="docs-nav-links">
            <button class="docs-nav-link" id="docs-theme-toggle" title="${isDark ? 'Light' : 'Dark'} mode">
              <i data-lucide="${isDark ? 'sun' : 'moon'}" style="width:16px;height:16px;"></i>
            </button>
            <button class="docs-nav-link" id="docs-nav-back">
              <i data-lucide="arrow-right" style="width:14px;height:14px;transform:rotate(180deg);"></i> Back
            </button>
          </div>
        </div>
      </nav>

      <!-- Content -->
      <div class="docs-wrapper">
        <div class="docs-hero">
          <h1 class="docs-hero-title">Documentation</h1>
          <p class="docs-hero-sub">Learn how to use Ephemeral Forms and extend it with plugins.</p>
        </div>

        <div class="docs-layout">
          <aside class="docs-sidebar">
            <ul class="docs-sidebar-nav">
              <li><a href="#docs-intro" class="docs-nav-item active"><i data-lucide="book-open"></i> Introduction</a></li>
              <li><a href="#docs-forms" class="docs-nav-item"><i data-lucide="file-text"></i> Using Forms</a></li>
              <li><a href="#docs-plugins" class="docs-nav-item"><i data-lucide="puzzle"></i> Plugin System</a></li>
              <li><a href="#docs-api" class="docs-nav-item"><i data-lucide="code"></i> API Reference</a></li>
            </ul>
          </aside>

          <div class="docs-content">
            <section id="docs-intro" class="docs-section">
              <h2>Welcome to Ephemeral Forms</h2>
              <p>Ephemeral Forms is a zero-login form builder. Create forms, share them with anyone, and collect responses — all without creating an account.</p>

              <div class="docs-callout">
                <h4>No Account Required</h4>
                <p>Your forms and responses are synced so you can access them from any device. A simple passphrase is all you need — no email, no password, no sign-up.</p>
              </div>
            </section>

            <section id="docs-forms" class="docs-section">
              <h2>Creating & Managing Forms</h2>
              <h3>The Form Builder</h3>
              <p>Navigate to <strong>Create Form</strong> to access the drag-and-drop builder. You can add multiple question types ranging from short text to complex linear scales.</p>
              <ul>
                <li><strong>Reordering:</strong> Use the drag handle on the top left of a question to move it.</li>
                <li><strong>Options:</strong> For multiple choice or dropdowns, click "+ Add option".</li>
                <li><strong>Settings:</strong> Change the theme color or the completion message in the right sidebar.</li>
              </ul>

              <h3>Sharing Forms</h3>
              <p>Click the <strong>Share</strong> button to copy a special link. Since the app is offline-first, standard sharing links embed the form definition into the URL if there's no backend, or it relies on local storage for same-device responding.</p>

              <h3>Viewing Responses</h3>
              <p>Navigate to your <strong>Dashboard</strong> and click on a form to see its responses. The analytics page provides automatically generated charts for multi-choice data, and allows you to export all answers as CSV or JSON.</p>
            </section>

            <section id="docs-plugins" class="docs-section">
              <h2>The Plugin System</h2>
              <p>Ephemeral Forms is designed to be highly extensible. You can build plugins that add new question types, new themes, or new export formats.</p>

              <h3>How Plugins Work</h3>
              <p>Plugins interact with the global <code>PluginAPI</code>. They must define a unique ID, a name, and an <code>init</code> function.</p>

              <pre class="code-block"><code>// Example of a basic plugin
window.EphemeralPlugins.register({
  id: 'my-custom-plugin',
  name: 'My Custom Feature',
  description: 'Does something awesome',
  icon: 'zap',
  init: (api) => {
    console.log('Plugin initialized!');
  }
});</code></pre>
            </section>

            <section id="docs-api" class="docs-section">
              <h2>API Reference</h2>
              <p>The <code>api</code> object passed to your init function exposes several capabilities:</p>

              <div class="docs-api-card">
                <h4><code>api.registerQuestionType(type, config)</code></h4>
                <p>Adds a new question type to the builder.</p>
                <ul>
                  <li><strong>type:</strong> String identifier (e.g., 'star_rating')</li>
                  <li><strong>config:</strong> Object containing <code>label</code>, <code>icon</code>, <code>render()</code>, and <code>validate()</code></li>
                </ul>
              </div>

              <div class="docs-api-card">
                <h4><code>api.addHook(event, callback)</code></h4>
                <p>Listen to core application events.</p>
                <ul>
                  <li><strong>event:</strong> 'onFormSubmit', 'beforeSave', etc.</li>
                  <li><strong>callback:</strong> Function triggered with event data.</li>
                </ul>
              </div>

              <div class="docs-api-card">
                <h4><code>api.registerTheme(themeDefinition)</code></h4>
                <p>Register a completely custom CSS theme for the responder view.</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="docs-footer">
        <div class="docs-footer-inner">
          <div class="docs-footer-brand">
            <svg viewBox="0 0 32 32" width="18" height="18" fill="none"><rect x="4" y="2" width="20" height="26" rx="3" fill="#6c5ce7"/><rect x="8" y="8" width="10" height="2" rx="1" fill="rgba(255,255,255,0.9)"/><rect x="8" y="13" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/><rect x="8" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/><circle cx="26" cy="6" r="2" fill="#6c5ce7" opacity="0.7"/><circle cx="28" cy="12" r="1.5" fill="#6c5ce7" opacity="0.45"/><circle cx="26" cy="17" r="1" fill="#6c5ce7" opacity="0.25"/></svg>
            <span>Ephemeral Forms</span>
          </div>
          <div class="docs-footer-links">
            <button class="docs-footer-link" id="docs-footer-home">Home</button>
            <button class="docs-footer-link" id="docs-footer-dashboard">Dashboard</button>
          </div>
        </div>
      </footer>
    </div>
  `;

  createIcons({ icons: { BookOpen, Code, FileText, Settings, Key, Zap, ArrowRight, Sun, Moon } });

  // Nav events
  container.querySelector('#docs-nav-home')?.addEventListener('click', () => navigateTo('/'));
  container.querySelector('#docs-nav-back')?.addEventListener('click', () => history.back());
  container.querySelector('#docs-footer-home')?.addEventListener('click', () => navigateTo('/'));
  container.querySelector('#docs-footer-dashboard')?.addEventListener('click', () => navigateTo('/dashboard'));

  // Theme toggle
  container.querySelector('#docs-theme-toggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    renderDocs(container);
  });

  // Smooth scrolling for sidebar nav
  const links = container.querySelectorAll('.docs-nav-item');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSec = container.querySelector('#' + targetId);

      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      if (targetSec) {
        targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Highlight active section on scroll
  const onScroll = () => {
    let current = '';
    container.querySelectorAll('.docs-section').forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 160) {
        current = sec.getAttribute('id');
      }
    });
    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', onScroll);
}
