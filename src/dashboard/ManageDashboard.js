// ManageDashboard — cross-device creator view via creatorSecret magic link
// Route: #/manage/<creatorSecret>
import { Chart, registerables } from 'chart.js';
import { createIcons, ArrowLeft, BarChart2, List, Download, Share2, CheckCircle, Copy, ExternalLink } from 'lucide';
import { getFormByCreatorSecret } from '../firebase/shareService.js';
import { saveShareMeta } from '../storage/shareStore.js';
import { getQuestionType } from '../builder/questionTypes.js';
import { showToast, formatDate, escapeHtml, escapeAttr, truncate, formatAnswer, generateColors } from '../utils.js';
import { navigateTo } from '../router.js';

Chart.register(...registerables);

export async function renderManageDashboard(container, creatorSecret) {
  // Show loading
  container.innerHTML = `
    <div class="page-container fade-in" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
      <div style="text-align:center;">
        <div class="spinner" style="width:32px;height:32px;border:3px solid var(--border-light);border-top-color:var(--primary-500);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto var(--space-4);"></div>
        <p style="color:var(--text-secondary);font-size:var(--font-sm);">Loading form data...</p>
      </div>
    </div>
  `;

  let data;
  try {
    data = await getFormByCreatorSecret(creatorSecret);
  } catch (err) {
    container.innerHTML = `
      <div class="page-container fade-in" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
        <div style="text-align:center;max-width:400px;">
          <h2 style="margin-bottom:var(--space-3);">Connection Error</h2>
          <p style="color:var(--text-secondary);font-size:var(--font-sm);">Could not reach the server. Please check your internet connection and try again.</p>
          <button class="btn btn-primary" style="margin-top:var(--space-6);" onclick="location.reload()">Retry</button>
        </div>
      </div>
    `;
    return;
  }

  if (!data) {
    container.innerHTML = `
      <div class="page-container fade-in" style="display:flex;align-items:center;justify-content:center;min-height:60vh;">
        <div style="text-align:center;max-width:400px;">
          <h2 style="margin-bottom:var(--space-3);">Not Found</h2>
          <p style="color:var(--text-secondary);font-size:var(--font-sm);">This creator link is invalid or the form has been removed.</p>
          <a href="#/" class="btn btn-primary" style="margin-top:var(--space-6);">Go to Dashboard</a>
        </div>
      </div>
    `;
    return;
  }

  const { form, formId, responses, activeLink } = data;

  // Store share meta locally so this device can access responses from the regular dashboard too
  await saveShareMeta(formId, {
    creatorSecret,
    token: activeLink?.token || '',
    expiresAt: activeLink?.expiresAt || '',
    sharedAt: new Date().toISOString(),
  });

  const themeColor = form.settings?.themeColor || '#6c5ce7';
  const questions = (form.questions || []).filter(q => q.type !== 'section_header');
  let activeTab = 'summary';

  const shareUrl = activeLink ? `${window.location.origin}${window.location.pathname}#/share/${activeLink.token}` : null;
  const manageUrl = `${window.location.origin}${window.location.pathname}#/manage/${creatorSecret}`;

  const render = () => {
    const ttlText = activeLink ? formatTTL(activeLink.expiresAt) : 'No active link';

    container.innerHTML = `
      <div class="page-container fade-in">
        <div class="page-title-row">
          <div>
            <h1 class="page-title">${escapeHtml(form.title)}</h1>
            <p class="page-subtitle">${responses.length} response${responses.length !== 1 ? 's' : ''} collected remotely</p>
          </div>
          <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="copy-manage-link">
              <i data-lucide="copy" style="margin-right:8px;"></i> Copy Creator Link
            </button>
            <button class="btn btn-secondary btn-sm" id="export-csv-btn">
              <i data-lucide="download" style="margin-right:8px;"></i> CSV
            </button>
          </div>
        </div>

        ${activeLink ? `
          <div class="manage-link-bar card" style="padding:var(--space-4);margin-bottom:var(--space-6);display:flex;align-items:center;gap:var(--space-4);flex-wrap:wrap;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-1);">Respondent Link</div>
              <div style="font-size:var(--font-xs);color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(shareUrl)}</div>
            </div>
            <span style="font-size:var(--font-xs);color:var(--text-tertiary);background:var(--bg-tertiary);padding:var(--space-1) var(--space-3);border-radius:var(--radius-full);white-space:nowrap;">
              ⏳ ${ttlText}
            </span>
            <button class="btn btn-primary btn-sm" id="copy-share-link">Copy Link</button>
          </div>
        ` : `
          <div class="card" style="padding:var(--space-4);margin-bottom:var(--space-6);text-align:center;">
            <p style="color:var(--text-tertiary);font-size:var(--font-sm);">No active respondent link. Open the form in the builder to generate one.</p>
          </div>
        `}

        <div class="tabs" id="manage-tabs">
          <button class="tab ${activeTab === 'summary' ? 'active' : ''}" data-tab="summary">Summary</button>
          <button class="tab ${activeTab === 'responses' ? 'active' : ''}" data-tab="responses">Responses</button>
        </div>

        <div id="manage-content">
          ${activeTab === 'summary' ? renderSummary() : renderTable()}
        </div>
      </div>
    `;

    createIcons({ icons: { ArrowLeft, BarChart2, List, Download, Share2, CheckCircle, Copy, ExternalLink } });
    bindEvents();
    if (activeTab === 'summary') renderCharts();
  };

  const renderSummary = () => {
    if (responses.length === 0) {
      return `
        <div class="empty-state" style="margin-top:var(--space-8)">
          <div class="empty-state-icon"><i data-lucide="bar-chart-2" style="width:48px;height:48px;"></i></div>
          <div class="empty-state-title">No responses yet</div>
          <div class="empty-state-text">Share the respondent link to start collecting responses.</div>
        </div>
      `;
    }
    return `
      <div class="analytics-summary">
        ${questions.map(q => `
          <div class="analytics-question-card card" data-qid="${q.id}">
            <h4 class="analytics-question-title">${escapeHtml(q.label || 'Untitled Question')}</h4>
            <span class="badge badge-primary">${getQuestionType(q.type)?.label || q.type}</span>
            <div class="analytics-chart-container">
              <canvas id="chart-${q.id}" height="200"></canvas>
            </div>
            <div class="analytics-question-stats" id="stats-${q.id}"></div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const renderTable = () => {
    if (responses.length === 0) {
      return `<div class="empty-state" style="margin-top:var(--space-8)"><div class="empty-state-title">No responses</div></div>`;
    }
    return `
      <div class="responses-table-wrapper">
        <table class="responses-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Submitted</th>
              ${questions.map(q => `<th title="${escapeAttr(q.label)}">${truncate(q.label || 'Untitled', 20)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${responses.map((r, i) => `
              <tr>
                <td>${responses.length - i}</td>
                <td><span class="chip">${formatDate(r.submittedAt)}</span></td>
                ${questions.map(q => `<td>${formatAnswer(r.answers?.[q.id])}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderCharts = () => {
    questions.forEach(q => {
      const canvas = container.querySelector(`#chart-${q.id}`);
      const statsEl = container.querySelector(`#stats-${q.id}`);
      if (!canvas) return;

      const values = responses.map(r => r.answers?.[q.id]).filter(v => v !== undefined && v !== null && v !== '');

      if (q.type === 'multiple_choice' || q.type === 'dropdown') {
        const counts = {};
        values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const labels = Object.keys(counts);
        const chartData = Object.values(counts);

        new Chart(canvas, {
          type: 'doughnut',
          data: { labels, datasets: [{ data: chartData, backgroundColor: generateColors(labels.length), borderWidth: 0 }] },
          options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
        });

        if (statsEl) {
          statsEl.innerHTML = labels.map((l, i) =>
            `<div class="stat-row"><span>${escapeHtml(l)}</span><span class="stat-count">${chartData[i]} (${((chartData[i] / values.length) * 100).toFixed(0)}%)</span></div>`
          ).join('');
        }
      } else if (q.type === 'checkboxes') {
        const counts = {};
        values.forEach(arr => { if (Array.isArray(arr)) arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; }); });
        const labels = Object.keys(counts);
        const chartData = Object.values(counts);

        new Chart(canvas, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Count', data: chartData, backgroundColor: themeColor + '80', borderColor: themeColor, borderWidth: 1, borderRadius: 6 }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
        });
      } else if (q.type === 'linear_scale') {
        const min = q.scaleMin || 1;
        const max = q.scaleMax || 5;
        const labels = [];
        const chartData = [];
        for (let i = min; i <= max; i++) {
          labels.push(String(i));
          chartData.push(values.filter(v => v == i).length);
        }
        const avg = values.length > 0 ? (values.reduce((a, b) => a + Number(b), 0) / values.length).toFixed(1) : 'N/A';

        new Chart(canvas, {
          type: 'bar',
          data: { labels, datasets: [{ label: 'Responses', data: chartData, backgroundColor: themeColor + '80', borderColor: themeColor, borderWidth: 1, borderRadius: 6 }] },
          options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
        });

        if (statsEl) {
          statsEl.innerHTML = `<div class="stat-row"><span>Average</span><span class="stat-count">${avg}</span></div>
            <div class="stat-row"><span>Responses</span><span class="stat-count">${values.length}</span></div>`;
        }
      } else {
        canvas.style.display = 'none';
        if (statsEl) {
          const recent = values.slice(0, 10);
          statsEl.innerHTML = `<div class="text-answers-list">
            ${recent.map(v => `<div class="text-answer">${escapeHtml(typeof v === 'string' ? v : JSON.stringify(v))}</div>`).join('')}
            ${values.length > 10 ? `<div class="text-answer-more">+${values.length - 10} more</div>` : ''}
          </div>`;
        }
      }
    });
  };

  const bindEvents = () => {
    container.querySelector('#copy-share-link')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Respondent link copied!', 'success');
      } catch { showToast(shareUrl, 'info', 8000); }
    });

    container.querySelector('#copy-manage-link')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(manageUrl);
        showToast('Creator link copied! Save this link to access responses from any device.', 'success');
      } catch { showToast(manageUrl, 'info', 8000); }
    });

    container.querySelector('#export-csv-btn')?.addEventListener('click', () => {
      const headers = ['Submitted', ...questions.map(q => q.label || 'Untitled')];
      const rows = responses.map(r => [
        r.submittedAt,
        ...questions.map(q => {
          const val = r.answers?.[q.id];
          if (Array.isArray(val)) return val.join('; ');
          if (typeof val === 'object') return JSON.stringify(val);
          return val ?? '';
        }),
      ]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.title || 'form'}_responses.csv`;
      a.click();
      showToast('CSV exported!', 'success');
    });

    container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        render();
      });
    });
  };

  render();
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
