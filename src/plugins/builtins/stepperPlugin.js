// Stepper Plugin: Quantity input with Increment/Decrement mechanics
import { escapeHtml } from '../../utils.js';

export function setupStepperPlugin(api) {
  api.registerQuestionType('stepper', {
    label: 'Stepper',
    icon: 'hash',
    category: 'advanced',
    getDefault: () => ({ min: 0, max: 100, step: 1 }),
    
    render: (question, value, onChange) => {
      const container = document.createElement('div');
      container.className = 'stepper-container';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.gap = '8px';
      container.style.maxWidth = '200px';

      const min = parseInt(question.min) || 0;
      const max = parseInt(question.max) || 100;
      const step = parseInt(question.step) || 1;
      
      let currentValue = value !== undefined && value !== null ? parseInt(value) : min;

      const decrementBtn = document.createElement('button');
      decrementBtn.className = 'btn btn-secondary btn-icon';
      decrementBtn.type = 'button';
      decrementBtn.innerHTML = '<b>-</b>';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'input';
      input.style.textAlign = 'center';
      input.style.fontWeight = 'bold';
      input.value = currentValue;
      input.min = min;
      input.max = max;
      input.step = step;

      const incrementBtn = document.createElement('button');
      incrementBtn.className = 'btn btn-secondary btn-icon';
      incrementBtn.type = 'button';
      incrementBtn.innerHTML = '<b>+</b>';

      const updateValue = (newVal) => {
        if (newVal < min) newVal = min;
        if (newVal > max) newVal = max;
        currentValue = newVal;
        input.value = currentValue;
        onChange(currentValue);
      };

      decrementBtn.addEventListener('click', () => updateValue(currentValue - step));
      incrementBtn.addEventListener('click', () => updateValue(currentValue + step));
      input.addEventListener('change', (e) => updateValue(parseInt(e.target.value) || min));

      container.appendChild(decrementBtn);
      container.appendChild(input);
      container.appendChild(incrementBtn);

      return container;
    },
    
    validate: (question, value) => {
      if (question.required && (value === undefined || value === null || value === '')) return 'This field is required';
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        if (question.min !== undefined && parsed < question.min) return `Minimum value is ${question.min}`;
        if (question.max !== undefined && parsed > question.max) return `Maximum value is ${question.max}`;
      }
      return null;
    },
  });
}

if (window.EphemeralPlugins) {
  window.EphemeralPlugins.register({
    id: 'builtin-stepper',
    name: 'Number Stepper',
    version: '1.0',
    description: 'A numeric input bounded by max and min with convenient plus and minus increment buttons.',
    iconId: 'hash',
    tags: ['Numbers', 'Quantities', 'Inputs'],
    enabled: true,
    setup: setupStepperPlugin
  });
}
