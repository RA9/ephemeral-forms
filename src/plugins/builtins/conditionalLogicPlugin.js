// Built-in Plugin: Conditional Logic
import { registerPlugin } from '../PluginAPI.js';

registerPlugin({
  id: 'conditional-logic',
  name: 'Conditional Logic',
  description: 'Show or hide questions based on previous answers. Add branching logic to your forms.',
  version: '1.0',
  iconId: 'git-branch',
  tags: ['logic', 'branching'],
  setup(api) {
    // Register hooks for form rendering with conditional logic
    api.registerHook('onFormSubmit', (data) => {
      // Filter out answers to hidden questions
      if (data.form && data.answers) {
        const visibleQuestions = getVisibleQuestions(data.form.questions, data.answers);
        const visibleIds = new Set(visibleQuestions.map(q => q.id));
        const filteredAnswers = {};
        for (const [key, val] of Object.entries(data.answers)) {
          if (visibleIds.has(key)) {
            filteredAnswers[key] = val;
          }
        }
        data.answers = filteredAnswers;
      }
      return data;
    });
  },
});

/**
 * Get visible questions based on conditional logic rules
 * @param {Array} questions - All form questions
 * @param {Object} answers - Current answers
 * @returns {Array} Visible questions
 */
export function getVisibleQuestions(questions, answers) {
  return questions.filter(q => {
    if (!q.conditionalLogic || !q.conditionalLogic.enabled) return true;

    const { sourceQuestionId, operator, value } = q.conditionalLogic;
    const sourceAnswer = answers[sourceQuestionId];

    switch (operator) {
      case 'equals':
        return sourceAnswer === value;
      case 'not_equals':
        return sourceAnswer !== value;
      case 'contains':
        if (Array.isArray(sourceAnswer)) return sourceAnswer.includes(value);
        return String(sourceAnswer || '').includes(value);
      case 'not_empty':
        return sourceAnswer !== undefined && sourceAnswer !== null && sourceAnswer !== '';
      case 'is_empty':
        return !sourceAnswer || sourceAnswer === '';
      case 'greater_than':
        return Number(sourceAnswer) > Number(value);
      case 'less_than':
        return Number(sourceAnswer) < Number(value);
      default:
        return true;
    }
  });
}
