import { InferenceClient } from '@huggingface/inference';
import { v4 as uuidv4 } from 'uuid';

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const MODEL = 'google/gemma-3-1b-it';

// Rate limiting: max 10 generations per hour per session
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateLedger = [];

function checkRateLimit() {
  const now = Date.now();
  while (rateLedger.length && rateLedger[0] < now - RATE_WINDOW_MS) {
    rateLedger.shift();
  }
  if (rateLedger.length >= RATE_LIMIT) {
    const waitMin = Math.ceil((rateLedger[0] + RATE_WINDOW_MS - now) / 60000);
    return { allowed: false, message: `Rate limit reached. Try again in ~${waitMin} min.` };
  }
  return { allowed: true };
}

const SYSTEM_PROMPT = `You are a form builder AI. Given a user's description, generate a JSON array of form questions.

Each question object must have:
- "type": one of "short_text", "long_text", "multiple_choice", "checkboxes", "dropdown", "linear_scale", "date", "time", "section_header"
- "label": the question text
- "required": boolean
- "helpText": optional hint (empty string if none)

Type-specific fields:
- short_text / long_text: "placeholder" (string)
- multiple_choice / checkboxes / dropdown: "options" (array of {"id": unique string, "value": text}), "allowOther" (boolean, default false)
- linear_scale: "scaleMin" (number), "scaleMax" (number), "lowLabel" (string), "highLabel" (string)
- section_header: "sectionTitle" (string), "sectionDesc" (string, optional)

Respond ONLY with a valid JSON array. No markdown, no explanation, no wrapping.`;

export function isAIAvailable() {
  return !!HF_TOKEN;
}

export async function generateForm(description, onChunk) {
  if (!HF_TOKEN) throw new Error('AI generation is not configured.');

  const limit = checkRateLimit();
  if (!limit.allowed) throw new Error(limit.message);

  rateLedger.push(Date.now());

  const client = new InferenceClient(HF_TOKEN);

  let fullText = '';

  for await (const chunk of client.chatCompletionStream({
    model: MODEL,
    messages: [
      { role: 'user', content: `${SYSTEM_PROMPT}\n\nUser request: "${description}"` },
    ],
    max_tokens: 2048,
    temperature: 0.3,
  })) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    fullText += delta;
    if (onChunk) onChunk(delta, fullText);
  }

  return parseQuestions(fullText);
}

function parseQuestions(raw) {
  // Extract JSON array from response (strip any accidental markdown fences)
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // Find array boundaries
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('AI did not return valid form data. Please try rephrasing.');

  const arr = JSON.parse(cleaned.slice(start, end + 1));
  if (!Array.isArray(arr)) throw new Error('AI did not return a question list.');

  return arr.map(q => ({
    id: uuidv4(),
    type: q.type || 'short_text',
    label: q.label || '',
    helpText: q.helpText || '',
    required: !!q.required,
    placeholder: q.placeholder || '',
    // Multiple choice / checkboxes / dropdown
    ...(q.options ? {
      options: q.options.map(o => ({
        id: o.id || uuidv4(),
        value: o.value || o.text || '',
      })),
      allowOther: !!q.allowOther,
    } : {}),
    // Linear scale
    ...(q.type === 'linear_scale' ? {
      scaleMin: q.scaleMin ?? 1,
      scaleMax: q.scaleMax ?? 5,
      lowLabel: q.lowLabel || '',
      highLabel: q.highLabel || '',
    } : {}),
    // Section header
    ...(q.type === 'section_header' ? {
      sectionTitle: q.sectionTitle || q.label || '',
      sectionDesc: q.sectionDesc || '',
    } : {}),
  }));
}
