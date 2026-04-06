import { createIcons, BookOpen, Code, FileText, Settings, Key, Zap } from 'lucide';

export function renderDocs(container) {
  container.innerHTML = `
    <div class="page-container fade-in">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Documentation</h1>
          <p class="page-subtitle">Learn how to use Ephemeral Forms and extend it with Plugins.</p>
        </div>
      </div>

      <div class="docs-layout">
        <aside class="docs-sidebar">
          <ul class="docs-nav">
            <li><a href="#docs-intro" class="docs-nav-link active"><i data-lucide="book-open"></i> Introduction</a></li>
            <li><a href="#docs-forms" class="docs-nav-link"><i data-lucide="file-text"></i> Using Forms</a></li>
            <li><a href="#docs-plugins" class="docs-nav-link"><i data-lucide="puzzle"></i> Plugin System</a></li>
            <li><a href="#docs-api" class="docs-nav-link"><i data-lucide="code"></i> API Reference</a></li>
          </ul>
        </aside>

        <div class="docs-content">
          <section id="docs-intro" class="docs-section">
            <h2>Welcome to Ephemeral Forms</h2>
            <p>Ephemeral Forms is a zero-login, offline-first form builder running purely in your browser. All of your data is stored locally in IndexedDB.</p>
            
            <div class="card" style="padding: 1.5rem; margin-top: 1rem; border-left: 4px solid var(--primary-500);">
              <h4>Privacy First</h4>
              <p style="margin-top: 0.5rem; color: var(--text-secondary);">No data is ever sent to a server unless you specifically export it or write a custom plugin to do so.</p>
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

            <pre class="code-block"><code>
// Example of a basic plugin
window.EphemeralPlugins.register({
  id: 'my-custom-plugin',
  name: 'My Custom Feature',
  description: 'Does something awesome',
  icon: 'zap',
  init: (api) => {
    console.log('Plugin initialized!');
  }
});
            </code></pre>
          </section>

          <section id="docs-api" class="docs-section">
            <h2>API Reference</h2>
            <p>The <code>api</code> object passed to your init function exposes several capabilities:</p>

            <div class="api-card card">
              <h4><code>api.registerQuestionType(type, config)</code></h4>
              <p>Adds a new question type to the builder.</p>
              <ul>
                <li><strong>type:</strong> String identifier (e.g., 'star_rating')</li>
                <li><strong>config:</strong> Object containing <code>label</code>, <code>icon</code>, <code>render()</code>, and <code>validate()</code></li>
              </ul>
            </div>

            <div class="api-card card">
              <h4><code>api.addHook(event, callback)</code></h4>
              <p>Listen to core application events.</p>
              <ul>
                <li><strong>event:</strong> 'onFormSubmit', 'beforeSave', etc.</li>
                <li><strong>callback:</strong> Function triggered with event data.</li>
              </ul>
            </div>

            <div class="api-card card">
              <h4><code>api.registerTheme(themeDefinition)</code></h4>
              <p>Register a completely custom CSS theme for the responder view.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;

  // Init Lucide Icons
  createIcons({
    icons: {
      BookOpen, Code, FileText, Settings, Key, Zap
    }
  });

  // Smooth scrolling for docs nav
  const links = container.querySelectorAll('.docs-nav-link');
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
  const content = container.querySelector('.page-container');
  const sections = container.querySelectorAll('.docs-section');
  
  content.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
      const secTop = sec.offsetTop;
      if (content.scrollTop >= (secTop - 150)) {
        current = sec.getAttribute('id');
      }
    });

    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === current) {
        link.classList.add('active');
      }
    });
  });
}
