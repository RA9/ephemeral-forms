import { Chart, registerables } from 'chart.js';
import { createIcons, ArrowLeft, BarChart2, List, Settings, Download, Trash2, Calendar, Clock, CheckCircle, Edit2, Share2, FileText } from 'lucide';
import { getForm } from '../storage/formStore.js';
import { getResponses, deleteAllResponses, deleteResponse } from '../storage/responseStore.js';
import { getQuestionType } from '../builder/questionTypes.js';
import { showToast, showConfirm, formatDate, escapeHtml, escapeAttr, truncate, formatAnswer, generateColors } from '../utils.js';
import { navigateTo } from '../router.js';

Chart.register(...registerables);

export async function renderFormAnalytics(container, formId) {
  const form = await getForm(formId);
  if (!form) {
    showToast('Form not found', 'error');
    navigateTo('/');
    return;
  }

  const responses = await getResponses(formId);
  const themeColor = form.settings?.themeColor || '#6c5ce7';
  let activeTab = 'summary';

  const render = () => {
    container.innerHTML = `
      <div class="page-container fade-in">
        <div class="page-title-row">
          <div>
            <button class="btn btn-ghost btn-sm" id="back-btn" style="margin-bottom: var(--space-2)">
              <i data-lucide="arrow-left" style="margin-right: 8px;"></i> Back
            </button>
            <h1 class="page-title">${escapeHtml(form.title)}</h1>
            <p class="page-subtitle">${responses.length} response${responses.length !== 1 ? 's' : ''}</p>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <button class="btn btn-secondary btn-sm" id="edit-form-btn"><i data-lucide="edit-2" style="margin-right: 8px;"></i> Edit</button>
            <button class="btn btn-secondary btn-sm" id="share-form-btn"><i data-lucide="share-2" style="margin-right: 8px;"></i> Share</button>
            <button class="btn btn-secondary btn-sm" id="export-csv-btn"><i data-lucide="download" style="margin-right: 8px;"></i> CSV</button>
            <button class="btn btn-secondary btn-sm" id="export-json-btn"><i data-lucide="download" style="margin-right: 8px;"></i> JSON</button>
            ${responses.length > 0 ? `<button class="btn btn-danger btn-sm" id="clear-responses-btn"><i data-lucide="trash-2" style="margin-right: 8px;"></i> Clear</button>` : ''}
          </div>
        </div>

        <div class="tabs" id="analytics-tabs">
          <button class="tab ${activeTab === 'summary' ? 'active' : ''}" data-tab="summary">Summary</button>
          <button class="tab ${activeTab === 'responses' ? 'active' : ''}" data-tab="responses">Responses</button>
        </div>

        <div class="analytics-content" id="analytics-content">
          ${activeTab === 'summary' ? renderSummary() : renderResponsesTable()}
        </div>
      </div>
    `;

    bindEvents();
    
    if (activeTab === 'summary') {
      renderCharts();
    }

    createIcons({
      icons: {
        ArrowLeft, BarChart2, List, Settings, Download, Trash2, Calendar, Clock, CheckCircle, Edit2, Share2, FileText
      }
    });
  };

  const renderSummary = () => {
    if (responses.length === 0) {
      return `
        <div class="empty-state" style="margin-top: var(--space-8)">
          <div class="empty-state-icon"><i data-lucide="bar-chart-2" style="width: 48px; height: 48px;"></i></div>
          <div class="empty-state-title">No responses yet</div>
          <div class="empty-state-text">Share your form to start collecting responses.</div>
          <button class="btn btn-primary" id="share-empty"><i data-lucide="share-2" style="margin-right: 8px;"></i> Copy Form Link</button>
        </div>
      `;
    }

    return `
      <div class="analytics-summary">
        ${(form.questions || []).filter(q => q.type !== 'section_header').map(q => `
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

  const renderResponsesTable = () => {
    if (responses.length === 0) {
      return `<div class="empty-state" style="margin-top:var(--space-8)"><div class="empty-state-icon">📋</div><div class="empty-state-title">No responses</div></div>`;
    }

    const questions = (form.questions || []).filter(q => q.type !== 'section_header');

    return `
      <div class="responses-table-wrapper">
        <table class="responses-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Submitted</th>
              ${questions.map(q => `<th title="${escapeAttr(q.label)}">${truncate(q.label || 'Untitled', 20)}</th>`).join('')}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${responses.map((r, i) => `
              <tr>
                <td>${responses.length - i}</td>
                <td><span class="chip">${formatDate(r.submittedAt)}</span></td>
                ${questions.map(q => {
                  const val = r.answers?.[q.id];
                  return `<td>${formatAnswer(val)}</td>`;
                }).join('')}
                <td>
                  <button class="btn-icon btn-sm" data-delete-response="${r.id}" title="Delete">🗑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderCharts = () => {
    const questions = (form.questions || []).filter(q => q.type !== 'section_header');

    questions.forEach(q => {
      const canvas = container.querySelector(`#chart-${q.id}`);
      const statsEl = container.querySelector(`#stats-${q.id}`);
      if (!canvas) return;

      const values = responses.map(r => r.answers?.[q.id]).filter(v => v !== undefined && v !== null && v !== '');

      if (q.type === 'multiple_choice' || q.type === 'dropdown') {
        const counts = {};
        values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        new Chart(canvas, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data,
              backgroundColor: generateColors(labels.length),
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
          },
        });

        if (statsEl) {
          statsEl.innerHTML = labels.map((l, i) => 
            `<div class="stat-row"><span>${escapeHtml(l)}</span><span class="stat-count">${data[i]} (${((data[i] / values.length) * 100).toFixed(0)}%)</span></div>`
          ).join('');
        }
      } else if (q.type === 'checkboxes') {
        const counts = {};
        values.forEach(arr => {
          if (Array.isArray(arr)) arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        });
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Count',
              data,
              backgroundColor: themeColor + '80',
              borderColor: themeColor,
              borderWidth: 1,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });
      } else if (q.type === 'linear_scale') {
        const min = q.scaleMin || 1;
        const max = q.scaleMax || 5;
        const labels = [];
        const data = [];
        for (let i = min; i <= max; i++) {
          labels.push(String(i));
          data.push(values.filter(v => v == i).length);
        }
        const avg = values.length > 0 ? (values.reduce((a, b) => a + Number(b), 0) / values.length).toFixed(1) : 'N/A';

        new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Responses',
              data,
              backgroundColor: themeColor + '80',
              borderColor: themeColor,
              borderWidth: 1,
              borderRadius: 6,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });

        if (statsEl) {
          statsEl.innerHTML = `<div class="stat-row"><span>Average</span><span class="stat-count">${avg}</span></div>
            <div class="stat-row"><span>Responses</span><span class="stat-count">${values.length}</span></div>`;
        }
      } else {
        // Text-based: show recent answers
        canvas.style.display = 'none';
        if (statsEl) {
          const recentValues = values.slice(0, 10);
          statsEl.innerHTML = `<div class="text-answers-list">
            ${recentValues.map(v => `<div class="text-answer">${escapeHtml(typeof v === 'string' ? v : JSON.stringify(v))}</div>`).join('')}
            ${values.length > 10 ? `<div class="text-answer-more">+${values.length - 10} more</div>` : ''}
          </div>` || '<p style="color:var(--text-tertiary)">No responses</p>';
        }
      }
    });
  };

  const bindEvents = () => {
    container.querySelector('#back-btn')?.addEventListener('click', () => navigateTo('/'));
    container.querySelector('#edit-form-btn')?.addEventListener('click', () => navigateTo(`/build/${formId}`));
    
    container.querySelector('#share-form-btn')?.addEventListener('click', async () => {
      const url = `${window.location.origin}${window.location.pathname}#/form/${formId}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!', 'success');
      } catch {
        showToast(url, 'info', 8000);
      }
    });
    container.querySelector('#share-empty')?.addEventListener('click', async () => {
      const url = `${window.location.origin}${window.location.pathname}#/form/${formId}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied!', 'success');
      } catch {
        showToast(url, 'info', 8000);
      }
    });

    // Export
    container.querySelector('#export-csv-btn')?.addEventListener('click', () => exportCSV(form, responses));
    container.querySelector('#export-json-btn')?.addEventListener('click', () => exportJSON(form, responses));

    // Clear responses
    container.querySelector('#clear-responses-btn')?.addEventListener('click', async () => {
      const confirmed = await showConfirm('Clear All Responses', `Delete all ${responses.length} responses? This cannot be undone.`);
      if (confirmed) {
        await deleteAllResponses(formId);
        showToast('All responses cleared', 'success');
        const newResponses = await getResponses(formId);
        responses.length = 0;
        responses.push(...newResponses);
        render();
      }
    });

    // Tabs
    container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        render();
      });
    });

    // Delete individual responses
    container.querySelectorAll('[data-delete-response]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await deleteResponse(btn.dataset.deleteResponse);
        const idx = responses.findIndex(r => r.id === btn.dataset.deleteResponse);
        if (idx !== -1) responses.splice(idx, 1);
        render();
        showToast('Response deleted', 'success');
      });
    });
  };

  render();
}

function exportCSV(form, responses) {
  const questions = (form.questions || []).filter(q => q.type !== 'section_header');
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
  downloadFile(csv, `${form.title || 'form'}_responses.csv`, 'text/csv');
  showToast('CSV exported!', 'success');
}

function exportJSON(form, responses) {
  const data = {
    form: { id: form.id, title: form.title },
    responses: responses.map(r => ({
      submittedAt: r.submittedAt,
      answers: r.answers,
    })),
  };
  downloadFile(JSON.stringify(data, null, 2), `${form.title || 'form'}_responses.json`, 'application/json');
  showToast('JSON exported!', 'success');
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
