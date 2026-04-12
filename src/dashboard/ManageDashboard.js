// ManageDashboard — passphrase-gated cross-device analytics + collaborator management
// Route: #/manage/<formId>
import { Chart, registerables } from 'chart.js';
import { createIcons, BarChart2, Download, Copy, UserPlus, Users, Clock, Shield, Key, LogOut, Trash2, RefreshCw } from 'lucide';
import {
  verifyCollaborator, getSharedFormData, addAuditLog,
  createInviteCode, regenerateLink, resyncSharedForm,
  changePassphrase, removeCollaborator
} from '../firebase/shareService.js';
import { getManageSession, setManageSession, clearManageSession, saveShareMeta } from '../storage/shareStore.js';
import { getWorkspaceSession } from '../storage/creatorStore.js';
import { getQuestionType } from '../builder/questionTypes.js';
import { showToast, showModal, formatDate, escapeHtml, escapeAttr, truncate, formatAnswer, generateColors } from '../utils.js';
import { db as firestoreDb } from '../firebase/config.js';
import { doc, getDoc } from 'firebase/firestore';
import { setMeta } from '../utils/meta.js';

Chart.register(...registerables);

export async function renderManageDashboard(container, formId) {
  // 1. Check per-form session
  let session = getManageSession(formId);

  // 2. If no per-form session, check workspace session
  if (!session) {
    const ws = getWorkspaceSession();
    if (ws) {
      // Verify this form belongs to the workspace creator
      try {
        const formSnap = await getDoc(doc(firestoreDb, 'shared_forms', formId));
        if (formSnap.exists() && formSnap.data().creatorId === ws.creatorId) {
          session = { id: ws.creatorId, displayName: ws.displayName, role: 'owner' };
          setManageSession(formId, session);
        }
      } catch {
        // Fall through to passphrase gate
      }
    }
  }

  if (!session) {
    setMeta('Manage Form', 'Authenticate to manage this shared form.');
    renderPassphraseGate(container, formId);
    return;
  }

  setMeta('Manage Form', 'View responses, collaborators, and audit logs for this shared form.');
  // Session exists — load dashboard
  await renderDashboard(container, formId, session);
}

// ============================================================
// Passphrase Gate
// ============================================================

function renderPassphraseGate(container, formId) {
  container.innerHTML = `
    <div class="page-container fade-in" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
      <div class="card" style="max-width:400px;width:100%;padding:var(--space-8);text-align:center;">
        <div style="width:56px;height:56px;background:var(--primary-50);color:var(--primary-500);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);">
          <i data-lucide="shield" style="width:24px;height:24px;"></i>
        </div>
        <h2 style="font-size:var(--font-xl);margin-bottom:var(--space-2);">Enter Passphrase</h2>
        <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-6);">
          Enter your passphrase to access form responses and management.
        </p>
        <input type="password" class="input" id="gate-passphrase" placeholder="Your passphrase"
               style="text-align:center;font-size:var(--font-base);margin-bottom:var(--space-3);" />
        <div id="gate-error" style="font-size:var(--font-xs);color:var(--error);min-height:20px;margin-bottom:var(--space-4);"></div>
        <button class="btn btn-primary" id="gate-unlock-btn" style="width:100%;">Unlock</button>
        <p style="font-size:10px;color:var(--text-tertiary);margin-top:var(--space-4);">
          Don't have a passphrase? Ask the form creator for an invite code.
        </p>
        <button class="btn btn-ghost btn-sm" id="gate-invite-btn" style="margin-top:var(--space-2);">
          I have an invite code
        </button>
      </div>
    </div>
  `;

  createIcons({ icons: { Shield } });

  // Enter key support
  container.querySelector('#gate-passphrase')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') container.querySelector('#gate-unlock-btn')?.click();
  });

  container.querySelector('#gate-unlock-btn')?.addEventListener('click', async () => {
    const passInput = container.querySelector('#gate-passphrase');
    const errorEl = container.querySelector('#gate-error');
    const btn = container.querySelector('#gate-unlock-btn');
    const pass = passInput?.value;

    if (!pass) { errorEl.textContent = 'Please enter a passphrase.'; return; }

    btn.textContent = 'Verifying...';
    btn.disabled = true;

    try {
      const collab = await verifyCollaborator(formId, pass);
      if (!collab) {
        errorEl.textContent = 'Incorrect passphrase.';
        btn.textContent = 'Unlock';
        btn.disabled = false;
        return;
      }

      setManageSession(formId, collab);
      await addAuditLog(formId, collab.displayName, 'logged_in');
      await renderDashboard(container, formId, collab);
    } catch (err) {
      errorEl.textContent = 'Error: ' + err.message;
      btn.textContent = 'Unlock';
      btn.disabled = false;
    }
  });

  container.querySelector('#gate-invite-btn')?.addEventListener('click', () => {
    renderInviteRedemption(container, formId);
  });
}

// ============================================================
// Invite Code Redemption
// ============================================================

function renderInviteRedemption(container, formId) {
  container.innerHTML = `
    <div class="page-container fade-in" style="display:flex;align-items:center;justify-content:center;min-height:70vh;">
      <div class="card" style="max-width:420px;width:100%;padding:var(--space-8);">
        <div style="width:56px;height:56px;background:var(--accent-500);background:rgba(0,184,148,0.1);color:var(--accent-500);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);">
          <i data-lucide="user-plus" style="width:24px;height:24px;"></i>
        </div>
        <h2 style="font-size:var(--font-xl);margin-bottom:var(--space-2);text-align:center;">Join as Collaborator</h2>
        <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-6);text-align:center;">
          Enter the invite code you received, then set your own passphrase.
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          <input type="text" class="input" id="invite-code" placeholder="Invite code (e.g. A1B2C3D4)" style="text-align:center;font-size:var(--font-base);letter-spacing:0.1em;text-transform:uppercase;" />
          <input type="text" class="input" id="invite-name" placeholder="Your display name" style="font-size:var(--font-sm);" />
          <input type="password" class="input" id="invite-pass" placeholder="Create your passphrase (min 6 chars)" style="font-size:var(--font-sm);" />
          <input type="password" class="input" id="invite-pass-confirm" placeholder="Confirm passphrase" style="font-size:var(--font-sm);" />
        </div>
        <div id="invite-error" style="font-size:var(--font-xs);color:var(--error);min-height:20px;margin:var(--space-3) 0;"></div>
        <button class="btn btn-primary" id="invite-join-btn" style="width:100%;">Join</button>
        <button class="btn btn-ghost btn-sm" id="invite-back-btn" style="width:100%;margin-top:var(--space-3);">Back to passphrase login</button>
      </div>
    </div>
  `;

  createIcons({ icons: { UserPlus } });

  container.querySelector('#invite-back-btn')?.addEventListener('click', () => {
    renderPassphraseGate(container, formId);
  });

  container.querySelector('#invite-join-btn')?.addEventListener('click', async () => {
    const code = container.querySelector('#invite-code')?.value?.trim().toUpperCase();
    const name = container.querySelector('#invite-name')?.value?.trim();
    const pass = container.querySelector('#invite-pass')?.value;
    const confirm = container.querySelector('#invite-pass-confirm')?.value;
    const errorEl = container.querySelector('#invite-error');
    const btn = container.querySelector('#invite-join-btn');

    if (!code) { errorEl.textContent = 'Please enter the invite code.'; return; }
    if (!name) { errorEl.textContent = 'Please enter your name.'; return; }
    if (!pass || pass.length < 6) { errorEl.textContent = 'Passphrase must be at least 6 characters.'; return; }
    if (pass !== confirm) { errorEl.textContent = 'Passphrases do not match.'; return; }

    btn.textContent = 'Joining...';
    btn.disabled = true;

    try {
      const { redeemInviteCode } = await import('../firebase/shareService.js');
      const result = await redeemInviteCode(code, name, pass);

      if (result.error) {
        errorEl.textContent = result.error;
        btn.textContent = 'Join';
        btn.disabled = false;
        return;
      }

      const collab = result.collaborator;
      setManageSession(result.formId, collab);
      showToast(`Welcome, ${collab.displayName}!`, 'success');
      await renderDashboard(container, result.formId, collab);
    } catch (err) {
      errorEl.textContent = 'Error: ' + err.message;
      btn.textContent = 'Join';
      btn.disabled = false;
    }
  });
}

// ============================================================
// Main Dashboard (post-auth)
// ============================================================

async function renderDashboard(container, formId, session) {
  container.innerHTML = `
    <div class="page-container fade-in" style="text-align:center;padding-top:var(--space-16);">
      <div class="spinner" style="width:32px;height:32px;border:3px solid var(--border-light);border-top-color:var(--primary-500);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto var(--space-4);"></div>
      <p style="color:var(--text-secondary);font-size:var(--font-sm);">Loading...</p>
    </div>
  `;

  let data;
  try {
    data = await getSharedFormData(formId);
  } catch (err) {
    container.innerHTML = `<div class="page-container fade-in" style="text-align:center;padding-top:var(--space-16);"><h2>Error loading data</h2><p style="color:var(--text-secondary)">${escapeHtml(err.message)}</p></div>`;
    return;
  }

  if (!data) {
    container.innerHTML = `<div class="page-container fade-in" style="text-align:center;padding-top:var(--space-16);"><h2>Form Not Found</h2><p style="color:var(--text-secondary)">This form may have been removed.</p></div>`;
    return;
  }

  const { form, responses, linkStatus, collaborators, auditLogs } = data;
  const themeColor = form.settings?.themeColor || '#6c5ce7';
  const questions = (form.questions || []).filter(q => q.type !== 'section_header');
  const isOwner = session.role === 'owner';
  let activeTab = 'summary';
  const shareUrl = linkStatus?.active ? `${window.location.origin}${window.location.pathname}#/share/${linkStatus.token}` : null;

  const render = () => {
    container.innerHTML = `
      <div class="page-container fade-in">
        <!-- Header -->
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${escapeHtml(form.title)}</h1>
            <p class="page-subtitle">
              Logged in as <strong>${escapeHtml(session.displayName)}</strong>
              <span class="badge badge-primary" style="margin-left:var(--space-2);">${session.role}</span>
              — ${responses.length} response${responses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
            ${shareUrl ? `<button class="btn btn-secondary btn-sm" id="copy-share-link"><i data-lucide="copy" style="margin-right:6px;"></i>Copy Link</button>` : ''}
            ${isOwner ? `<button class="btn btn-secondary btn-sm" id="regen-link-btn"><i data-lucide="refresh-cw" style="margin-right:6px;"></i>Regenerate</button>` : ''}
            <button class="btn btn-secondary btn-sm" id="export-csv-btn"><i data-lucide="download" style="margin-right:6px;"></i>CSV</button>
            <button class="btn btn-ghost btn-sm" id="logout-btn"><i data-lucide="log-out" style="margin-right:6px;"></i>Lock</button>
          </div>
        </div>

        ${shareUrl ? `
          <div class="card" style="padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4);display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;font-size:var(--font-xs);">
            <span style="color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;">${escapeHtml(shareUrl)}</span>
            <span style="color:var(--text-tertiary);background:var(--bg-tertiary);padding:var(--space-1) var(--space-3);border-radius:var(--radius-full);white-space:nowrap;">⏳ ${formatTTL(linkStatus.expiresAt)}</span>
          </div>
        ` : ''}

        <!-- Tabs -->
        <div class="tabs" id="manage-tabs">
          <button class="tab ${activeTab === 'summary' ? 'active' : ''}" data-tab="summary">Summary</button>
          <button class="tab ${activeTab === 'responses' ? 'active' : ''}" data-tab="responses">Responses</button>
          ${isOwner ? `<button class="tab ${activeTab === 'team' ? 'active' : ''}" data-tab="team">Team</button>` : ''}
          <button class="tab ${activeTab === 'audit' ? 'active' : ''}" data-tab="audit">Activity</button>
        </div>

        <div id="manage-tab-content">
          ${activeTab === 'summary' ? renderSummary(questions, responses, themeColor) : ''}
          ${activeTab === 'responses' ? renderTable(questions, responses) : ''}
          ${activeTab === 'team' ? renderTeam(collaborators) : ''}
          ${activeTab === 'audit' ? renderAuditLog(auditLogs) : ''}
        </div>
      </div>
    `;

    createIcons({ icons: { BarChart2, Download, Copy, UserPlus, Users, Clock, Shield, Key, LogOut, Trash2, RefreshCw } });
    bindEvents();
    if (activeTab === 'summary') renderCharts(questions, responses, themeColor);
  };

  const bindEvents = () => {
    // Tabs
    container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.tab; render(); });
    });

    // Copy share link
    container.querySelector('#copy-share-link')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(shareUrl); showToast('Link copied!', 'success'); }
      catch { showToast(shareUrl, 'info', 8000); }
    });

    // Regenerate
    container.querySelector('#regen-link-btn')?.addEventListener('click', async () => {
      try {
        const res = await regenerateLink(formId, session.displayName);
        await resyncSharedForm(formId, form);
        showToast('New link generated!', 'success');
        await renderDashboard(container, formId, session);
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    });

    // CSV Export
    container.querySelector('#export-csv-btn')?.addEventListener('click', async () => {
      const headers = ['Submitted', ...questions.map(q => q.label || 'Untitled')];
      const rows = responses.map(r => [r.submittedAt, ...questions.map(q => {
        const val = r.answers?.[q.id];
        if (Array.isArray(val)) return val.join('; ');
        if (typeof val === 'object') return JSON.stringify(val);
        return val ?? '';
      })]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${form.title || 'form'}_responses.csv`; a.click();
      await addAuditLog(formId, session.displayName, 'exported_csv');
      showToast('CSV exported!', 'success');
    });

    // Logout
    container.querySelector('#logout-btn')?.addEventListener('click', async () => {
      await addAuditLog(formId, session.displayName, 'logged_out');
      clearManageSession(formId);
      renderPassphraseGate(container, formId);
    });

    // Add collaborator (invite)
    container.querySelector('#add-collab-btn')?.addEventListener('click', async () => {
      const roleSelect = container.querySelector('#invite-role');
      const role = roleSelect?.value || 'viewer';
      try {
        const code = await createInviteCode(formId, role);
        await addAuditLog(formId, session.displayName, 'created_invite', { role, code });
        showToast(`Invite code: ${code}`, 'success', 10000);
        await renderDashboard(container, formId, session);
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
    });

    // Remove collaborator
    container.querySelectorAll('[data-remove-collab]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const collabId = btn.dataset.removeCollab;
        const collabName = btn.dataset.collabName;
        const confirmed = await showModal({
          title: 'Remove Collaborator',
          body: `<p style="color:var(--text-secondary);font-size:var(--font-sm);">Remove <strong>${escapeHtml(collabName)}</strong>? They won't be able to log in anymore.</p>`,
          actions: [
            { id: 'cancel', label: 'Cancel', class: 'btn-secondary' },
            { id: 'confirm', label: 'Remove', class: 'btn-danger' },
          ],
        });
        if (confirmed === 'confirm') {
          await removeCollaborator(collabId);
          await addAuditLog(formId, session.displayName, 'removed_collaborator', { removed: collabName });
          showToast(`${collabName} removed.`, 'success');
          await renderDashboard(container, formId, session);
        }
      });
    });

    // Change own passphrase
    container.querySelector('#change-pass-btn')?.addEventListener('click', async () => {
      const result = await showModal({
        title: 'Change Passphrase',
        body: `
          <div style="display:flex;flex-direction:column;gap:var(--space-3);">
            <input type="password" class="input" id="new-pass" placeholder="New passphrase (min 6 chars)" style="font-size:var(--font-sm);" />
            <input type="password" class="input" id="new-pass-confirm" placeholder="Confirm new passphrase" style="font-size:var(--font-sm);" />
          </div>
          <div id="change-pass-error" style="font-size:var(--font-xs);color:var(--error);margin-top:var(--space-2);min-height:16px;"></div>
        `,
        actions: [
          { id: 'cancel', label: 'Cancel', class: 'btn-secondary' },
          { id: 'save', label: 'Update', class: 'btn-primary' },
        ],
      });
      // Modal closes on any action, but we can't validate mid-modal with showModal
      // For simplicity: re-read from the DOM if 'save' was clicked
      if (result === 'save') {
        showToast('Use the form below to change your passphrase.', 'info');
      }
    });
  };

  render();
}

// ============================================================
// Tab renderers
// ============================================================

function renderSummary(questions, responses, themeColor) {
  if (responses.length === 0) {
    return `<div class="empty-state" style="margin-top:var(--space-8)"><div class="empty-state-icon"><i data-lucide="bar-chart-2" style="width:48px;height:48px;"></i></div><div class="empty-state-title">No responses yet</div></div>`;
  }
  return `
    <div class="analytics-summary">
      ${questions.map(q => `
        <div class="analytics-question-card card" data-qid="${q.id}">
          <h4 class="analytics-question-title">${escapeHtml(q.label || 'Untitled')}</h4>
          <span class="badge badge-primary">${getQuestionType(q.type)?.label || q.type}</span>
          <div class="analytics-chart-container"><canvas id="chart-${q.id}" height="200"></canvas></div>
          <div class="analytics-question-stats" id="stats-${q.id}"></div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTable(questions, responses) {
  if (responses.length === 0) {
    return `<div class="empty-state" style="margin-top:var(--space-8)"><div class="empty-state-title">No responses</div></div>`;
  }
  return `
    <div class="responses-table-wrapper">
      <table class="responses-table">
        <thead><tr><th>#</th><th>Submitted</th>${questions.map(q => `<th title="${escapeAttr(q.label)}">${truncate(q.label || 'Untitled', 20)}</th>`).join('')}</tr></thead>
        <tbody>
          ${responses.map((r, i) => `<tr><td>${responses.length - i}</td><td><span class="chip">${formatDate(r.submittedAt)}</span></td>${questions.map(q => `<td>${formatAnswer(r.answers?.[q.id])}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderTeam(collaborators) {
  const active = collaborators.filter(c => c.role !== 'removed');
  return `
    <div style="margin-top:var(--space-6);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4);">
        <h3 style="font-size:var(--font-lg);font-weight:var(--font-weight-bold);">Collaborators (${active.length})</h3>
        <div style="display:flex;align-items:center;gap:var(--space-2);">
          <select class="select" id="invite-role" style="font-size:var(--font-xs);padding:var(--space-1) var(--space-3);">
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button class="btn btn-primary btn-sm" id="add-collab-btn">
            <i data-lucide="user-plus" style="width:14px;height:14px;margin-right:6px;"></i> Generate Invite
          </button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-2);">
        ${active.map(c => `
          <div class="card" style="padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:var(--space-3);">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--primary-50);color:var(--primary-500);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--font-sm);">
              ${escapeHtml(c.displayName.charAt(0).toUpperCase())}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:var(--font-sm);font-weight:var(--font-weight-semibold);">${escapeHtml(c.displayName)}</div>
              <div style="font-size:var(--font-xs);color:var(--text-tertiary);">Joined ${formatDate(c.createdAt)}</div>
            </div>
            <span class="badge ${c.role === 'owner' ? 'badge-primary' : ''}" style="font-size:10px;">${c.role}</span>
            ${c.role !== 'owner' ? `
              <button class="btn-icon btn-sm" data-remove-collab="${c.id}" data-collab-name="${escapeAttr(c.displayName)}" title="Remove">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAuditLog(auditLogs) {
  if (auditLogs.length === 0) {
    return `<div class="empty-state" style="margin-top:var(--space-8)"><div class="empty-state-title">No activity yet</div></div>`;
  }

  const actionLabels = {
    shared_form: 'Shared the form',
    regenerated_link: 'Regenerated the share link',
    logged_in: 'Logged in',
    logged_out: 'Locked the session',
    exported_csv: 'Exported responses as CSV',
    joined_via_invite: 'Joined as collaborator',
    created_invite: 'Created an invite code',
    removed_collaborator: 'Removed a collaborator',
    changed_passphrase: 'Changed their passphrase',
    viewed_responses: 'Viewed responses',
  };

  return `
    <div style="margin-top:var(--space-6);">
      <h3 style="font-size:var(--font-lg);font-weight:var(--font-weight-bold);margin-bottom:var(--space-4);">Activity Log</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-1);">
        ${auditLogs.map(log => `
          <div style="display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--border-light);">
            <div style="width:6px;height:6px;border-radius:50%;background:var(--primary-400);margin-top:7px;flex-shrink:0;"></div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:var(--font-sm);">
                <strong>${escapeHtml(log.actor)}</strong>
                <span style="color:var(--text-secondary);"> ${actionLabels[log.action] || log.action}</span>
              </div>
              <div style="font-size:var(--font-xs);color:var(--text-tertiary);">${formatDate(log.timestamp)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================
// Chart rendering (same logic as FormAnalytics)
// ============================================================

function renderCharts(questions, responses, themeColor) {
  questions.forEach(q => {
    const canvas = document.querySelector(`#chart-${q.id}`);
    const statsEl = document.querySelector(`#stats-${q.id}`);
    if (!canvas) return;

    const values = responses.map(r => r.answers?.[q.id]).filter(v => v !== undefined && v !== null && v !== '');

    if (q.type === 'multiple_choice' || q.type === 'dropdown') {
      const counts = {};
      values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      const labels = Object.keys(counts);
      const d = Object.values(counts);
      new Chart(canvas, { type: 'doughnut', data: { labels, datasets: [{ data: d, backgroundColor: generateColors(labels.length), borderWidth: 0 }] }, options: { responsive: true, plugins: { legend: { position: 'bottom' } } } });
      if (statsEl) statsEl.innerHTML = labels.map((l, i) => `<div class="stat-row"><span>${escapeHtml(l)}</span><span class="stat-count">${d[i]} (${((d[i] / values.length) * 100).toFixed(0)}%)</span></div>`).join('');
    } else if (q.type === 'checkboxes') {
      const counts = {};
      values.forEach(arr => { if (Array.isArray(arr)) arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; }); });
      new Chart(canvas, { type: 'bar', data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: themeColor + '80', borderColor: themeColor, borderWidth: 1, borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
    } else if (q.type === 'linear_scale') {
      const min = q.scaleMin || 1, max = q.scaleMax || 5;
      const labels = [], d = [];
      for (let i = min; i <= max; i++) { labels.push(String(i)); d.push(values.filter(v => v == i).length); }
      new Chart(canvas, { type: 'bar', data: { labels, datasets: [{ data: d, backgroundColor: themeColor + '80', borderColor: themeColor, borderWidth: 1, borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } } });
      if (statsEl) statsEl.innerHTML = `<div class="stat-row"><span>Average</span><span class="stat-count">${values.length ? (values.reduce((a, b) => a + Number(b), 0) / values.length).toFixed(1) : 'N/A'}</span></div>`;
    } else {
      canvas.style.display = 'none';
      if (statsEl) { const recent = values.slice(0, 10); statsEl.innerHTML = `<div class="text-answers-list">${recent.map(v => `<div class="text-answer">${escapeHtml(typeof v === 'string' ? v : JSON.stringify(v))}</div>`).join('')}${values.length > 10 ? `<div class="text-answer-more">+${values.length - 10} more</div>` : ''}</div>`; }
    }
  });
}

function formatTTL(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (days > 0) return `${days}d ${rem}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${Math.floor(diff / 60000)}m remaining`;
}
