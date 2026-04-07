// WorkspaceDashboard — global view of all shared forms for a creator
// Route: #/workspace
import { createIcons, FileText, BarChart2, Puzzle, Clock, Shield, LogOut, Plus, ExternalLink, Copy, Users } from 'lucide';
import { getCreatorForms, getCreatorById, getCreatorPlugins, verifyCreator } from '../firebase/creatorService.js';
import { getAuditLogs } from '../firebase/shareService.js';
import { getWorkspaceSession, setWorkspaceSession, clearWorkspaceSession, getCreatorId, saveCreatorId } from '../storage/creatorStore.js';
import { showToast, formatDate, escapeHtml } from '../utils.js';
import { navigateTo } from '../router.js';

export async function renderWorkspaceDashboard(container) {
  const session = getWorkspaceSession();

  if (!session) {
    await renderWorkspaceGate(container);
    return;
  }

  await renderWorkspace(container, session);
}

// ============================================================
// Passphrase Gate
// ============================================================

async function renderWorkspaceGate(container) {
  const localCreator = await getCreatorId();

  if (localCreator) {
    // Returning creator — ask for passphrase
    let creatorInfo;
    try { creatorInfo = await getCreatorById(localCreator.creatorId); } catch { creatorInfo = null; }
    const name = creatorInfo?.displayName || localCreator.displayName || 'Creator';

    container.innerHTML = `
      <div class="page-container fade-in" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
        <div class="card" style="max-width:400px;width:100%;padding:var(--space-8);text-align:center;">
          <div style="width:56px;height:56px;background:var(--primary-50);color:var(--primary-500);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);">
            <i data-lucide="shield" style="width:24px;height:24px;"></i>
          </div>
          <h2 style="font-size:var(--font-xl);margin-bottom:var(--space-2);">Welcome back, ${escapeHtml(name)}</h2>
          <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-6);">Enter your passphrase to access your workspace.</p>
          <input type="password" class="input" id="ws-pass" placeholder="Your passphrase" style="text-align:center;font-size:var(--font-base);margin-bottom:var(--space-3);" />
          <div id="ws-error" style="font-size:var(--font-xs);color:var(--error);min-height:20px;margin-bottom:var(--space-4);"></div>
          <button class="btn btn-primary" id="ws-unlock" style="width:100%;">Unlock Workspace</button>
        </div>
      </div>
    `;
    createIcons({ icons: { Shield } });

    container.querySelector('#ws-pass')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') container.querySelector('#ws-unlock')?.click();
    });

    container.querySelector('#ws-unlock')?.addEventListener('click', async () => {
      const pass = container.querySelector('#ws-pass')?.value;
      const errEl = container.querySelector('#ws-error');
      const btn = container.querySelector('#ws-unlock');
      if (!pass) { errEl.textContent = 'Please enter your passphrase.'; return; }

      btn.textContent = 'Verifying...'; btn.disabled = true;
      try {
        const creator = await verifyCreator(localCreator.creatorId, pass);
        if (!creator) { errEl.textContent = 'Incorrect passphrase.'; btn.textContent = 'Unlock Workspace'; btn.disabled = false; return; }
        setWorkspaceSession(creator);
        await renderWorkspace(container, creator);
      } catch (err) {
        errEl.textContent = 'Error: ' + err.message;
        btn.textContent = 'Unlock Workspace'; btn.disabled = false;
      }
    });
  } else {
    // No creator identity yet
    container.innerHTML = `
      <div class="page-container fade-in" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
        <div class="card" style="max-width:440px;width:100%;padding:var(--space-8);text-align:center;">
          <div style="width:56px;height:56px;background:var(--primary-50);color:var(--primary-500);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);">
            <i data-lucide="users" style="width:24px;height:24px;"></i>
          </div>
          <h2 style="font-size:var(--font-xl);margin-bottom:var(--space-2);">No Workspace Yet</h2>
          <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-6);">
            Your workspace is created when you share your first form. Build a form, click Share, and set up your creator identity.
          </p>
          <button class="btn btn-primary" id="ws-create-form">Create a Form</button>
        </div>
      </div>
    `;
    createIcons({ icons: { Users } });
    container.querySelector('#ws-create-form')?.addEventListener('click', () => navigateTo('/build'));
  }
}

// ============================================================
// Main Workspace View
// ============================================================

async function renderWorkspace(container, session) {
  container.innerHTML = `
    <div class="page-container fade-in" style="text-align:center;padding-top:var(--space-16);">
      <div class="spinner" style="width:32px;height:32px;border:3px solid var(--border-light);border-top-color:var(--primary-500);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto var(--space-4);"></div>
      <p style="color:var(--text-secondary);font-size:var(--font-sm);">Loading workspace...</p>
    </div>
  `;

  let forms, plugins;
  try {
    [forms, plugins] = await Promise.all([
      getCreatorForms(session.creatorId),
      getCreatorPlugins(session.creatorId),
    ]);
  } catch (err) {
    container.innerHTML = `<div class="page-container fade-in" style="text-align:center;padding-top:var(--space-16);"><h2>Error</h2><p style="color:var(--text-secondary)">${escapeHtml(err.message)}</p></div>`;
    return;
  }

  let activeTab = 'forms';

  const render = () => {
    container.innerHTML = `
      <div class="page-container fade-in">
        <div class="page-title-row">
          <div>
            <h1 class="page-title">Workspace</h1>
            <p class="page-subtitle">
              Logged in as <strong>${escapeHtml(session.displayName)}</strong>
              — ${forms.length} shared form${forms.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style="display:flex;gap:var(--space-2);">
            <button class="btn btn-primary btn-sm" id="ws-new-form"><i data-lucide="plus" style="margin-right:6px;width:16px;height:16px;"></i>Create Form</button>
            <button class="btn btn-ghost btn-sm" id="ws-lock"><i data-lucide="log-out" style="margin-right:6px;width:16px;height:16px;"></i>Lock</button>
          </div>
        </div>

        <div class="tabs" id="ws-tabs">
          <button class="tab ${activeTab === 'forms' ? 'active' : ''}" data-tab="forms">Forms (${forms.length})</button>
          <button class="tab ${activeTab === 'plugins' ? 'active' : ''}" data-tab="plugins">Plugins (${plugins.length})</button>
        </div>

        <div id="ws-content">
          ${activeTab === 'forms' ? renderForms(forms) : renderPlugins(plugins)}
        </div>
      </div>
    `;

    createIcons({ icons: { FileText, BarChart2, Puzzle, Clock, Shield, LogOut, Plus, ExternalLink, Copy, Users } });

    // Tabs
    container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.tab; render(); });
    });

    container.querySelector('#ws-new-form')?.addEventListener('click', () => navigateTo('/build'));
    container.querySelector('#ws-lock')?.addEventListener('click', () => {
      clearWorkspaceSession();
      renderWorkspaceGate(container);
    });

    // Form card clicks
    container.querySelectorAll('[data-manage-form]').forEach(card => {
      card.addEventListener('click', () => navigateTo(`/manage/${card.dataset.manageForm}`));
    });
  };

  render();
}

function renderForms(forms) {
  if (forms.length === 0) {
    return `
      <div class="empty-state" style="margin-top:var(--space-8)">
        <div class="empty-state-icon"><i data-lucide="file-text" style="width:48px;height:48px;"></i></div>
        <div class="empty-state-title">No shared forms yet</div>
        <div class="empty-state-text">Create a form and click Share to see it here.</div>
      </div>
    `;
  }

  return `
    <div class="form-grid grid grid-auto-fill" style="margin-top:var(--space-4);">
      ${forms.map(f => {
        const form = f.form;
        const themeColor = form.settings?.themeColor || '#6c5ce7';
        const qCount = (form.questions || []).length;
        return `
          <div class="form-card card" data-manage-form="${f.id}" style="cursor:pointer;">
            <div class="form-card-accent" style="background:${themeColor}"></div>
            <div class="form-card-body">
              <h4 class="form-card-title">${escapeHtml(form.title || 'Untitled Form')}</h4>
              <p class="form-card-desc">${escapeHtml(form.description || 'No description')}</p>
              <div class="form-card-meta">
                <span class="chip">${qCount} question${qCount !== 1 ? 's' : ''}</span>
                ${f.pluginIds?.length ? `<span class="chip">${f.pluginIds.length} plugin${f.pluginIds.length !== 1 ? 's' : ''}</span>` : ''}
              </div>
              <div class="form-card-footer">
                <span class="form-card-date">${formatDate(f.updatedAt)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderPlugins(plugins) {
  if (plugins.length === 0) {
    return `
      <div class="empty-state" style="margin-top:var(--space-8)">
        <div class="empty-state-icon"><i data-lucide="puzzle" style="width:48px;height:48px;"></i></div>
        <div class="empty-state-title">No synced plugins</div>
        <div class="empty-state-text">Custom plugins will appear here when they're used in shared forms.</div>
      </div>
    `;
  }

  return `
    <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4);">
      ${plugins.map(p => `
        <div class="card" style="padding:var(--space-4);display:flex;align-items:center;gap:var(--space-4);">
          <div style="width:40px;height:40px;background:var(--bg-tertiary);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--primary-500);">
            <i data-lucide="puzzle" style="width:18px;height:18px;"></i>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:var(--font-sm);font-weight:var(--font-weight-semibold);">${escapeHtml(p.name)}</div>
            <div style="font-size:var(--font-xs);color:var(--text-tertiary);">
              Used in ${(p.formIds || []).length} form${(p.formIds || []).length !== 1 ? 's' : ''}
              — synced ${formatDate(p.updatedAt)}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
