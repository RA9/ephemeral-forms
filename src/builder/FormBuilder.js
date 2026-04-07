import Sortable from 'sortablejs';
import { createIcons, Save, Eye, Share2, Plus, GripVertical, Trash2, Settings, ChevronDown, Type, AlignLeft, CheckSquare, List, Circle, ArrowUpCircle, Calendar, Clock, Upload, Layout, Edit2, Copy, X, Square, ChevronRight, FileText, Sigma, Hash } from 'lucide';
import { createQuestion, getAllQuestionTypes, getQuestionType } from './questionTypes.js';
import { createForm, getForm, updateForm } from '../storage/formStore.js';
import { showToast, deepClone, escapeHtml } from '../utils.js';
import { navigateTo } from '../router.js';

export async function renderFormBuilder(container, formId) {
  let form;
  let isNew = !formId;

  if (formId) {
    form = await getForm(formId);
    if (!form) {
      showToast('Form not found', 'error');
      navigateTo('/');
      return;
    }
  } else {
    form = await createForm();
    navigateTo(`/build/${form.id}`);
    formId = form.id;
  }

  let questions = deepClone(form.questions || []);
  let selectedQuestionId = null;
  let previewMode = false;

  const render = () => {
    container.innerHTML = `
      <div class="builder-layout">
        <div class="builder-main">
          <div class="builder-header">
            <div class="builder-header-left">
              <button class="btn btn-ghost" id="builder-back" data-tooltip="Back to Dashboard">← Back</button>
              <div class="builder-title-area">
                <input type="text" class="builder-title-input" id="form-title" 
                  value="${escapeHtml(form.title)}" placeholder="Untitled Form" />
                <input type="text" class="builder-desc-input" id="form-desc" 
                  value="${escapeHtml(form.description)}" placeholder="Form description (optional)" />
              </div>
            </div>
            <div class="builder-header-right">
              <button class="btn btn-ghost btn-sm ${previewMode ? 'active' : ''}" id="toggle-preview">
                <i data-lucide="${previewMode ? 'edit-2' : 'eye'}" style="margin-right: 8px;"></i>
                ${previewMode ? 'Edit' : 'Preview'}
              </button>
              <button class="btn btn-secondary btn-sm" id="share-form">
                <i data-lucide="share-2" style="margin-right: 8px;"></i> Share
              </button>
              <button class="btn btn-primary btn-sm" id="save-form">
                <i data-lucide="save" style="margin-right: 8px;"></i> Save
              </button>
            </div>
          </div>

          ${previewMode ? renderPreview() : renderEditor()}
        </div>

        ${!previewMode ? `
        <div class="builder-sidebar">
          <div class="builder-sidebar-section">
            <h4 class="builder-sidebar-title">Add Question</h4>
            <div class="question-type-grid" id="question-type-grid">
              ${getAllQuestionTypes().map(qt => `
                <button class="question-type-btn" data-type="${qt.type}" data-tooltip="${qt.label}">
                  <span class="question-type-icon"><i data-lucide="${qt.icon}"></i></span>
                  <span class="question-type-label">${qt.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="builder-sidebar-section">
            <h4 class="builder-sidebar-title">Form Settings</h4>
            <div class="settings-group">
              <label class="settings-label">Theme Color</label>
              <input type="color" class="color-picker" id="theme-color" value="${form.settings.themeColor || '#6c5ce7'}" />
            </div>
            <div class="settings-group">
              <label class="settings-label">Confirmation Message</label>
              <textarea class="textarea" id="confirm-msg" rows="2" placeholder="Thank you!">${escapeHtml(form.settings.confirmationMessage || '')}</textarea>
            </div>
            <div class="settings-toggle-row">
              <span class="settings-label">Shuffle Questions</span>
              <label class="toggle">
                <input type="checkbox" id="shuffle-toggle" ${form.settings.shuffleQuestions ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;

    bindEvents();

    if (!previewMode) {
      initSortable();
    }

    // Re-initialize Lucide icons after every render
    createIcons({
      icons: {
        Save, Eye, Share2, Plus, GripVertical, Trash2, Settings, ChevronDown,
        Type, AlignLeft, CheckSquare, List, Circle, ArrowUpCircle, Calendar,
        Clock, Upload, Layout, Edit2, Copy, X, Square, ChevronRight, FileText,
        Sigma, Hash
      }
    });
  };

  const renderEditor = () => {
    if (questions.length === 0) {
      return `
        <div class="builder-questions">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="file-text" style="width: 48px; height: 48px;"></i></div>
            <div class="empty-state-title">No questions yet</div>
            <div class="empty-state-text">Click a question type from the sidebar to add your first question.</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="builder-questions" id="questions-list">
        ${questions.map((q, idx) => renderQuestionCard(q, idx)).join('')}
      </div>
    `;
  };

  const renderQuestionCard = (q, idx) => {
    const isSelected = selectedQuestionId === q.id;
    const qt = getQuestionType(q.type);

    return `
      <div class="question-card ${isSelected ? 'selected' : ''}" data-id="${q.id}" data-index="${idx}">
        <div class="question-card-header">
          <span class="drag-handle" title="Drag to reorder"><i data-lucide="grip-vertical"></i></span>
          <span class="question-number">${idx + 1}</span>
          <span class="badge badge-primary">${qt?.label || q.type}</span>
          <div class="question-card-actions">
            <button class="btn-icon btn-sm" data-action="duplicate" data-id="${q.id}" title="Duplicate"><i data-lucide="copy"></i></button>
            <button class="btn-icon btn-sm" data-action="delete" data-id="${q.id}" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="question-card-body">
          <input type="text" class="question-label-input" data-id="${q.id}" 
            value="${escapeHtml(q.label)}" placeholder="Question text" />
          <input type="text" class="question-help-input" data-id="${q.id}" 
            value="${escapeHtml(q.helpText || '')}" placeholder="Help text (optional)" />
          
          ${renderQuestionOptions(q)}
          
          <div class="question-card-footer">
            <label class="toggle-inline">
              <span>Required</span>
              <label class="toggle">
                <input type="checkbox" class="required-toggle" data-id="${q.id}" ${q.required ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </label>
          </div>
        </div>
      </div>
    `;
  };

  const renderQuestionOptions = (q) => {
    if (q.type === 'multiple_choice' || q.type === 'checkboxes' || q.type === 'dropdown') {
      return `
        <div class="options-editor" data-id="${q.id}">
          ${(q.options || []).map((opt, i) => `
            <div class="option-row">
              <span class="option-icon">
                <i data-lucide="${q.type === 'checkboxes' ? 'square' : q.type === 'dropdown' ? 'chevron-right' : 'circle'}"></i>
              </span>
              <input type="text" class="option-input" data-id="${q.id}" data-index="${i}" value="${escapeHtml(opt)}" />
              <button class="btn-icon btn-sm option-remove" data-id="${q.id}" data-index="${i}"><i data-lucide="x"></i></button>
            </div>
          `).join('')}
          <button class="btn btn-ghost btn-sm add-option-btn" data-id="${q.id}">
            <i data-lucide="plus" style="margin-right: 8px;"></i> Add option
          </button>
        </div>
      `;
    }

    if (q.type === 'linear_scale') {
      return `
        <div class="scale-editor" data-id="${q.id}">
          <div class="scale-range-row">
            <label>
              Min: <select class="select scale-select" data-id="${q.id}" data-field="scaleMin">
                ${[0,1].map(v => `<option value="${v}" ${q.scaleMin == v ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </label>
            <label>
              Max: <select class="select scale-select" data-id="${q.id}" data-field="scaleMax">
                ${[2,3,4,5,6,7,8,9,10].map(v => `<option value="${v}" ${q.scaleMax == v ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </label>
          </div>
          <div class="scale-label-row">
            <input type="text" class="input" data-id="${q.id}" data-field="labelMin" value="${escapeHtml(q.labelMin || '')}" placeholder="Min label (e.g. Not at all)" />
            <input type="text" class="input" data-id="${q.id}" data-field="labelMax" value="${escapeHtml(q.labelMax || '')}" placeholder="Max label (e.g. Very much)" />
          </div>
        </div>
      `;
    }
    if (q.type === 'section_header') {
      const allSections = questions.filter(o => o.type === 'section_header');
      const currentIndex = allSections.findIndex(o => o.id === q.id);
      
      let sectionOptions = `<option value="">Continue to next section</option>`;
      allSections.forEach((sec, idx) => {
        if (sec.id !== q.id) {
          sectionOptions += `<option value="${sec.id}" ${q.goToSection === sec.id ? 'selected' : ''}>Go to section ${idx + 1} (${escapeHtml(sec.sectionTitle || 'Untitled')})</option>`;
        }
      });
      sectionOptions += `<option value="submit" ${q.goToSection === 'submit' ? 'selected' : ''}>Submit form</option>`;

      return `
        <div class="section-editor" data-id="${q.id}">
          <input type="text" class="input" style="margin-bottom: var(--space-3);" data-id="${q.id}" data-field="sectionTitle" value="${escapeHtml(q.sectionTitle || '')}" placeholder="Section Title" />
          <textarea class="textarea" style="margin-bottom: var(--space-3);" data-id="${q.id}" data-field="sectionDesc" rows="2" placeholder="Section description">${escapeHtml(q.sectionDesc || '')}</textarea>
          <div class="section-logic-editor">
            <label style="font-size: var(--font-sm); color: var(--text-secondary); margin-bottom: var(--space-2); display: block;">After this section</label>
            <select class="select scale-select" data-id="${q.id}" data-field="goToSection">
              ${sectionOptions}
            </select>
          </div>
        </div>
      `;
    }

    return '';
  };

  const renderPreview = () => {
    // Simple preview without full responder logic if needed, or just use the same render logic
    return `
      <div class="preview-container">
        <div class="preview-banner">
          <i data-lucide="eye" style="margin-right: 8px;"></i>
          <span>Preview Mode</span>
          <span class="preview-note">This is how respondents will see your form</span>
        </div>
        <div class="preview-form card" style="border-top: 4px solid ${form.settings.themeColor || 'var(--primary-500)'}">
          <h2>${escapeHtml(form.title || 'Untitled Form')}</h2>
          ${form.description ? `<p class="preview-desc">${escapeHtml(form.description)}</p>` : ''}
          <div class="preview-questions">
            ${questions.map(q => {
              const qt = getQuestionType(q.type);
              if (!qt) return '';
              const wrapper = document.createElement('div');
              const rendered = qt.render(q, null, () => {});
              return `
                <div class="preview-question">
                  <label class="preview-question-label">
                    ${escapeHtml(q.label || 'Untitled Question')}
                    ${q.required ? '<span class="required-mark">*</span>' : ''}
                  </label>
                  ${q.helpText ? `<p class="preview-help-text">${escapeHtml(q.helpText)}</p>` : ''}
                  <div class="preview-question-input" data-question-id="${q.id}" data-type="${q.type}"></div>
                </div>
              `;
            }).join('')}
          </div>
          <button class="btn btn-primary btn-lg" disabled style="margin-top: var(--space-6); opacity: 0.6; width: 100%;">Submit (Preview only)</button>
        </div>
      </div>
    `;
  };

  const bindEvents = () => {
    // Back button
    container.querySelector('#builder-back')?.addEventListener('click', () => navigateTo('/'));

    // Title & Description
    container.querySelector('#form-title')?.addEventListener('input', (e) => {
      form.title = e.target.value;
      autoSave();
    });
    container.querySelector('#form-desc')?.addEventListener('input', (e) => {
      form.description = e.target.value;
      autoSave();
    });

    // Preview toggle
    container.querySelector('#toggle-preview')?.addEventListener('click', () => {
      syncFormData();
      previewMode = !previewMode;
      render();
      // Re-render preview question inputs
      if (previewMode) {
        questions.forEach(q => {
          const qt = getQuestionType(q.type);
          if (!qt) return;
          const inputEl = container.querySelector(`[data-question-id="${q.id}"]`);
          if (inputEl) {
            inputEl.innerHTML = '';
            inputEl.appendChild(qt.render(q, null, () => {}));
          }
        });
      }
    });

    // Share
    container.querySelector('#share-form')?.addEventListener('click', async () => {
      await saveForm();
      const url = `${window.location.origin}${window.location.pathname}#/form/${formId}`;
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!', 'success');
      } catch {
        showToast(url, 'info', 8000);
      }
    });

    // Save
    container.querySelector('#save-form')?.addEventListener('click', saveForm);

    // Add question type buttons
    container.querySelectorAll('.question-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const newQ = createQuestion(type);
        questions.push(newQ);
        selectedQuestionId = newQ.id;
        render();
        // scroll to new question
        const el = container.querySelector(`[data-id="${newQ.id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        autoSave();
      });
    });

    // Question card actions
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        questions = questions.filter(q => q.id !== id);
        if (selectedQuestionId === id) selectedQuestionId = null;
        render();
        autoSave();
      });
    });

    container.querySelectorAll('[data-action="duplicate"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const srcIdx = questions.findIndex(q => q.id === id);
        if (srcIdx === -1) return;
        const copy = createQuestion(questions[srcIdx].type);
        Object.assign(copy, deepClone(questions[srcIdx]), { id: copy.id });
        copy.label = copy.label + ' (Copy)';
        questions.splice(srcIdx + 1, 0, copy);
        render();
        autoSave();
      });
    });

    // Question label / help text inputs
    container.querySelectorAll('.question-label-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q.label = e.target.value;
        autoSave();
      });
    });
    container.querySelectorAll('.question-help-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q.helpText = e.target.value;
        autoSave();
      });
    });

    // Required toggles
    container.querySelectorAll('.required-toggle').forEach(input => {
      input.addEventListener('change', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q.required = e.target.checked;
        autoSave();
      });
    });

    // Option inputs
    container.querySelectorAll('.option-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        const idx = parseInt(e.target.dataset.index);
        if (q && q.options) q.options[idx] = e.target.value;
        autoSave();
      });
    });

    // Remove option
    container.querySelectorAll('.option-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const q = questions.find(q => q.id === btn.dataset.id);
        const idx = parseInt(btn.dataset.index);
        if (q && q.options && q.options.length > 1) {
          q.options.splice(idx, 1);
          render();
          autoSave();
        }
      });
    });

    // Add option
    container.querySelectorAll('.add-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = questions.find(q => q.id === btn.dataset.id);
        if (q && q.options) {
          q.options.push(`Option ${q.options.length + 1}`);
          render();
          autoSave();
        }
      });
    });

    // Scale selects
    container.querySelectorAll('.scale-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q[e.target.dataset.field] = parseInt(e.target.value);
        autoSave();
      });
    });

    // Scale labels and section fields
    container.querySelectorAll('[data-field]').forEach(el => {
      if (el.classList.contains('scale-select')) return; // already handled
      el.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q[e.target.dataset.field] = e.target.value;
        autoSave();
      });
    });

    // Settings
    container.querySelector('#theme-color')?.addEventListener('input', (e) => {
      form.settings.themeColor = e.target.value;
      autoSave();
    });
    container.querySelector('#confirm-msg')?.addEventListener('input', (e) => {
      form.settings.confirmationMessage = e.target.value;
      autoSave();
    });
    container.querySelector('#shuffle-toggle')?.addEventListener('change', (e) => {
      form.settings.shuffleQuestions = e.target.checked;
      autoSave();
    });

    // Click on question card to select
    container.querySelectorAll('.question-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedQuestionId = card.dataset.id;
        container.querySelectorAll('.question-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  };

  const initSortable = () => {
    const list = container.querySelector('#questions-list');
    if (!list) return;

    Sortable.create(list, {
      handle: '.drag-handle',
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      onEnd: (evt) => {
        const [moved] = questions.splice(evt.oldIndex, 1);
        questions.splice(evt.newIndex, 0, moved);
        render();
        autoSave();
      },
    });
  };

  let saveTimer = null;
  const autoSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveForm(true), 1500);
  };

  const syncFormData = () => {
    form.questions = deepClone(questions);
  };

  const saveForm = async (silent = false) => {
    syncFormData();
    await updateForm(formId, {
      title: form.title,
      description: form.description,
      questions: form.questions,
      settings: form.settings,
    });
    if (!silent) showToast('Form saved!', 'success');
  };

  render();
}

