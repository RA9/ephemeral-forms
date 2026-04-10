// Shared Form Responder — renders a form fetched from Firestore via magic link
import { getSharedForm, listenToSharedForm, submitSharedResponse } from '../firebase/shareService.js';
import { loadRemotePlugins } from '../firebase/creatorService.js';
import { getQuestionType } from '../builder/questionTypes.js';
import { showToast, escapeHtml, shuffleArray } from '../utils.js';
import { createIcons, ChevronLeft, ArrowRight, CheckCircle, Search, AlertTriangle } from 'lucide';
import { runHook } from '../plugins/PluginAPI.js';

export async function renderSharedFormResponder(container, token) {
  // Fetch form from Firestore
  let result;
  try {
    result = await getSharedForm(token);
  } catch (err) {
    renderError(container, 'Connection Error', 'Could not reach the server. Please check your internet connection and try again.');
    return;
  }

  if (result.error) {
    if (result.error === 'expired' || result.error === 'revoked') {
      renderExpired(container);
    } else {
      renderError(container, 'Form Not Found', 'This form may have been deleted or the link is incorrect.');
    }
    return;
  }

  let { form, expiresAt, formId, pluginIds } = result;

  // Load remote custom plugins before rendering
  if (pluginIds && pluginIds.length > 0) {
    try { await loadRemotePlugins(pluginIds); } catch (err) {
      console.warn('Failed to load remote plugins:', err);
    }
  }

  // Build pages from questions
  function buildPages(sourceForm) {
    let qs = [...sourceForm.questions];
    if (sourceForm.settings.shuffleQuestions) {
      const sections = [];
      let currentGroup = [];
      qs.forEach(q => {
        if (q.type === 'section_header') {
          if (currentGroup.length) sections.push(currentGroup);
          sections.push([q]);
          currentGroup = [];
        } else {
          currentGroup.push(q);
        }
      });
      if (currentGroup.length) sections.push(currentGroup);
      qs = sections.flatMap(group => {
        if (group.length === 1 && group[0].type === 'section_header') return group;
        return shuffleArray(group);
      });
    }
    const p = [[]];
    qs.forEach(q => {
      if (q.type === 'section_header' && p[p.length - 1].length > 0) {
        p.push([]);
      }
      p[p.length - 1].push(q);
    });
    return { questions: qs, pages: p };
  }

  let { questions, pages } = buildPages(form);
  const answers = {};
  const errors = {};
  let submitted = false;
  let currentPage = 0;
  let totalPages = pages.length;
  let themeColor = form.settings.themeColor || '#6c5ce7';

  // Real-time listener: auto-update when form is edited
  const unsubscribe = listenToSharedForm(formId, (updatedForm) => {
    form = updatedForm;
    themeColor = form.settings.themeColor || '#6c5ce7';
    const rebuilt = buildPages(form);
    questions = rebuilt.questions;
    pages = rebuilt.pages;
    totalPages = pages.length;
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (!submitted) render();
  });

  const render = () => {
    if (submitted) {
      container.innerHTML = `
        <div class="rfp-success-page">
          <div class="rfp-success-hero" style="background: ${themeColor}">
            <div class="rfp-brand-badge"><svg viewBox="0 0 32 32" width="14" height="14" style="vertical-align:-2px;margin-right:4px;"><rect width="32" height="32" rx="8" fill="#6c5ce7"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">ef</text></svg> Ephemeral Forms</div>
            <div class="rfp-success-wave">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none">
                <path d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,20 L1440,60 Z" fill="var(--bg-primary)"/>
              </svg>
            </div>
          </div>
          <div class="rfp-success-body">
            <div class="rfp-success-card">
              <div class="rfp-success-icon" style="background: ${themeColor}22; color: ${themeColor}">
                <i data-lucide="check-circle" style="width: 40px; height: 40px;"></i>
              </div>
              <h1 class="rfp-success-title">You're all done!</h1>
              <p class="rfp-success-msg">${escapeHtml(form.settings?.confirmationMessage || 'Thank you for your response!')}</p>
              <button class="rfp-btn-submit-another" id="submit-another" style="border-color: ${themeColor}; color: ${themeColor}">
                Submit another response
              </button>
            </div>
            <div class="rfp-foot">Powered by <strong>Ephemeral Forms</strong></div>
          </div>
        </div>
      `;
      createIcons({ icons: { CheckCircle } });
      container.querySelector('#submit-another')?.addEventListener('click', () => {
        Object.keys(answers).forEach(k => delete answers[k]);
        Object.keys(errors).forEach(k => delete errors[k]);
        submitted = false;
        currentPage = 0;
        render();
      });
      return;
    }

    const pageQuestions = pages[currentPage] || [];
    const progress = totalPages > 1 ? ((currentPage + 1) / totalPages) * 100 : 100;
    const isLastPage = currentPage === totalPages - 1;
    const isFirstPage = currentPage === 0;

    const sectionHeader = pageQuestions.find(q => q.type === 'section_header');
    const pageTitle = sectionHeader?.sectionTitle || sectionHeader?.label || null;
    const pageDesc = sectionHeader?.sectionDesc || null;

    // Build step labels from section headers
    const stepLabels = pages.map((p, i) => {
      const sh = p.find(q => q.type === 'section_header');
      return sh?.sectionTitle || sh?.label || `Step ${i + 1}`;
    });

    container.innerHTML = `
      <div class="rfp">
        <div class="rfp-hero" style="background: ${themeColor}">
          <div class="rfp-hero-inner" style="position:relative;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div class="rfp-brand-badge"><svg viewBox="0 0 32 32" width="14" height="14" style="vertical-align:-2px;margin-right:4px;"><rect width="32" height="32" rx="8" fill="#6c5ce7"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">ef</text></svg> Ephemeral Forms</div>
              <a href="#/manage/${formId}" class="rfp-manage-link" title="Manage this form">Manage</a>
            </div>
            <div class="rfp-hero-content">
              <h1 class="rfp-hero-title">${escapeHtml(isFirstPage ? form.title : (pageTitle || form.title))}</h1>
              ${(isFirstPage && form.description) ? `<p class="rfp-hero-desc">${escapeHtml(form.description)}</p>` : ''}
              ${(!isFirstPage && pageDesc) ? `<p class="rfp-hero-desc">${escapeHtml(pageDesc)}</p>` : ''}
            </div>
          </div>
          <div class="rfp-hero-wave">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none">
              <path d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,20 L1440,60 Z" fill="var(--bg-primary)"/>
            </svg>
          </div>
        </div>

        ${totalPages > 1 ? `
          <div id="responder-progress-container" class="rfp-stepper-wrap">
            <div class="rfp-stepper">
              ${stepLabels.map((label, i) => {
                const state = i < currentPage ? 'completed' : i === currentPage ? 'active' : 'upcoming';
                return `
                  <div class="rfp-stepper-item ${state}">
                    <div class="rfp-stepper-dot" style="${state === 'completed' || state === 'active' ? `background: ${themeColor}; border-color: ${themeColor};` : ''}">
                      ${state === 'completed' ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' : `<span>${i + 1}</span>`}
                    </div>
                    <span class="rfp-stepper-label">${escapeHtml(label)}</span>
                    ${i < totalPages - 1 ? `<div class="rfp-stepper-connector"><div class="rfp-stepper-connector-fill" style="${i < currentPage ? `width:100%;background:${themeColor}` : 'width:0%'}"></div></div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
            <div class="rfp-progress-bar-mini">
              <div class="rfp-progress-bar-mini-fill" style="width: ${progress}%; background: ${themeColor}"></div>
            </div>
          </div>
        ` : ''}

        <div class="rfp-body">
          <div class="rfp-container">
            ${isFirstPage ? `<p class="rfp-required-note">Fields marked <span class="required-mark">*</span> are required</p>` : ''}

            <div class="rfp-questions" id="responder-questions">
              ${pageQuestions.map(q => renderQuestion(q)).join('')}
            </div>

            <div class="rfp-actions">
              ${!isFirstPage ? `
                <button class="rfp-btn-back" id="prev-page">
                  <i data-lucide="chevron-left" style="width:16px;height:16px;"></i> Back
                </button>
              ` : '<div></div>'}
              ${!isLastPage ? `
                <button class="rfp-btn-next" id="next-page" style="background: ${themeColor}">
                  Continue <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
                </button>
              ` : `
                <button class="rfp-btn-submit" id="submit-form" style="background: ${themeColor}">
                  Submit Response
                </button>
              `}
            </div>
          </div>
          <div class="rfp-foot">Powered by <strong>Ephemeral Forms</strong></div>
        </div>
      </div>
    `;

    createIcons({ icons: { ChevronLeft, ArrowRight } });

    const progContainer = container.querySelector('#responder-progress-container');
    if (progContainer) {
      runHook('onRenderProgressBar', { container: progContainer, currentPage, totalPages, themeColor, pages });
    }

    pageQuestions.forEach(q => {
      const qt = getQuestionType(q.type);
      if (!qt || q.type === 'section_header') return;
      const inputContainer = container.querySelector(`[data-input-for="${q.id}"]`);
      if (inputContainer) {
        inputContainer.innerHTML = '';
        inputContainer.appendChild(qt.render(q, answers[q.id], (val) => {
          answers[q.id] = val;
          if (errors[q.id]) {
            delete errors[q.id];
            const errEl = container.querySelector(`[data-error-for="${q.id}"]`);
            if (errEl) errEl.textContent = '';
            const card = container.querySelector(`[data-qid="${q.id}"]`);
            if (card) card.classList.remove('has-error');
          }
        }));
      }
    });

    container.querySelector('#prev-page')?.addEventListener('click', async () => {
      const hd = await runHook('onPagePrev', { prevIndex: currentPage - 1, currentPage, totalPages, pages, answers });
      currentPage = hd.prevIndex;
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    container.querySelector('#next-page')?.addEventListener('click', async () => {
      if (validatePage(pageQuestions)) {
        const header = pageQuestions.find(q => q.type === 'section_header');
        let nextIndex = currentPage + 1;
        let shouldSubmit = false;

        if (header && header.goToSection) {
          if (header.goToSection === 'submit') {
            shouldSubmit = true;
          } else {
            const targetIdx = pages.findIndex(p => p[0]?.id === header.goToSection);
            if (targetIdx !== -1) nextIndex = targetIdx;
          }
        }

        const hookData = await runHook('onPageNext', { nextIndex, shouldSubmit, currentPage, totalPages, pages, answers });

        if (hookData.shouldSubmit) {
          handleSubmit();
          return;
        }

        currentPage = hookData.nextIndex;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    container.querySelector('#submit-form')?.addEventListener('click', handleSubmit);
  };

  const renderQuestion = (q) => {
    if (q.type === 'section_header') {
      return `
        <div class="rfp-section-header" data-qid="${q.id}">
          <h3 class="rfp-section-title">${escapeHtml(q.sectionTitle || q.label || '')}</h3>
          ${q.sectionDesc ? `<p class="rfp-section-desc">${escapeHtml(q.sectionDesc)}</p>` : ''}
        </div>
      `;
    }
    return `
      <div class="rfp-question-card ${errors[q.id] ? 'has-error' : ''}" data-qid="${q.id}">
        <label class="rfp-question-label">
          ${escapeHtml(q.label || 'Untitled Question')}
          ${q.required ? '<span class="required-mark">*</span>' : ''}
        </label>
        ${q.helpText ? `<p class="rfp-help-text">${escapeHtml(q.helpText)}</p>` : ''}
        <div class="rfp-question-input" data-input-for="${q.id}"></div>
        <div class="rfp-error-msg" data-error-for="${q.id}">${errors[q.id] || ''}</div>
      </div>
    `;
  };

  const validatePage = (pageQuestions) => {
    let valid = true;
    pageQuestions.forEach(q => {
      if (q.type === 'section_header') return;
      const qt = getQuestionType(q.type);
      if (!qt) return;
      const error = qt.validate(q, answers[q.id]);
      if (error) { errors[q.id] = error; valid = false; }
      else { delete errors[q.id]; }
    });
    if (!valid) {
      render();
      const firstError = container.querySelector('.has-error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Please fix the errors above', 'error');
    }
    return valid;
  };

  const handleSubmit = async () => {
    const pageQuestions = pages[currentPage] || [];
    if (!validatePage(pageQuestions)) return;

    let allValid = true;
    questions.forEach(q => {
      if (q.type === 'section_header') return;
      const qt = getQuestionType(q.type);
      if (!qt) return;
      const error = qt.validate(q, answers[q.id]);
      if (error) { errors[q.id] = error; allValid = false; }
    });

    if (!allValid) {
      render();
      showToast('Please complete all required fields', 'error');
      return;
    }

    try {
      await submitSharedResponse(token, { ...answers });
      submitted = true;
      render();
    } catch (err) {
      if (err.message === 'Link expired') {
        renderExpired(container);
      } else {
        showToast('Error submitting response: ' + err.message, 'error');
      }
    }
  };

  render();
}

// ---- Static error/expired pages ----

function renderExpired(container) {
  container.innerHTML = `
    <div class="rfp-not-found">
      <div class="rfp-not-found-card">
        <div class="rfp-not-found-icon" style="background: rgba(253,203,110,0.15); color: var(--warning);">
          <i data-lucide="alert-triangle" style="width: 32px; height: 32px;"></i>
        </div>
        <h2>Link Expired</h2>
        <p>This form link has expired. Please ask the form creator for a new link.</p>
      </div>
    </div>
  `;
  createIcons({ icons: { AlertTriangle } });
}

function renderError(container, title, message) {
  container.innerHTML = `
    <div class="rfp-not-found">
      <div class="rfp-not-found-card">
        <div class="rfp-not-found-icon">
          <i data-lucide="search" style="width: 32px; height: 32px;"></i>
        </div>
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
    </div>
  `;
  createIcons({ icons: { Search } });
}
