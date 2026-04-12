import Sortable from 'sortablejs';
import { createIcons, Save, Eye, Share2, Plus, GripVertical, Trash2, Settings, ChevronDown, Type, AlignLeft, CheckSquare, List, Circle, ArrowUpCircle, Calendar, Clock, Upload, Layout, Edit2, Copy, X, Square, ChevronRight, FileText, Sigma, Hash, ArrowRight, CornerDownRight, Sparkles, Loader } from 'lucide';
import { createQuestion, getAllQuestionTypes, getQuestionType } from './questionTypes.js';
import { getValidatorsForType, VALIDATORS } from './validators.js';
import { createForm, getForm, updateForm } from '../storage/formStore.js';
import { showToast, deepClone, escapeHtml } from '../utils.js';
import { navigateTo } from '../router.js';
import { showShareModal } from '../sharing/ShareModal.js';
import { getLinkStatus, resyncSharedForm } from '../firebase/shareService.js';
import { isAIAvailable, generateForm, getAIUsage } from '../ai/formGenerator.js';
import { processImageFile } from '../firebase/imageService.js';
import { setMeta } from '../utils/meta.js';
import { Image as ImageIcon } from 'lucide';

export async function renderFormBuilder(container, formId) {
  const openAI = window.location.hash.includes('ai=1');
  let form;

  if (formId) {
    form = await getForm(formId);
    if (!form) {
      showToast('Form not found', 'error');
      navigateTo('/dashboard');
      return;
    }
  } else {
    form = await createForm();
    // Update URL without triggering re-route
    history.replaceState(null, '', `#/build/${form.id}`);
    formId = form.id;
  }

  setMeta(form.title ? `Edit — ${form.title}` : 'Create Form', 'Build your form with the drag-and-drop builder or AI generation.');

  let questions = deepClone(form.questions || []);
  let selectedQuestionId = null;
  let previewMode = false;

  // ============================================================
  // Helpers
  // ============================================================

  // Group flat questions list into steps (section_header = step boundary).
  // Questions before the first section_header go into a "default" group.
  const groupBySteps = () => {
    const groups = [];
    let current = { header: null, questions: [] };
    questions.forEach(q => {
      if (q.type === 'section_header') {
        groups.push(current);
        current = { header: q, questions: [] };
      } else {
        current.questions.push(q);
      }
    });
    groups.push(current);
    return groups.filter(g => g.header !== null || g.questions.length > 0);
  };

  // Rebuild the flat questions array from the current DOM order after a drag.
  const reconstructFromDOM = () => {
    const newOrder = [];
    container.querySelectorAll('.step-group').forEach(group => {
      const headerId = group.dataset.headerId;
      if (headerId !== '__default__') {
        const headerQ = questions.find(q => q.id === headerId);
        if (headerQ) newOrder.push(headerQ);
      }
      group.querySelectorAll(':scope > .step-body > .question-card').forEach(card => {
        const q = questions.find(q => q.id === card.dataset.id);
        if (q) newOrder.push(q);
      });
    });
    questions.length = 0;
    questions.push(...newOrder);
  };

  // Non-section question types for the inline picker
  const fieldTypes = () => getAllQuestionTypes().filter(qt => qt.type !== 'section_header');

  // All step headers for routing dropdowns
  const allStepHeaders = () => questions.filter(q => q.type === 'section_header');

  // Human step index (1-based) for a given header id
  const stepIndex = (headerId) => {
    const all = allStepHeaders();
    return all.findIndex(q => q.id === headerId) + 1;
  };

  // ============================================================
  // Render
  // ============================================================

  const render = () => {
    container.innerHTML = `
      <div class="builder-layout">
        <div class="builder-main">
          <div class="builder-header">
            <div class="builder-header-left">
              <button id="builder-back" data-tooltip="Back to Dashboard">← Back</button>
              <div class="builder-title-area">
                <input type="text" class="builder-title-input" id="form-title"
                  value="${escapeHtml(form.title)}" placeholder="Untitled Form" />
                <input type="text" class="builder-desc-input" id="form-desc"
                  value="${escapeHtml(form.description)}" placeholder="Form description (optional)" />
              </div>
            </div>
            <div class="builder-header-right">
              ${isAIAvailable() ? `
              <button class="btn btn-ai btn-sm" id="ai-generate-btn">
                <i data-lucide="sparkles" style="margin-right: 6px;"></i> AI Generate
              </button>
              ` : ''}
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
            <h4 class="builder-sidebar-title">Add Field</h4>
            <div class="question-type-grid" id="question-type-grid">
              ${fieldTypes().map(qt => `
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
              <label class="settings-label">Cover Image</label>
              <div class="cover-image-upload" id="cover-upload-area">
                ${form.coverImage
                  ? `<div class="cover-image-preview">
                      <img src="${escapeHtml(form.coverImage)}" alt="Cover" class="cover-image-thumb" />
                      <button class="cover-image-remove" id="remove-cover" title="Remove cover image"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
                    </div>`
                  : `<div class="cover-image-placeholder" id="cover-placeholder">
                      <i data-lucide="image" style="width:24px;height:24px;color:var(--text-tertiary);"></i>
                      <span>Click or drag to upload</span>
                      <span class="cover-image-hint">JPEG, PNG, WebP, GIF — max 2 MB</span>
                    </div>`
                }
                <input type="file" id="cover-file-input" accept="image/jpeg,image/png,image/webp,image/gif" style="display:none;" />
              </div>
            </div>
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

      <!-- AI Generate Modal -->
      <div class="ai-modal-overlay" id="ai-modal" style="display:none;">
        <div class="ai-modal">
          <div class="ai-modal-header">
            <div class="ai-modal-title"><i data-lucide="sparkles" style="width:18px;height:18px;"></i> AI Form Generator</div>
            <button class="ai-modal-close" id="ai-modal-close"><i data-lucide="x" style="width:16px;height:16px;"></i></button>
          </div>
          <div class="ai-modal-body">
            <label class="ai-modal-label">Describe the form you want to create</label>
            <textarea class="textarea ai-prompt-input" id="ai-prompt" rows="4"
              placeholder="e.g. A job application form with name, email, resume upload, work experience, and a cover letter"></textarea>
            <div class="ai-stream-output" id="ai-stream" style="display:none;">
              <div class="ai-stream-label"><i data-lucide="loader" style="width:14px;height:14px;" class="ai-spinner"></i> Generating form...</div>
              <pre class="ai-stream-text" id="ai-stream-text"></pre>
            </div>
          </div>
          <div class="ai-modal-footer">
            <span class="ai-usage-badge" id="ai-usage"></span>
            <button class="btn btn-ghost btn-sm" id="ai-cancel">Cancel</button>
            <button class="btn btn-primary btn-sm" id="ai-submit">
              <i data-lucide="sparkles" style="width:14px;height:14px;margin-right:6px;"></i> Generate
            </button>
          </div>
        </div>
      </div>
    `;

    bindEvents();

    if (!previewMode) {
      initSortable();
    }

    createIcons({
      icons: {
        Save, Eye, Share2, Plus, GripVertical, Trash2, Settings, ChevronDown,
        Type, AlignLeft, CheckSquare, List, Circle, ArrowUpCircle, Calendar,
        Clock, Upload, Layout, Edit2, Copy, X, Square, ChevronRight, FileText,
        Sigma, Hash, ArrowRight, CornerDownRight, Sparkles, Loader,
        Image: ImageIcon
      }
    });
  };

  // ============================================================
  // Editor
  // ============================================================

  const renderEditor = () => {
    if (questions.length === 0) {
      return `
        <div class="builder-questions">
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="file-text" style="width: 48px; height: 48px;"></i></div>
            <div class="empty-state-title">No questions yet</div>
            <div class="empty-state-text">Add a <strong>Step</strong> to create a multi-page form, or add fields directly for a single-page form.</div>
          </div>
          <div class="step-global-actions">
            <button class="step-add-step-btn" id="add-first-step">
              <i data-lucide="plus" style="width:16px;height:16px;"></i>
              Add First Step
            </button>
          </div>
        </div>
      `;
    }

    const groups = groupBySteps();
    const themeColor = form.settings.themeColor || '#6c5ce7';

    return `
      <div class="builder-questions">
        <div id="steps-list">
          ${groups.map(group => renderStepGroup(group, themeColor)).join('')}
        </div>
        <div class="step-global-actions">
          <button class="step-add-step-btn" id="add-step-btn">
            <i data-lucide="plus" style="width:16px;height:16px;"></i>
            Add Step
          </button>
        </div>
      </div>
    `;
  };

  // ---- Step Group ----

  const renderStepGroup = (group, themeColor) => {
    const headerId = group.header?.id || '__default__';
    const hasHeader = !!group.header;
    const sIdx = hasHeader ? stepIndex(headerId) : 0;
    const allHeaders = allStepHeaders();

    // Build routing options
    let routingHtml = '';
    if (hasHeader) {
      let opts = `<option value="">Continue to next step</option>`;
      allHeaders.forEach((sec, idx) => {
        if (sec.id !== headerId) {
          opts += `<option value="${sec.id}" ${group.header.goToSection === sec.id ? 'selected' : ''}>Go to Step ${idx + 1}${sec.sectionTitle ? ` — ${escapeHtml(sec.sectionTitle)}` : ''}</option>`;
        }
      });
      opts += `<option value="submit" ${group.header.goToSection === 'submit' ? 'selected' : ''}>Submit form</option>`;

      routingHtml = `
        <div class="step-routing">
          <div class="step-routing-label">
            <i data-lucide="corner-down-right" style="width:14px;height:14px;"></i>
            After this step
          </div>
          <select class="select step-routing-select" data-id="${headerId}" data-field="goToSection">
            ${opts}
          </select>
        </div>
      `;
    }

    return `
      <div class="step-group ${hasHeader ? 'step-group-has-header' : ''}" data-header-id="${headerId}"
           style="--step-color: ${themeColor};">

        ${hasHeader ? `
          <div class="step-header">
            <div class="step-header-drag" title="Drag to reorder step"><i data-lucide="grip-vertical"></i></div>
            <div class="step-header-badge" style="background: ${themeColor}">Step ${sIdx}</div>
            <div class="step-header-fields">
              <input type="text" class="step-title-input" data-id="${headerId}" data-field="sectionTitle"
                     value="${escapeHtml(group.header.sectionTitle || '')}" placeholder="Step title (e.g. Personal Info)" />
              <input type="text" class="step-desc-input" data-id="${headerId}" data-field="sectionDesc"
                     value="${escapeHtml(group.header.sectionDesc || '')}" placeholder="Description (optional)" />
            </div>
            <div class="step-header-actions">
              <button class="btn-icon btn-sm" data-action="duplicate" data-id="${headerId}" title="Duplicate step"><i data-lucide="copy"></i></button>
              <button class="btn-icon btn-sm" data-action="delete" data-id="${headerId}" title="Delete step"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
        ` : `
          <div class="step-header step-header-default">
            <div class="step-header-badge step-header-badge-muted">Ungrouped Fields</div>
            <span class="step-header-hint">These fields appear before any step. Add a Step above to group them.</span>
          </div>
        `}

        <div class="step-body" id="step-body-${headerId}">
          ${group.questions.map(q => renderQuestionCard(q, questions.indexOf(q))).join('')}
          ${group.questions.length === 0 && hasHeader ? `
            <div class="step-empty-drop">
              <i data-lucide="plus" style="width:16px;height:16px;opacity:0.4;"></i>
              <span>Drag fields here or use the button below</span>
            </div>
          ` : ''}
        </div>

        <div class="step-footer">
          <button class="step-add-field-btn" data-section="${headerId}">
            <i data-lucide="plus" style="width:14px;height:14px;"></i>
            Add field${hasHeader ? ' to this step' : ''}
          </button>
          <div class="step-field-picker" id="picker-${headerId}" hidden>
            ${fieldTypes().map(qt => `
              <button class="step-field-type" data-type="${qt.type}" data-section="${headerId}" title="${qt.label}">
                <i data-lucide="${qt.icon}" style="width:14px;height:14px;"></i>
                <span>${qt.label}</span>
              </button>
            `).join('')}
          </div>
          ${routingHtml}
        </div>
      </div>
    `;
  };

  // ---- Question Card (unchanged structure) ----

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
            ${renderValidationUI(q)}
          </div>
        </div>
      </div>
    `;
  };

  // ---- Per-type option editors ----

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

    if (q.type === 'mathjax_display') {
      return `
        <div class="mathjax-editor" data-id="${q.id}">
          <label style="font-size:var(--font-xs);color:var(--text-secondary);margin-bottom:var(--space-2);display:block;">LaTeX Expression</label>
          <textarea class="textarea mathjax-syntax-input" data-id="${q.id}" data-field="mathSyntax"
            rows="3" placeholder="e.g. \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}" style="font-family:monospace;font-size:var(--font-sm);">${escapeHtml(q.mathSyntax || '')}</textarea>
          <div class="mathjax-preview-hint" style="font-size:var(--font-xs);color:var(--text-tertiary);margin-top:var(--space-2);">Use LaTeX syntax. Preview in preview mode.</div>
        </div>
      `;
    }

    // section_header options are now handled in the step header/footer, not here
    return '';
  };

  // ---- Validation rules UI ----

  const renderValidationUI = (q) => {
    const available = getValidatorsForType(q.type);
    if (available.length <= 1) return ''; // only "none" — skip for types with no validators

    const rules = q.validation || [];
    const activeTypes = rules.map(r => r.type);

    return `
      <div class="validation-section" data-id="${q.id}">
        <div class="validation-header">
          <span class="validation-title">Validation</span>
          <select class="select validation-add-select" data-id="${q.id}">
            <option value="">+ Add rule</option>
            ${available.filter(v => v.key !== 'none' && !activeTypes.includes(v.key)).map(v =>
              `<option value="${v.key}">${v.label}</option>`
            ).join('')}
          </select>
        </div>
        ${rules.length > 0 ? `
          <div class="validation-rules">
            ${rules.map((rule, ri) => {
              const def = VALIDATORS[rule.type];
              if (!def) return '';
              return `
                <div class="validation-rule" data-id="${q.id}" data-rule-index="${ri}">
                  <span class="validation-rule-label">${def.label}</span>
                  ${def.hasParam ? renderValidationParam(q.id, ri, rule, def) : ''}
                  <button class="btn-icon btn-sm validation-rule-remove" data-id="${q.id}" data-rule-index="${ri}" title="Remove rule">
                    <i data-lucide="x" style="width:12px;height:12px;"></i>
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;
  };

  const renderValidationParam = (qId, ruleIndex, rule, def) => {
    const param = def.hasParam;
    if (param === 'pattern') {
      return `
        <input type="text" class="input input-sm validation-param" data-id="${qId}" data-rule-index="${ruleIndex}" data-param="pattern"
          value="${escapeHtml(rule.pattern || '')}" placeholder="Regex pattern" />
        <input type="text" class="input input-sm validation-param" data-id="${qId}" data-rule-index="${ruleIndex}" data-param="patternMessage"
          value="${escapeHtml(rule.patternMessage || '')}" placeholder="Error message" />
      `;
    }
    if (param === 'minDate' || param === 'maxDate') {
      return `<input type="date" class="input input-sm validation-param" data-id="${qId}" data-rule-index="${ruleIndex}" data-param="${param}"
        value="${rule[param] || ''}" />`;
    }
    // Numeric params
    return `<input type="number" class="input input-sm validation-param" data-id="${qId}" data-rule-index="${ruleIndex}" data-param="${param}"
      value="${rule[param] ?? ''}" placeholder="${def.label}" />`;
  };

  // ---- Preview ----

  const renderPreview = () => {
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
              return `
                <div class="preview-question">
                  <label class="preview-question-label">
                    ${escapeHtml(q.label || q.sectionTitle || 'Untitled Question')}
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

  // ============================================================
  // Events
  // ============================================================

  const bindEvents = () => {
    // ---- Chrome ----
    container.querySelector('#builder-back')?.addEventListener('click', () => navigateTo('/dashboard'));

    container.querySelector('#form-title')?.addEventListener('input', (e) => {
      form.title = e.target.value;
      autoSave();
    });
    container.querySelector('#form-desc')?.addEventListener('input', (e) => {
      form.description = e.target.value;
      autoSave();
    });

    container.querySelector('#toggle-preview')?.addEventListener('click', () => {
      syncFormData();
      previewMode = !previewMode;
      render();
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

    container.querySelector('#share-form')?.addEventListener('click', async () => {
      await saveForm();
      await showShareModal(form);
    });

    container.querySelector('#save-form')?.addEventListener('click', saveForm);

    // ---- AI Generate ----
    const aiModal = container.querySelector('#ai-modal');
    const updateAIUsage = () => {
      const badge = container.querySelector('#ai-usage');
      if (!badge) return;
      const { remaining, limit } = getAIUsage();
      badge.textContent = `${remaining}/${limit} left today`;
      badge.classList.toggle('ai-usage-low', remaining <= 1);
      badge.classList.toggle('ai-usage-zero', remaining === 0);
      const submitBtn = container.querySelector('#ai-submit');
      if (submitBtn && remaining === 0) {
        submitBtn.disabled = true;
        submitBtn.title = 'Daily limit reached';
      }
    };
    container.querySelector('#ai-generate-btn')?.addEventListener('click', () => {
      aiModal.style.display = 'flex';
      updateAIUsage();
      container.querySelector('#ai-prompt')?.focus();
      createIcons({ icons: { Sparkles, X, Loader } });
    });
    const closeAI = () => { if (aiModal) aiModal.style.display = 'none'; };
    container.querySelector('#ai-modal-close')?.addEventListener('click', closeAI);
    container.querySelector('#ai-cancel')?.addEventListener('click', closeAI);
    aiModal?.addEventListener('click', (e) => { if (e.target === aiModal) closeAI(); });

    container.querySelector('#ai-submit')?.addEventListener('click', async () => {
      const prompt = container.querySelector('#ai-prompt')?.value?.trim();
      if (!prompt) { showToast('Please describe the form you want', 'error'); return; }

      const submitBtn = container.querySelector('#ai-submit');
      const streamEl = container.querySelector('#ai-stream');
      const streamText = container.querySelector('#ai-stream-text');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;margin-right:6px;" class="ai-spinner"></i> Generating...';
      streamEl.style.display = 'block';
      streamText.textContent = '';
      createIcons({ icons: { Loader } });

      try {
        const result = await generateForm(prompt, (_delta, full) => {
          streamText.textContent = full;
          streamText.scrollTop = streamText.scrollHeight;
        });
        if (result.title) form.title = result.title;
        if (result.description) form.description = result.description;
        questions.push(...result.questions);
        closeAI();
        render();
        showToast(`Added ${result.questions.length} questions from AI`, 'success');
        autoSave();
        updateAIUsage();
      } catch (err) {
        showToast(err.message || 'AI generation failed', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i data-lucide="sparkles" style="width:14px;height:14px;margin-right:6px;"></i> Generate';
        streamEl.style.display = 'none';
        createIcons({ icons: { Sparkles } });
      }
    });

    // ---- Cover Image ----
    const coverInput = container.querySelector('#cover-file-input');
    const coverArea = container.querySelector('#cover-upload-area');
    const handleCoverFile = async (file) => {
      if (!file) return;
      try {
        coverArea.classList.add('cover-uploading');
        const dataUrl = await processImageFile(file);
        form.coverImage = dataUrl;
        await saveForm(true);
        render();
        showToast('Cover image added', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to process image', 'error');
        coverArea.classList.remove('cover-uploading');
      }
    };
    container.querySelector('#cover-placeholder')?.addEventListener('click', () => coverInput?.click());
    container.querySelector('.cover-image-thumb')?.addEventListener('click', () => coverInput?.click());
    coverInput?.addEventListener('change', (e) => handleCoverFile(e.target.files[0]));
    coverArea?.addEventListener('dragover', (e) => { e.preventDefault(); coverArea.classList.add('cover-dragover'); });
    coverArea?.addEventListener('dragleave', () => coverArea.classList.remove('cover-dragover'));
    coverArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      coverArea.classList.remove('cover-dragover');
      handleCoverFile(e.dataTransfer.files[0]);
    });
    container.querySelector('#remove-cover')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      form.coverImage = '';
      await saveForm(true);
      render();
      showToast('Cover image removed', 'success');
    });

    // ---- Settings ----
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

    // ---- Sidebar: add question at end ----
    container.querySelectorAll('.question-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const newQ = createQuestion(btn.dataset.type);
        questions.push(newQ);
        selectedQuestionId = newQ.id;
        render();
        container.querySelector(`[data-id="${newQ.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        autoSave();
      });
    });

    // ---- Add Step buttons ----
    container.querySelector('#add-first-step')?.addEventListener('click', addStep);
    container.querySelector('#add-step-btn')?.addEventListener('click', addStep);

    // ---- Step header inputs (title, desc) ----
    container.querySelectorAll('.step-title-input, .step-desc-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q[e.target.dataset.field] = e.target.value;
        autoSave();
      });
    });

    // ---- Step routing ----
    container.querySelectorAll('.step-routing-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q.goToSection = e.target.value || '';
        autoSave();
      });
    });

    // ---- Inline field picker (per step) ----
    container.querySelectorAll('.step-add-field-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const picker = container.querySelector(`#picker-${btn.dataset.section}`);
        if (!picker) return;
        const isOpen = !picker.hidden;
        container.querySelectorAll('.step-field-picker').forEach(p => { p.hidden = true; });
        picker.hidden = isOpen;
      });
    });

    container.querySelectorAll('.step-field-type').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const sectionId = btn.dataset.section;
        const newQ = createQuestion(type);

        if (sectionId === '__default__') {
          const firstHeaderIdx = questions.findIndex(q => q.type === 'section_header');
          if (firstHeaderIdx === -1) questions.push(newQ);
          else questions.splice(firstHeaderIdx, 0, newQ);
        } else {
          const headerIdx = questions.findIndex(q => q.id === sectionId);
          let insertAt = headerIdx + 1;
          while (insertAt < questions.length && questions[insertAt].type !== 'section_header') insertAt++;
          questions.splice(insertAt, 0, newQ);
        }

        selectedQuestionId = newQ.id;
        render();
        container.querySelector(`[data-id="${newQ.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        autoSave();
      });
    });

    // Close pickers on outside click
    container.addEventListener('click', (e) => {
      if (!e.target.closest('.step-add-field-btn') && !e.target.closest('.step-field-picker')) {
        container.querySelectorAll('.step-field-picker').forEach(p => { p.hidden = true; });
      }
    });

    // ---- Question card: delete / duplicate ----
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
        const src = questions[srcIdx];
        const copy = createQuestion(src.type);
        Object.assign(copy, deepClone(src), { id: copy.id });
        if (src.type === 'section_header') {
          copy.sectionTitle = (copy.sectionTitle || 'Step') + ' (Copy)';
        } else {
          copy.label = (copy.label || '') + ' (Copy)';
        }
        questions.splice(srcIdx + 1, 0, copy);
        render();
        autoSave();
      });
    });

    // ---- Question field inputs ----
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

    container.querySelectorAll('.required-toggle').forEach(input => {
      input.addEventListener('change', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q.required = e.target.checked;
        autoSave();
      });
    });

    // ---- Choice option editing ----
    container.querySelectorAll('.option-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        const idx = parseInt(e.target.dataset.index);
        if (q && q.options) q.options[idx] = e.target.value;
        autoSave();
      });
    });

    container.querySelectorAll('.option-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const q = questions.find(q => q.id === btn.dataset.id);
        const idx = parseInt(btn.dataset.index);
        if (q && q.options && q.options.length > 1) {
          q.options.splice(idx, 1);
          render();
          autoSave();
        }
      });
    });

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

    // ---- Scale selects ----
    container.querySelectorAll('.scale-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q[e.target.dataset.field] = parseInt(e.target.value);
        autoSave();
      });
    });

    // ---- Generic data-field inputs (scale labels etc) ----
    container.querySelectorAll('[data-field]').forEach(el => {
      if (el.classList.contains('scale-select') || el.classList.contains('step-title-input') ||
          el.classList.contains('step-desc-input') || el.classList.contains('step-routing-select')) return;
      el.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (q) q[e.target.dataset.field] = e.target.value;
        autoSave();
      });
    });

    // ---- Validation rules ----
    container.querySelectorAll('.validation-add-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (!q || !e.target.value) return;
        if (!q.validation) q.validation = [];
        q.validation.push({ type: e.target.value });
        render();
        autoSave();
      });
    });

    container.querySelectorAll('.validation-rule-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const q = questions.find(q => q.id === btn.dataset.id);
        if (!q || !q.validation) return;
        q.validation.splice(parseInt(btn.dataset.ruleIndex), 1);
        render();
        autoSave();
      });
    });

    container.querySelectorAll('.validation-param').forEach(input => {
      input.addEventListener('input', (e) => {
        const q = questions.find(q => q.id === e.target.dataset.id);
        if (!q || !q.validation) return;
        const rule = q.validation[parseInt(e.target.dataset.ruleIndex)];
        if (!rule) return;
        const param = e.target.dataset.param;
        const val = e.target.type === 'number' ? (e.target.value === '' ? undefined : parseFloat(e.target.value)) : e.target.value;
        rule[param] = val;
        autoSave();
      });
    });

    // ---- Card selection ----
    container.querySelectorAll('.question-card').forEach(card => {
      card.addEventListener('click', () => {
        selectedQuestionId = card.dataset.id;
        container.querySelectorAll('.question-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
  };

  // ---- Add a new step ----
  const addStep = () => {
    const newStep = createQuestion('section_header');
    const stepCount = allStepHeaders().length + 1;
    newStep.sectionTitle = `Step ${stepCount}`;
    questions.push(newStep);
    selectedQuestionId = newStep.id;
    render();
    container.querySelector(`[data-header-id="${newStep.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    autoSave();
  };

  // ============================================================
  // Sortable (drag & drop)
  // ============================================================

  const initSortable = () => {
    // Outer: reorder entire step groups
    const stepsList = container.querySelector('#steps-list');
    if (stepsList) {
      Sortable.create(stepsList, {
        handle: '.step-header-drag',
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: () => { reconstructFromDOM(); render(); autoSave(); },
      });
    }

    // Inner: reorder questions within and across steps
    container.querySelectorAll('.step-body').forEach(body => {
      Sortable.create(body, {
        group: 'questions',
        handle: '.drag-handle',
        animation: 200,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: () => { reconstructFromDOM(); render(); autoSave(); },
      });
    });
  };

  // ============================================================
  // Persistence
  // ============================================================

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
      coverImage: form.coverImage || '',
    });
    if (!silent) showToast('Form saved!', 'success');

    // Sync to Firestore in the background (only on explicit save, not autosave)
    if (!silent) {
      syncToShared();
    }
  };

  const syncToShared = () => {
    getLinkStatus(formId).then(link => {
      if (link.active) {
        return resyncSharedForm(formId, form);
      }
    }).catch(() => {});
  };

  render();

  // Auto-open AI modal if navigated with ?ai=1
  if (openAI && isAIAvailable()) {
    const aiModal = container.querySelector('#ai-modal');
    if (aiModal) {
      aiModal.style.display = 'flex';
      container.querySelector('#ai-prompt')?.focus();
      createIcons({ icons: { Sparkles, X, Loader } });
    }
  }
}
