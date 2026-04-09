import { Chart, registerables } from 'chart.js';
import { createIcons, FileText, BarChart3, TrendingUp, Plus, Search, Edit2, Share2, Copy, Trash2, BookOpen } from 'lucide';
import { listForms, deleteForm, duplicateForm, getForm } from '../storage/formStore.js';
import { getResponseCount, getResponseStats } from '../storage/responseStore.js';
import { showToast, showConfirm, formatDate, formatNumber, escapeHtml, escapeAttr } from '../utils.js';
import { navigateTo } from '../router.js';
import { showShareModal } from '../sharing/ShareModal.js';

Chart.register(...registerables);

export async function renderDashboard(container) {
  const forms = await listForms();
  
  // Get stats for each form
  const formStats = await Promise.all(
    forms.map(async (form) => {
      const stats = await getResponseStats(form.id);
      return { ...form, stats };
    })
  );

  const totalForms = forms.length;
  const totalResponses = formStats.reduce((sum, f) => sum + (f.stats?.total || 0), 0);
  const todayResponses = formStats.reduce((sum, f) => sum + (f.stats?.today || 0), 0);

  container.innerHTML = `
    <div class="page-container fade-in">
      <div class="page-title-row">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Manage your forms and track responses</p>
        </div>
        <button class="btn btn-primary" id="create-form-btn">
          <i data-lucide="plus" style="width: 18px; height: 18px; margin-right: 8px;"></i> Create Form
        </button>
      </div>

      <div class="dashboard-tabs">
        <button class="dashboard-tab active" data-tab="forms">Forms</button>
        <button class="dashboard-tab" data-tab="docs" id="tab-docs">
          <i data-lucide="book-open" style="width: 14px; height: 14px;"></i> Docs
        </button>
      </div>

      <div class="dashboard-stats grid grid-3">
        <div class="stat-card card">
          <div class="stat-icon" style="background: linear-gradient(135deg, var(--primary-400), var(--primary-600))">
            <i data-lucide="file-text"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${formatNumber(totalForms)}</div>
            <div class="stat-label">Total Forms</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon" style="background: linear-gradient(135deg, var(--accent-400), var(--accent-600))">
            <i data-lucide="bar-chart-3"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${formatNumber(totalResponses)}</div>
            <div class="stat-label">Total Responses</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #74b9ff, #0984e3)">
            <i data-lucide="trending-up"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">${formatNumber(todayResponses)}</div>
            <div class="stat-label">Today's Responses</div>
          </div>
        </div>
      </div>

      <div class="dashboard-section">
        <div class="section-header-row">
          <h3>Your Forms</h3>
          <div class="search-bar">
            <div style="position: relative;">
              <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: var(--text-tertiary);"></i>
              <input type="text" class="input" id="form-search" placeholder="Search forms..." style="max-width: 280px; padding-left: 36px;" />
            </div>
          </div>
        </div>

        ${forms.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="file-text" style="width: 48px; height: 48px;"></i></div>
            <div class="empty-state-title">No forms yet</div>
            <div class="empty-state-text">Create your first form to get started. No account needed — everything stays in your browser.</div>
            <button class="btn btn-primary" id="create-form-empty"><i data-lucide="plus" style="width: 18px; height: 18px; margin-right: 8px;"></i> Create Your First Form</button>
          </div>
        ` : `
          <div class="form-grid grid grid-auto-fill" id="form-list">
            ${formStats.map(f => renderFormCard(f)).join('')}
          </div>
        `}
      </div>
    </div>
  `;

  createIcons({
    icons: {
      FileText,
      BarChart3,
      TrendingUp,
      Plus,
      Search,
      Edit2,
      Share2,
      Copy,
      Trash2,
      BookOpen
    }
  });

  renderSparklines(container, formStats);

  // Bind events
  container.querySelector('#create-form-btn')?.addEventListener('click', () => navigateTo('/build'));
  container.querySelector('#create-form-empty')?.addEventListener('click', () => navigateTo('/build'));

  // Docs tab
  container.querySelector('#tab-docs')?.addEventListener('click', () => navigateTo('/dashboard/docs'));

  // Search
  container.querySelector('#form-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    container.querySelectorAll('.form-card').forEach(card => {
      const title = card.dataset.title?.toLowerCase() || '';
      card.style.display = title.includes(query) ? '' : 'none';
    });
  });

  // Form card actions
  container.querySelectorAll('[data-card-action]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.cardAction;
      const formId = btn.dataset.formId;

      if (action === 'edit') {
        navigateTo(`/build/${formId}`);
      } else if (action === 'view') {
        navigateTo(`/form/${formId}`);
      } else if (action === 'responses') {
        navigateTo(`/form/${formId}/responses`);
      } else if (action === 'duplicate') {
        await duplicateForm(formId);
        showToast('Form duplicated!', 'success');
        renderDashboard(container);
      } else if (action === 'share') {
        const fullForm = await getForm(formId);
        if (fullForm) {
          await showShareModal(fullForm);
        } else {
          showToast('Form not found', 'error');
        }
      } else if (action === 'delete') {
        const confirmed = await showConfirm('Delete Form', 'This will permanently delete this form and all its responses. This cannot be undone.');
        if (confirmed) {
          await deleteForm(formId);
          showToast('Form deleted', 'success');
          renderDashboard(container);
        }
      }
    });
  });

  // Click on form card to open responses
  container.querySelectorAll('.form-card').forEach(card => {
    card.addEventListener('click', () => {
      navigateTo(`/form/${card.dataset.formId}/responses`);
    });
  });
}

function renderSparklines(container, formStats) {
  formStats.forEach(form => {
    const canvas = container.querySelector(`#sparkline-${form.id}`);
    if (!canvas) return;

    const daily = form.stats?.dailyCounts || [0, 0, 0, 0, 0, 0, 0];
    const themeColor = form.settings?.themeColor || '#6c5ce7';
    const hasData = daily.some(v => v > 0);

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: daily.map(() => ''),
        datasets: [{
          data: daily,
          borderColor: hasData ? themeColor : 'var(--border-default)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: true,
          backgroundColor: hasData ? themeColor + '18' : 'transparent',
        }],
      },
      options: {
        responsive: true,
        animation: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true },
        },
        elements: { line: { borderCapStyle: 'round' } },
      },
    });
  });
}

function renderFormCard(form) {
  const stats = form.stats || {};
  const questionCount = (form.questions || []).length;
  const themeColor = form.settings?.themeColor || '#6c5ce7';

  return `
    <div class="form-card card" data-form-id="${form.id}" data-title="${escapeAttr(form.title)}" style="cursor:pointer;">
      <div class="form-card-accent" style="background: ${themeColor}"></div>
      <div class="form-card-body">
        <h4 class="form-card-title">${escapeHtml(form.title || 'Untitled Form')}</h4>
        <p class="form-card-desc">${escapeHtml(form.description || 'No description')}</p>
        
        <div class="form-card-meta">
          <span class="chip">${questionCount} question${questionCount !== 1 ? 's' : ''}</span>
          <span class="chip">${stats.total || 0} response${stats.total !== 1 ? 's' : ''}</span>
        </div>

        <div class="form-card-sparkline">
          <canvas id="sparkline-${form.id}" height="48"></canvas>
        </div>

        <div class="form-card-footer">
          <span class="form-card-date">${formatDate(form.updatedAt)}</span>
          <div class="form-card-actions">
            <button class="btn-icon btn-sm" data-card-action="edit" data-form-id="${form.id}" title="Edit"><i data-lucide="edit-2"></i></button>
            <button class="btn-icon btn-sm" data-card-action="share" data-form-id="${form.id}" title="Share"><i data-lucide="share-2"></i></button>
            <button class="btn-icon btn-sm" data-card-action="duplicate" data-form-id="${form.id}" title="Duplicate"><i data-lucide="copy"></i></button>
            <button class="btn-icon btn-sm" data-card-action="delete" data-form-id="${form.id}" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      </div>
    </div>
  `;
}

