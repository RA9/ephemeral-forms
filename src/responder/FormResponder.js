import { getForm } from '../storage/formStore.js';
import { addResponse } from '../storage/responseStore.js';
import { getQuestionType } from '../builder/questionTypes.js';
import { showToast, formatDate, escapeHtml, shuffleArray } from '../utils.js';
import { createIcons, ChevronLeft, ChevronRight, CheckCircle, Search } from 'lucide';

export async function renderFormResponder(container, formId) {
  const form = await getForm(formId);

  if (!form) {
    container.innerHTML = `
      <div class="full-width-layout">
        <div class="page-container responder-confirmation">
          <div class="empty-state" style="margin: 0 auto;">
            <div class="empty-state-icon"><i data-lucide="search" style="width: 48px; height: 48px;"></i></div>
            <div class="empty-state-title">Form Not Found</div>
            <div class="empty-state-text">This form may have been deleted or the link is incorrect.</div>
            <a href="#/" class="btn btn-primary">Go to Dashboard</a>
          </div>
        </div>
      </div>
    `;
    return;
  }

  let questions = [...form.questions];
  if (form.settings.shuffleQuestions) {
    // Don't shuffle section headers
    const sections = [];
    let currentGroup = [];
    questions.forEach(q => {
      if (q.type === 'section_header') {
        if (currentGroup.length) sections.push(currentGroup);
        sections.push([q]);
        currentGroup = [];
      } else {
        currentGroup.push(q);
      }
    });
    if (currentGroup.length) sections.push(currentGroup);
    // Shuffle non-section groups
    questions = sections.flatMap(group => {
      if (group.length === 1 && group[0].type === 'section_header') return group;
      return shuffleArray(group);
    });
  }

  const answers = {};
  const errors = {};
  let submitted = false;
  let currentPage = 0;

  // Split questions into pages by section headers
  const pages = [[]];
  questions.forEach(q => {
    if (q.type === 'section_header' && pages[pages.length - 1].length > 0) {
      pages.push([]);
    }
    pages[pages.length - 1].push(q);
  });

  const totalPages = pages.length;
  const themeColor = form.settings.themeColor || '#6c5ce7';

  const render = () => {
    if (submitted) {
      container.innerHTML = `
        <div class="full-width-layout">
          <div class="page-container responder-confirmation fade-in">
            <div class="responder-card card confirmation-card">
              <div class="confirmation-icon">
                <i data-lucide="check-circle" style="width: 64px; height: 64px; color: var(--success-500);"></i>
              </div>
              <h1 class="responder-title" style="text-align: center; margin-bottom: var(--space-2);">Response Submitted</h1>
              <p class="responder-desc">${escapeHtml(form.settings?.confirmationMessage || 'Thank you for your response!')}</p>
              <div class="responder-actions" style="justify-content: center; margin-top: var(--space-8)">
                <button class="btn btn-secondary" id="submit-another">Submit another response</button>
              </div>
            </div>
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

    container.innerHTML = `
      <div class="full-width-layout">
        <div class="responder-top-bar" style="background: ${themeColor}">
          <div class="page-container" style="padding-top: 0; padding-bottom: 0; min-height: unset; display: flex; align-items: center;">
            <span class="responder-brand" style="margin-left: 0;">✦ Ephemeral Forms</span>
          </div>
        </div>
        <div class="page-container" style="padding-top: var(--space-8);">
          ${totalPages > 1 ? `
            <div class="progress-bar" style="margin-bottom: var(--space-6)">
              <div class="progress-bar-fill" style="width: ${progress}%; background: ${themeColor}"></div>
            </div>
          ` : ''}
          
          <div class="responder-form card slide-up" style="border-top: 4px solid ${themeColor}">
            <div class="responder-header">
              <h1 class="responder-title">${escapeHtml(form.title)}</h1>
              ${form.description ? `<p class="responder-desc">${escapeHtml(form.description)}</p>` : ''}
              ${currentPage === 0 ? '<p class="responder-required-note">* Required</p>' : ''}
            </div>

            <div class="responder-questions" id="responder-questions">
              ${pageQuestions.map(q => renderQuestion(q)).join('')}
            </div>

            <div class="responder-footer">
              ${currentPage > 0 ? `<button class="btn btn-secondary" id="prev-page"><i data-lucide="chevron-left"></i> Previous</button>` : '<div></div>'}
              ${currentPage < totalPages - 1 
                ? `<button class="btn btn-primary" id="next-page" style="background: ${themeColor}">Next <i data-lucide="chevron-right"></i></button>`
                : `<button class="btn btn-primary btn-lg" id="submit-form" style="background: ${themeColor}">Submit</button>`
              }
            </div>
          </div>

          <div class="responder-footer-text">
            <span>Powered by <strong>Ephemeral Forms</strong></span>
          </div>
        </div>
      </div>
    `;

    createIcons({ icons: { ChevronLeft, ChevronRight } });

    pageQuestions.forEach(q => {
      const qt = getQuestionType(q.type);
      if (!qt || q.type === 'section_header') return;
      const inputContainer = container.querySelector(`[data-input-for="${q.id}"]`);
      if (inputContainer) {
        inputContainer.innerHTML = '';
        inputContainer.appendChild(qt.render(q, answers[q.id], (val) => {
          answers[q.id] = val;
          // Clear error on change
          if (errors[q.id]) {
            delete errors[q.id];
            const errEl = container.querySelector(`[data-error-for="${q.id}"]`);
            if (errEl) errEl.textContent = '';
          }
        }));
      }
    });

    // Bind navigation
    container.querySelector('#prev-page')?.addEventListener('click', () => {
      currentPage--;
      render();
      window.scrollTo(0, 0);
    });
    container.querySelector('#next-page')?.addEventListener('click', () => {
      if (validatePage(pageQuestions)) {
        currentPage++;
        render();
        window.scrollTo(0, 0);
      }
    });
    container.querySelector('#submit-form')?.addEventListener('click', handleSubmit);
  };

  const renderQuestion = (q) => {
    if (q.type === 'section_header') {
      const qt = getQuestionType(q.type);
      return `
        <div class="responder-section-header">
          <h3>${escapeHtml(q.sectionTitle || q.label || '')}</h3>
          ${q.sectionDesc ? `<p>${escapeHtml(q.sectionDesc)}</p>` : ''}
        </div>
      `;
    }

    return `
      <div class="responder-question ${errors[q.id] ? 'has-error' : ''}" data-qid="${q.id}">
        <label class="responder-question-label">
          ${escapeHtml(q.label || 'Untitled Question')}
          ${q.required ? '<span class="required-mark">*</span>' : ''}
        </label>
        ${q.helpText ? `<p class="responder-help-text">${escapeHtml(q.helpText)}</p>` : ''}
        <div class="responder-question-input" data-input-for="${q.id}"></div>
        <div class="responder-error" data-error-for="${q.id}">${errors[q.id] || ''}</div>
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
      if (error) {
        errors[q.id] = error;
        valid = false;
      } else {
        delete errors[q.id];
      }
    });
    if (!valid) {
      render();
      // Scroll to first error
      const firstError = container.querySelector('.has-error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Please fix the errors above', 'error');
    }
    return valid;
  };

  const handleSubmit = async () => {
    // Validate all pages
    let allValid = true;
    questions.forEach(q => {
      if (q.type === 'section_header') return;
      const qt = getQuestionType(q.type);
      if (!qt) return;
      const error = qt.validate(q, answers[q.id]);
      if (error) {
        errors[q.id] = error;
        allValid = false;
      }
    });

    if (!allValid) {
      render();
      showToast('Please complete all required fields', 'error');
      return;
    }

    try {
      await addResponse(formId, { ...answers });
      submitted = true;
      render();
      showToast('Response submitted!', 'success');
    } catch (err) {
      showToast('Error submitting response', 'error');
    }
  };

  render();
}

