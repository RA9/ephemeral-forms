// Built-in field validators
// Each validator has: label, appliesTo (question types), test(value, params) => error string | null

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/.+\..+/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;
const ALPHA_RE = /^[a-zA-Z\s]+$/;
const ALPHANUMERIC_RE = /^[a-zA-Z0-9\s]+$/;
const ZIP_US_RE = /^\d{5}(-\d{4})?$/;

export const VALIDATORS = {
  none:         { label: 'None',               appliesTo: ['short_text', 'long_text'] },
  email:        { label: 'Email address',      appliesTo: ['short_text'],
    test: (v) => !EMAIL_RE.test(v) ? 'Please enter a valid email address' : null },
  url:          { label: 'URL',                appliesTo: ['short_text'],
    test: (v) => !URL_RE.test(v) ? 'Please enter a valid URL (https://...)' : null },
  phone:        { label: 'Phone number',       appliesTo: ['short_text'],
    test: (v) => !PHONE_RE.test(v) ? 'Please enter a valid phone number' : null },
  number:       { label: 'Number',             appliesTo: ['short_text'],
    test: (v) => !NUMBER_RE.test(v) ? 'Please enter a valid number' : null },
  alpha:        { label: 'Letters only',       appliesTo: ['short_text'],
    test: (v) => !ALPHA_RE.test(v) ? 'Only letters and spaces are allowed' : null },
  alphanumeric: { label: 'Letters & numbers',  appliesTo: ['short_text'],
    test: (v) => !ALPHANUMERIC_RE.test(v) ? 'Only letters, numbers, and spaces are allowed' : null },
  zip_us:       { label: 'US zip code',        appliesTo: ['short_text'],
    test: (v) => !ZIP_US_RE.test(v) ? 'Please enter a valid US zip code' : null },
  min_length:   { label: 'Minimum length',     appliesTo: ['short_text', 'long_text'], hasParam: 'minLength',
    test: (v, p) => v.length < (p.minLength || 0) ? `Must be at least ${p.minLength} characters` : null },
  max_length:   { label: 'Maximum length',     appliesTo: ['short_text', 'long_text'], hasParam: 'maxLength',
    test: (v, p) => v.length > (p.maxLength || 9999) ? `Must be no more than ${p.maxLength} characters` : null },
  min_value:    { label: 'Minimum value',      appliesTo: ['short_text'], hasParam: 'minValue',
    test: (v, p) => { const n = parseFloat(v); return isNaN(n) ? 'Enter a number' : n < (p.minValue ?? -Infinity) ? `Must be at least ${p.minValue}` : null; } },
  max_value:    { label: 'Maximum value',      appliesTo: ['short_text'], hasParam: 'maxValue',
    test: (v, p) => { const n = parseFloat(v); return isNaN(n) ? 'Enter a number' : n > (p.maxValue ?? Infinity) ? `Must be no more than ${p.maxValue}` : null; } },
  regex:        { label: 'Custom pattern',     appliesTo: ['short_text', 'long_text'], hasParam: 'pattern',
    test: (v, p) => { try { return !new RegExp(p.pattern).test(v) ? (p.patternMessage || 'Invalid format') : null; } catch { return 'Invalid pattern'; } } },
  min_select:   { label: 'Min selections',     appliesTo: ['checkboxes'], hasParam: 'minSelect',
    test: (v, p) => { const arr = Array.isArray(v) ? v : []; return arr.length < (p.minSelect || 0) ? `Select at least ${p.minSelect} option(s)` : null; } },
  max_select:   { label: 'Max selections',     appliesTo: ['checkboxes'], hasParam: 'maxSelect',
    test: (v, p) => { const arr = Array.isArray(v) ? v : []; return arr.length > (p.maxSelect || 999) ? `Select no more than ${p.maxSelect} option(s)` : null; } },
  date_min:     { label: 'Earliest date',      appliesTo: ['date'], hasParam: 'minDate',
    test: (v, p) => p.minDate && v < p.minDate ? `Date must be on or after ${p.minDate}` : null },
  date_max:     { label: 'Latest date',        appliesTo: ['date'], hasParam: 'maxDate',
    test: (v, p) => p.maxDate && v > p.maxDate ? `Date must be on or before ${p.maxDate}` : null },
};

export function getValidatorsForType(questionType) {
  return Object.entries(VALIDATORS)
    .filter(([, v]) => v.appliesTo.includes(questionType))
    .map(([key, v]) => ({ key, ...v }));
}

export function runValidation(question, value) {
  const rules = question.validation || [];
  for (const rule of rules) {
    const validator = VALIDATORS[rule.type];
    if (!validator || !validator.test) continue;
    const error = validator.test(value, rule);
    if (error) return error;
  }
  return null;
}
