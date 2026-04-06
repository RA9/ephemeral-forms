import { createIcons, Puzzle, Star, PenTool, GitBranch, Zap, Palette, Link, Download, Plus, Sigma, Hash } from 'lucide';
import { getAllPlugins, enablePlugin, disablePlugin } from './PluginAPI.js';
import { showToast, escapeHtml, showModal } from '../utils.js';
import { addCustomPlugin } from '../storage/pluginStore.js';
import { v4 as uuidv4 } from 'uuid';

export function renderPluginManager(container) {
  const render = () => {
    const plugins = getAllPlugins();

    container.innerHTML = `
      <div class="page-container fade-in">
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Plugins</h1>
            <p class="page-subtitle">Extend Ephemeral Forms with powerful add-ons</p>
          </div>
          <button class="btn btn-primary" id="add-custom-plugin-btn">
            <i data-lucide="plus" style="margin-right: 8px;"></i> Add Custom Plugin
          </button>
        </div>

        <div class="plugins-grid grid grid-auto-fill">
          ${plugins.map(p => `
            <div class="plugin-card card ${p.enabled ? '' : 'disabled'}">
              <div class="plugin-card-header">
                <div class="plugin-icon">
                  <i data-lucide="${p.iconId || 'puzzle'}"></i>
                </div>
                <div class="plugin-info">
                  <h4 class="plugin-name">${escapeHtml(p.name)}</h4>
                  <span class="plugin-version">v${p.version || '1.0'}</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" data-plugin-toggle="${p.id}" ${p.enabled ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <p class="plugin-desc">${escapeHtml(p.description || '')}</p>
              <div class="plugin-tags">
                ${(p.tags || []).map(t => `<span class="chip">${t}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        ${plugins.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="puzzle" style="width: 48px; height: 48px;"></i></div>
            <div class="empty-state-title">No plugins installed</div>
            <div class="empty-state-text">Plugins will appear here once loaded.</div>
          </div>
        ` : ''}

        <div class="plugin-info-section card" style="margin-top: var(--space-8)">
          <h3 style="margin-bottom: var(--space-3)">About Plugins</h3>
          <p style="color: var(--text-secondary); font-size: var(--font-sm); line-height: var(--line-height-relaxed)">
            Plugins extend Ephemeral Forms with new question types, themes, validation rules, and export formats. 
            All built-in plugins are included by default. Toggle plugins on or off to customize your experience.
          </p>
          <div class="plugin-capabilities" style="margin-top: var(--space-4)">
            <div class="capability-item">
              <span class="capability-icon"><i data-lucide="zap"></i></span>
              <div>
                <strong>Question Types</strong>
                <p style="font-size:var(--font-xs);color:var(--text-tertiary)">Add new input types like ratings, signatures, and more</p>
              </div>
            </div>
            <div class="capability-item">
              <span class="capability-icon"><i data-lucide="palette"></i></span>
              <div>
                <strong>Themes</strong>
                <p style="font-size:var(--font-xs);color:var(--text-tertiary)">Custom visual themes for your forms</p>
              </div>
            </div>
            <div class="capability-item">
              <span class="capability-icon"><i data-lucide="link"></i></span>
              <div>
                <strong>Hooks</strong>
                <p style="font-size:var(--font-xs);color:var(--text-tertiary)">React to events like form submissions</p>
              </div>
            </div>
            <div class="capability-item">
              <span class="capability-icon"><i data-lucide="download"></i></span>
              <div>
                <strong>Export Formats</strong>
                <p style="font-size:var(--font-xs);color:var(--text-tertiary)">Export responses in additional formats</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    createIcons({
      icons: {
        Puzzle, Star, PenTool, GitBranch, Zap, Palette, Link, Download, Plus,
        Sigma, Hash
      }
    });

    // Add Custom Plugin
    container.querySelector('#add-custom-plugin-btn')?.addEventListener('click', async () => {
      const action = await showModal({
        title: 'Add Custom Plugin',
        body: `
          <p style="margin-bottom: var(--space-4); color: var(--text-secondary); font-size: var(--font-sm);">
            Paste your custom plugin JavaScript code below. Remember, only install plugins from sources you completely trust, as they run in your browser.
          </p>
          <textarea id="custom-plugin-code-input" class="textarea" style="font-family: monospace; height: 200px" placeholder="// window.EphemeralPlugins.register(...)"></textarea>
        `,
        actions: [
          { id: 'cancel', label: 'Cancel', class: 'btn-ghost' },
          { id: 'install', label: 'Install Plugin', class: 'btn-primary' }
        ]
      });

      if (action === 'install') {
        const code = document.getElementById('custom-plugin-code-input')?.value;
        if (code && code.trim()) {
          try {
            await addCustomPlugin({
              id: uuidv4(),
              code: code.trim()
            });
            showToast('Plugin installed! Reloading...', 'success');
            setTimeout(() => window.location.reload(), 1000);
          } catch (err) {
            showToast('Failed to install plugin', 'error');
            console.error(err);
          }
        } else {
          showToast('No code provided', 'warning');
        }
      }
    });

    // Toggle handlers

    // Toggle handlers
    container.querySelectorAll('[data-plugin-toggle]').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const id = e.target.dataset.pluginToggle;
        if (e.target.checked) {
          enablePlugin(id);
          showToast('Plugin enabled', 'success');
        } else {
          disablePlugin(id);
          showToast('Plugin disabled', 'info');
        }
        render();
      });
    });
  };

  render();
}

