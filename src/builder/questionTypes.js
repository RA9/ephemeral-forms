// Question Type Registry
// Each question type provides: render (for responder), renderEditor (for builder), validate, getDefault
import { v4 as uuidv4 } from 'uuid';

const questionTypes = new Map();

// Register a question type
export function registerQuestionType(type, config) {
  questionTypes.set(type, config);
}

export function getQuestionType(type) {
  return questionTypes.get(type);
}

export function getAllQuestionTypes() {
  return Array.from(questionTypes.entries()).map(([type, config]) => ({
    type,
    ...config,
  }));
}

export function createQuestion(type) {
  const config = questionTypes.get(type);
  if (!config) throw new Error(`Unknown question type: ${type}`);
  return {
    id: uuidv4(),
    type,
    label: '',
    helpText: '',
    required: false,
    ...config.getDefault(),
  };
}

// // ===== BUILT-IN QUESTION TYPES =====

registerQuestionType('short_text', {
  label: 'Short Answer',
  icon: 'type',
  category: 'text',
  getDefault: () => ({ placeholder: '' }),
  render: (question, value, onChange) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input';
    input.placeholder = question.placeholder || 'Your answer';
    input.value = value || '';
    input.addEventListener('input', (e) => onChange(e.target.value));
    return input;
  },
  validate: (question, value) => {
    if (question.required && (!value || !value.trim())) return 'This field is required';
    return null;
  },
});

registerQuestionType('long_text', {
  label: 'Paragraph',
  icon: 'align-left',
  category: 'text',
  getDefault: () => ({ placeholder: '' }),
  render: (question, value, onChange) => {
    const textarea = document.createElement('textarea');
    textarea.className = 'textarea';
    textarea.placeholder = question.placeholder || 'Your answer';
    textarea.value = value || '';
    textarea.addEventListener('input', (e) => onChange(e.target.value));
    return textarea;
  },
  validate: (question, value) => {
    if (question.required && (!value || !value.trim())) return 'This field is required';
    return null;
  },
});

registerQuestionType('multiple_choice', {
  label: 'Multiple Choice',
  icon: 'circle',
  category: 'choice',
  getDefault: () => ({ options: ['Option 1', 'Option 2', 'Option 3'], allowOther: false }),
  render: (question, value, onChange) => {
    const container = document.createElement('div');
    container.className = 'choice-options';

    const allOptions = [...(question.options || [])];
    if (question.allowOther) allOptions.push('__other__');

    allOptions.forEach((opt) => {
      const label = document.createElement('label');
      label.className = 'choice-option';
      const isOther = opt === '__other__';
      const displayText = isOther ? 'Other...' : opt;

      label.innerHTML = `
        <input type="radio" name="q_${question.id}" value="${opt}" ${value === opt ? 'checked' : ''} />
        <span class="choice-radio"></span>
        <span class="choice-label">${displayText}</span>
      `;
      if (isOther) {
        const otherInput = document.createElement('input');
        otherInput.type = 'text';
        otherInput.className = 'input choice-other-input';
        otherInput.placeholder = 'Type your answer';
        otherInput.style.marginLeft = '8px';
        otherInput.style.flex = '1';
        if (value && !question.options.includes(value)) {
          otherInput.value = value;
        }
        otherInput.addEventListener('input', (e) => onChange(e.target.value));
        label.appendChild(otherInput);
      }
      label.querySelector('input[type="radio"]').addEventListener('change', (e) => {
        if (isOther) {
          const oi = label.querySelector('.choice-other-input');
          onChange(oi?.value || '');
        } else {
          onChange(e.target.value);
        }
      });
      container.appendChild(label);
    });
    return container;
  },
  validate: (question, value) => {
    if (question.required && !value) return 'Please select an option';
    return null;
  },
});

registerQuestionType('checkboxes', {
  label: 'Checkboxes',
  icon: 'check-square',
  category: 'choice',
  getDefault: () => ({ options: ['Option 1', 'Option 2', 'Option 3'] }),
  render: (question, value, onChange) => {
    const container = document.createElement('div');
    container.className = 'choice-options';
    const selected = Array.isArray(value) ? value : [];

    (question.options || []).forEach((opt) => {
      const label = document.createElement('label');
      label.className = 'choice-option';
      label.innerHTML = `
        <input type="checkbox" value="${opt}" ${selected.includes(opt) ? 'checked' : ''} />
        <span class="choice-checkbox"></span>
        <span class="choice-label">${opt}</span>
      `;
      label.querySelector('input').addEventListener('change', () => {
        const checks = container.querySelectorAll('input[type="checkbox"]:checked');
        onChange(Array.from(checks).map(c => c.value));
      });
      container.appendChild(label);
    });
    return container;
  },
  validate: (question, value) => {
    if (question.required && (!Array.isArray(value) || value.length === 0)) return 'Please select at least one option';
    return null;
  },
});

registerQuestionType('dropdown', {
  label: 'Dropdown',
  icon: 'chevron-down',
  category: 'choice',
  getDefault: () => ({ options: ['Option 1', 'Option 2', 'Option 3'] }),
  render: (question, value, onChange) => {
    const select = document.createElement('select');
    select.className = 'select';
    select.innerHTML = `<option value="">Choose...</option>` +
      (question.options || []).map(opt => 
        `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
      ).join('');
    select.addEventListener('change', (e) => onChange(e.target.value));
    return select;
  },
  validate: (question, value) => {
    if (question.required && !value) return 'Please select an option';
    return null;
  },
});

registerQuestionType('linear_scale', {
  label: 'Linear Scale',
  icon: 'list',
  category: 'choice',
  getDefault: () => ({ scaleMin: 1, scaleMax: 5, labelMin: '', labelMax: '' }),
  render: (question, value, onChange) => {
    const container = document.createElement('div');
    container.className = 'scale-container';
    
    const min = question.scaleMin || 1;
    const max = question.scaleMax || 5;

    let html = '';
    if (question.labelMin) html += `<span class="scale-label">${question.labelMin}</span>`;
    html += '<div class="scale-options">';
    for (let i = min; i <= max; i++) {
      html += `
        <label class="scale-option ${value == i ? 'selected' : ''}">
          <input type="radio" name="q_${question.id}" value="${i}" ${value == i ? 'checked' : ''} />
          <span>${i}</span>
        </label>
      `;
    }
    html += '</div>';
    if (question.labelMax) html += `<span class="scale-label">${question.labelMax}</span>`;

    container.innerHTML = html;
    container.querySelectorAll('input[type="radio"]').forEach(input => {
      input.addEventListener('change', (e) => {
        container.querySelectorAll('.scale-option').forEach(o => o.classList.remove('selected'));
        e.target.closest('.scale-option').classList.add('selected');
        onChange(parseInt(e.target.value));
      });
    });
    return container;
  },
  validate: (question, value) => {
    if (question.required && (value === undefined || value === null || value === '')) return 'Please select a value';
    return null;
  },
});

registerQuestionType('date', {
  label: 'Date',
  icon: 'calendar',
  category: 'other',
  getDefault: () => ({}),
  render: (question, value, onChange) => {
    const input = document.createElement('input');
    input.type = 'date';
    input.className = 'input';
    input.value = value || '';
    input.addEventListener('change', (e) => onChange(e.target.value));
    return input;
  },
  validate: (question, value) => {
    if (question.required && !value) return 'Please select a date';
    return null;
  },
});

registerQuestionType('time', {
  label: 'Time',
  icon: 'clock',
  category: 'other',
  getDefault: () => ({}),
  render: (question, value, onChange) => {
    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'input';
    input.value = value || '';
    input.addEventListener('change', (e) => onChange(e.target.value));
    return input;
  },
  validate: (question, value) => {
    if (question.required && !value) return 'Please select a time';
    return null;
  },
});

registerQuestionType('file_upload', {
  label: 'File Upload',
  icon: 'upload',
  category: 'other',
  getDefault: () => ({ maxFiles: 1, acceptTypes: '' }),
  render: (question, value, onChange) => {
    const container = document.createElement('div');
    container.className = 'file-upload-area';
    container.innerHTML = `
      <div class="file-drop-zone" tabindex="0">
        <i data-lucide="upload" style="width: 24px; height: 24px; color: var(--text-tertiary); margin-bottom: 8px;"></i>
        <span class="file-drop-text">Click or drop files here</span>
        <input type="file" class="file-input-hidden" ${question.acceptTypes ? `accept="${question.acceptTypes}"` : ''} ${question.maxFiles > 1 ? 'multiple' : ''} />
      </div>
      <div class="file-list"></div>
    `;
    const fileInput = container.querySelector('.file-input-hidden');
    const dropZone = container.querySelector('.file-drop-zone');
    const fileList = container.querySelector('.file-list');

    const updateFiles = (files) => {
      const fileData = Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type }));
      fileList.innerHTML = fileData.map(f => `
        <div class="file-item">
          <i data-lucide="file-text" style="width: 16px; height: 16px; margin-right: 8px;"></i>
          <span>${f.name}</span>
          <span class="file-size">${(f.size / 1024).toFixed(1)}KB</span>
        </div>
      `).join('');
      onChange(fileData);
      
      // Re-init icons for dynamic content
      import('lucide').then(({ createIcons, FileText }) => createIcons({ icons: { FileText } }));
    };

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => updateFiles(e.target.files));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); updateFiles(e.dataTransfer.files); });

    return container;
  },
  validate: (question, value) => {
    if (question.required && (!value || (Array.isArray(value) && value.length === 0))) return 'Please upload a file';
    return null;
  },
});

registerQuestionType('section_header', {
  label: 'Section',
  icon: 'layout',
  category: 'layout',
  getDefault: () => ({ sectionTitle: 'Section Title', sectionDesc: '' }),
  render: (question) => {
    const container = document.createElement('div');
    container.className = 'section-header-block';
    container.innerHTML = `
      <h3 class="section-title">${question.sectionTitle || question.label || 'Section'}</h3>
      ${question.sectionDesc ? `<p class="section-desc">${question.sectionDesc}</p>` : ''}
    `;
    return container;
  },
  validate: () => null, // Sections don't validate
});
