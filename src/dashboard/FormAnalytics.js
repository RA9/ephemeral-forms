import { Chart, registerables } from 'chart.js';
import { createIcons, ArrowLeft, BarChart2, List, Settings, Download, Trash2, Calendar, Clock, CheckCircle, Edit2, Share2, FileText, TrendingUp, Users, Hash, Percent } from 'lucide';
import { getForm } from '../storage/formStore.js';
import { getResponses, deleteAllResponses, deleteResponse } from '../storage/responseStore.js';
import { getQuestionType } from '../builder/questionTypes.js';
import { showToast, showConfirm, formatDate, escapeHtml, escapeAttr, truncate, formatAnswer, generateColors } from '../utils.js';
import { navigateTo } from '../router.js';
import { showShareModal } from '../sharing/ShareModal.js';
import { getRemoteResponses } from '../firebase/shareService.js';
import { getShareMeta } from '../storage/shareStore.js';
import { setMeta } from '../utils/meta.js';

Chart.register(...registerables);

// ============================================================
// Analytics Helpers
// ============================================================

function getCSSColor(varName, fallback) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val || fallback;
}

function computeOverviewStats(responses, questions) {
  const total = responses.length;
  if (total === 0) return { total: 0, today: 0, avgPerDay: 0, completionRate: 0, peakDay: 'N/A', peakCount: 0 };

  const now = new Date();
  const todayStr = now.toDateString();
  const today = responses.filter(r => new Date(r.submittedAt).toDateString() === todayStr).length;

  // Avg per day over last 14 days
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const recentResponses = responses.filter(r => new Date(r.submittedAt) >= twoWeeksAgo);
  const avgPerDay = recentResponses.length > 0 ? (recentResponses.length / 14).toFixed(1) : '0';

  // Completion rate: % of responses that answered all required questions
  const requiredQs = questions.filter(q => q.required && q.type !== 'section_header');
  let completionRate = 100;
  if (requiredQs.length > 0 && total > 0) {
    const completeCount = responses.filter(r => {
      return requiredQs.every(q => {
        const val = r.answers?.[q.id];
        return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
      });
    }).length;
    completionRate = Math.round((completeCount / total) * 100);
  }

  // Peak day
  const dayCounts = {};
  responses.forEach(r => {
    const ds = new Date(r.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dayCounts[ds] = (dayCounts[ds] || 0) + 1;
  });
  let peakDay = 'N/A', peakCount = 0;
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > peakCount) { peakDay = day; peakCount = count; }
  }

  return { total, today, avgPerDay, completionRate, peakDay, peakCount };
}

function computeTimeline(responses) {
  // Last 14 days, daily counts
  const now = new Date();
  const labels = [];
  const data = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    labels.push(label);
    data.push(responses.filter(r => new Date(r.submittedAt).toDateString() === ds).length);
  }
  return { labels, data };
}

function computeQuestionStats(q, responses) {
  const values = responses.map(r => r.answers?.[q.id]).filter(v => v !== undefined && v !== null && v !== '');
  const answered = values.length;
  const responseRate = responses.length > 0 ? Math.round((answered / responses.length) * 100) : 0;

  const stats = { answered, responseRate, total: responses.length };

  if (q.type === 'linear_scale') {
    const nums = values.map(Number).filter(n => !isNaN(n));
    if (nums.length > 0) {
      const sorted = [...nums].sort((a, b) => a - b);
      stats.avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
      stats.median = sorted[Math.floor(sorted.length / 2)];
      stats.min = sorted[0];
      stats.max = sorted[sorted.length - 1];
      stats.stdDev = Math.sqrt(nums.reduce((sum, n) => sum + Math.pow(n - stats.avg, 2), 0) / nums.length).toFixed(1);
    }
  }

  if (q.type === 'short_text' || q.type === 'long_text') {
    // Top words (simple frequency, skip common words)
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'and', 'but', 'or', 'not', 'no', 'so', 'if', 'then', 'than', 'too', 'very', 'just', 'about', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'them', 'this', 'that', 'these', 'those']);
    const wordCounts = {};
    values.forEach(v => {
      if (typeof v !== 'string') return;
      v.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).forEach(w => {
        if (w.length > 2 && !stopWords.has(w)) wordCounts[w] = (wordCounts[w] || 0) + 1;
      });
    });
    stats.topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    // Avg word count
    const wordCts = values.filter(v => typeof v === 'string').map(v => v.split(/\s+/).length);
    stats.avgWordCount = wordCts.length > 0 ? Math.round(wordCts.reduce((a, b) => a + b, 0) / wordCts.length) : 0;
  }

  return stats;
}

// ============================================================
// Main
// ============================================================

export async function renderFormAnalytics(container, formId) {
  const form = await getForm(formId);
  if (!form) {
    showToast('Form not found', 'error');
    navigateTo('/dashboard');
    return;
  }
  setMeta(`Analytics — ${form.title || 'Untitled'}`, `Response analytics for "${form.title || 'Untitled'}" form.`);

  const localResponses = (await getResponses(formId)).map(r => ({ ...r, source: 'local' }));

  let remoteResponses = [];
  try {
    const meta = await getShareMeta(formId);
    if (meta?.shared) {
      remoteResponses = await getRemoteResponses(formId, meta.formKey || null);
    }
  } catch { /* Remote fetch failed */ }

  const seenIds = new Set();
  const responses = [];
  for (const r of [...remoteResponses, ...localResponses]) {
    if (!seenIds.has(r.id)) { seenIds.add(r.id); responses.push(r); }
  }
  responses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  const themeColor = form.settings?.themeColor || '#6c5ce7';
  const questions = (form.questions || []).filter(q => q.type !== 'section_header');
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
          <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
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

    if (activeTab === 'summary' && responses.length > 0) {
      renderTimelineChart();
      renderQuestionCharts();
    }

    createIcons({
      icons: { ArrowLeft, BarChart2, List, Settings, Download, Trash2, Calendar, Clock, CheckCircle, Edit2, Share2, FileText, TrendingUp, Users, Hash, Percent }
    });
  };

  // ============================================================
  // Summary Tab
  // ============================================================

  const renderSummary = () => {
    if (responses.length === 0) {
      return `
        <div class="empty-state" style="margin-top: var(--space-8)">
          <div class="empty-state-icon"><i data-lucide="bar-chart-2" style="width: 48px; height: 48px;"></i></div>
          <div class="empty-state-title">No responses yet</div>
          <div class="empty-state-text">Share your form to start collecting responses.</div>
          <button class="btn btn-primary" id="share-empty"><i data-lucide="share-2" style="margin-right: 8px;"></i> Share Form</button>
        </div>
      `;
    }

    const stats = computeOverviewStats(responses, questions);

    return `
      <!-- Overview Stats -->
      <div class="ana-overview">
        <div class="ana-stat-card">
          <div class="ana-stat-icon" style="background:${themeColor}15;color:${themeColor};">
            <i data-lucide="users" style="width:20px;height:20px;"></i>
          </div>
          <div class="ana-stat-value">${stats.total}</div>
          <div class="ana-stat-label">Total Responses</div>
        </div>
        <div class="ana-stat-card">
          <div class="ana-stat-icon" style="background:rgba(0,184,148,0.1);color:var(--accent-500);">
            <i data-lucide="trending-up" style="width:20px;height:20px;"></i>
          </div>
          <div class="ana-stat-value">${stats.today}</div>
          <div class="ana-stat-label">Today</div>
        </div>
        <div class="ana-stat-card">
          <div class="ana-stat-icon" style="background:rgba(116,185,255,0.1);color:var(--info);">
            <i data-lucide="hash" style="width:20px;height:20px;"></i>
          </div>
          <div class="ana-stat-value">${stats.avgPerDay}</div>
          <div class="ana-stat-label">Avg / Day (14d)</div>
        </div>
        <div class="ana-stat-card">
          <div class="ana-stat-icon" style="background:rgba(253,203,110,0.15);color:var(--warning);">
            <i data-lucide="percent" style="width:20px;height:20px;"></i>
          </div>
          <div class="ana-stat-value">${stats.completionRate}%</div>
          <div class="ana-stat-label">Completion Rate</div>
        </div>
      </div>

      <!-- Response Timeline -->
      <div class="ana-timeline card">
        <div class="ana-timeline-header">
          <h3 class="ana-section-title">Response Timeline</h3>
          <span class="ana-section-subtitle">Last 14 days</span>
        </div>
        <div class="ana-timeline-chart">
          <canvas id="timeline-chart" height="180"></canvas>
        </div>
        <div class="ana-timeline-footer">
          <span>Peak: <strong>${escapeHtml(stats.peakDay)}</strong> (${stats.peakCount} responses)</span>
        </div>
      </div>

      <!-- Per-Question Analytics -->
      <h3 class="ana-section-title" style="margin-top:var(--space-8);margin-bottom:var(--space-4);">Question Breakdown</h3>
      <div class="analytics-summary">
        ${questions.map(q => renderQuestionCard(q)).join('')}
      </div>
    `;
  };

  const renderQuestionCard = (q) => {
    const qs = computeQuestionStats(q, responses);
    const qt = getQuestionType(q.type);

    return `
      <div class="analytics-question-card card" data-qid="${q.id}">
        <div class="ana-q-header">
          <div>
            <h4 class="analytics-question-title">${escapeHtml(q.label || 'Untitled Question')}</h4>
            <span class="badge badge-primary">${qt?.label || q.type}</span>
          </div>
          <div class="ana-q-meta">
            <span class="ana-q-pill">${qs.answered}/${qs.total} answered</span>
            <span class="ana-q-pill ana-q-pill-rate">${qs.responseRate}% response rate</span>
          </div>
        </div>

        <div class="ana-q-body">
          <div class="analytics-chart-container">
            <canvas id="chart-${q.id}" height="200"></canvas>
          </div>

          <div class="analytics-question-stats" id="stats-${q.id}">
            ${q.type === 'linear_scale' && qs.avg ? `
              <div class="ana-scale-stats">
                <div class="ana-scale-stat"><span class="ana-scale-num">${qs.avg}</span><span class="ana-scale-lbl">Average</span></div>
                <div class="ana-scale-stat"><span class="ana-scale-num">${qs.median}</span><span class="ana-scale-lbl">Median</span></div>
                <div class="ana-scale-stat"><span class="ana-scale-num">${qs.stdDev}</span><span class="ana-scale-lbl">Std Dev</span></div>
                <div class="ana-scale-stat"><span class="ana-scale-num">${qs.min}–${qs.max}</span><span class="ana-scale-lbl">Range</span></div>
              </div>
            ` : ''}
          </div>

          ${(q.type === 'short_text' || q.type === 'long_text') && qs.topWords?.length > 0 ? `
            <div class="ana-text-insights">
              <div class="ana-text-meta">
                <span>Avg length: <strong>${qs.avgWordCount} words</strong></span>
              </div>
              <div class="ana-word-cloud">
                ${qs.topWords.map(([word, count]) => `
                  <span class="ana-word-tag" style="--freq: ${count};">${escapeHtml(word)} <small>${count}</small></span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // ============================================================
  // Chart Rendering
  // ============================================================

  const renderTimelineChart = () => {
    const canvas = container.querySelector('#timeline-chart');
    if (!canvas) return;

    const { labels, data } = computeTimeline(responses);

    const surfaceColor = getCSSColor('--surface', '#fff');
    const textPrimary = getCSSColor('--text-primary', '#1a1e2e');
    const textSecondary = getCSSColor('--text-secondary', '#5c6478');
    const textTertiary = getCSSColor('--text-tertiary', '#a0a8be');
    const borderLight = getCSSColor('--border-light', '#e2e6ef');

    new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor: themeColor,
          backgroundColor: themeColor + '18',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: themeColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: surfaceColor,
            titleColor: textPrimary,
            bodyColor: textSecondary,
            borderColor: borderLight,
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} response${ctx.parsed.y !== 1 ? 's' : ''}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: textTertiary, maxRotation: 45 },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 }, color: textTertiary },
            grid: { color: borderLight },
          },
        },
      },
    });
  };

  const renderQuestionCharts = () => {
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
            datasets: [{ data, backgroundColor: generateColors(labels.length), borderWidth: 0 }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            cutout: '60%',
            plugins: {
              legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' } },
              tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} (${((ctx.parsed / values.length) * 100).toFixed(0)}%)` } },
            },
          },
        });

        if (statsEl) {
          const existing = statsEl.innerHTML;
          statsEl.innerHTML = existing + labels.map((l, i) =>
            `<div class="stat-row"><span>${escapeHtml(l)}</span><span class="stat-count">${data[i]} (${((data[i] / values.length) * 100).toFixed(0)}%)</span></div>`
          ).join('');
        }
      } else if (q.type === 'checkboxes') {
        const counts = {};
        values.forEach(arr => { if (Array.isArray(arr)) arr.forEach(v => { counts[v] = (counts[v] || 0) + 1; }); });
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Count', data, backgroundColor: themeColor + '80', borderColor: themeColor, borderWidth: 1, borderRadius: 6 }],
          },
          options: {
            responsive: true,
            indexAxis: labels.length > 5 ? 'y' : 'x',
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

        new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [{ label: 'Responses', data, backgroundColor: themeColor + '80', borderColor: themeColor, borderWidth: 1, borderRadius: 6 }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });
      } else {
        // Text-based: show recent answers
        canvas.style.display = 'none';
        if (statsEl) {
          const recentValues = values.slice(0, 10);
          statsEl.innerHTML += `<div class="text-answers-list">
            ${recentValues.map(v => `<div class="text-answer">${escapeHtml(typeof v === 'string' ? v : JSON.stringify(v))}</div>`).join('')}
            ${values.length > 10 ? `<div class="text-answer-more">+${values.length - 10} more</div>` : ''}
          </div>`;
        }
      }
    });
  };

  // ============================================================
  // Responses Table
  // ============================================================

  const renderResponsesTable = () => {
    if (responses.length === 0) {
      return `<div class="empty-state" style="margin-top:var(--space-8)"><div class="empty-state-icon">📋</div><div class="empty-state-title">No responses</div></div>`;
    }

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
                ${questions.map(q => `<td>${formatAnswer(r.answers?.[q.id])}</td>`).join('')}
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

  // ============================================================
  // Events
  // ============================================================

  const bindEvents = () => {
    container.querySelector('#back-btn')?.addEventListener('click', () => navigateTo('/dashboard'));
    container.querySelector('#edit-form-btn')?.addEventListener('click', () => navigateTo(`/build/${formId}`));

    container.querySelector('#share-form-btn')?.addEventListener('click', async () => { await showShareModal(form); });
    container.querySelector('#share-empty')?.addEventListener('click', async () => { await showShareModal(form); });

    container.querySelector('#export-csv-btn')?.addEventListener('click', () => exportCSV(form, responses));
    container.querySelector('#export-json-btn')?.addEventListener('click', () => exportJSON(form, responses));

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

    container.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.tab; render(); });
    });

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

// ============================================================
// Export helpers
// ============================================================

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
    responses: responses.map(r => ({ submittedAt: r.submittedAt, answers: r.answers })),
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
