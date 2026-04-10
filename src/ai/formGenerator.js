import { InferenceClient } from '@huggingface/inference';
import { v4 as uuidv4 } from 'uuid';

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const MODEL = 'Qwen/Qwen3-8B';
const PROVIDER = 'fireworks-ai';

// Rate limiting
const BURST_LIMIT = 10;           // max per hour (in-memory)
const BURST_WINDOW_MS = 60 * 60 * 1000;
const burstLedger = [];

const DAILY_LIMIT = 5;            // max per day (persisted)
const STORAGE_KEY = 'ef_ai_usage';

function getDailyUsage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: '', count: 0 };
    const data = JSON.parse(raw);
    return data;
  } catch { return { date: '', count: 0 }; }
}

function recordDailyUse() {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getDailyUsage();
  if (usage.date !== today) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 1 }));
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: usage.count + 1 }));
  }
}

export function getAIUsage() {
  const today = new Date().toISOString().slice(0, 10);
  const usage = getDailyUsage();
  const used = usage.date === today ? usage.count : 0;
  return { used, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used) };
}

function checkRateLimit() {
  // Daily limit (persistent)
  const today = new Date().toISOString().slice(0, 10);
  const usage = getDailyUsage();
  const dailyUsed = usage.date === today ? usage.count : 0;
  if (dailyUsed >= DAILY_LIMIT) {
    return { allowed: false, message: `Daily limit reached (${DAILY_LIMIT}/${DAILY_LIMIT}). Resets tomorrow.` };
  }

  // Burst limit (in-memory)
  const now = Date.now();
  while (burstLedger.length && burstLedger[0] < now - BURST_WINDOW_MS) {
    burstLedger.shift();
  }
  if (burstLedger.length >= BURST_LIMIT) {
    const waitMin = Math.ceil((burstLedger[0] + BURST_WINDOW_MS - now) / 60000);
    return { allowed: false, message: `Too many requests. Try again in ~${waitMin} min.` };
  }

  return { allowed: true };
}

const SYSTEM_PROMPT = `You are a form builder AI. Given a user's description, generate a JSON object with a form title, description, and questions.

IMPORTANT: Every form MUST begin with a section_header as the first question. Group related fields under section_headers to create logical steps. Never place fields before the first section_header.

Respond with a JSON object:
{
  "title": "Short form title",
  "description": "Brief one-line description of the form's purpose",
  "questions": [ ... ]
}

Each question object must have:
- "type": one of "short_text", "long_text", "multiple_choice", "checkboxes", "dropdown", "linear_scale", "date", "time", "section_header"
- "label": the question text
- "required": boolean
- "helpText": optional hint (empty string if none)

Type-specific fields:
- short_text / long_text: "placeholder" (string)
- multiple_choice / checkboxes / dropdown: "options" (array of plain strings, e.g. ["Option A", "Option B"]), "allowOther" (boolean, default false)
- linear_scale: "scaleMin" (number), "scaleMax" (number), "lowLabel" (string), "highLabel" (string)
- section_header: "sectionTitle" (string), "sectionDesc" (string, optional)

Do NOT think or reason. Respond ONLY with valid JSON. No markdown, no explanation, no wrapping, no <think> tags.`;

export function isAIAvailable() {
  return !!HF_TOKEN;
}

export async function generateForm(description, onChunk) {
  if (!HF_TOKEN) throw new Error('AI generation is not configured.');

  const limit = checkRateLimit();
  if (!limit.allowed) throw new Error(limit.message);

  burstLedger.push(Date.now());
  recordDailyUse();

  const client = new InferenceClient(HF_TOKEN);

  let fullText = '';
  let thinking = false;

  for await (const chunk of client.chatCompletionStream({
    model: MODEL,
    provider: PROVIDER,
    messages: [
      { role: 'user', content: `${SYSTEM_PROMPT}\n\nUser request: "${description}"` },
    ],
    max_tokens: 2048,
    temperature: 0.3,
  })) {
    const delta = chunk.choices?.[0]?.delta?.content || '';
    fullText += delta;

    // Hide <think> block from stream preview
    if (delta.includes('<think>')) thinking = true;
    if (thinking) {
      if (fullText.includes('</think>')) {
        thinking = false;
        const visible = fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        if (onChunk) onChunk('', visible);
      }
    } else {
      const visible = fullText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (onChunk) onChunk(delta, visible);
    }
  }

  return parseResponse(fullText);
}

function parseResponse(raw) {
  // Strip <think>...</think> blocks (Qwen3 thinking mode)
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

  // Strip accidental markdown fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // Try parsing as object first (new format), fall back to array (legacy)
  let title = '';
  let description = '';
  let arr;

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try {
      const obj = JSON.parse(cleaned.slice(objStart, objEnd + 1));
      if (obj.questions && Array.isArray(obj.questions)) {
        title = obj.title || '';
        description = obj.description || '';
        arr = obj.questions;
      }
    } catch { /* fall through to array parsing */ }
  }

  if (!arr) {
    const arrStart = cleaned.indexOf('[');
    const arrEnd = cleaned.lastIndexOf(']');
    if (arrStart === -1 || arrEnd === -1) throw new Error('AI did not return valid form data. Please try rephrasing.');
    arr = JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
    if (!Array.isArray(arr)) throw new Error('AI did not return a question list.');
  }

  const questions = arr.map(q => ({
    id: uuidv4(),
    type: q.type || 'short_text',
    label: q.label || '',
    helpText: q.helpText || '',
    required: !!q.required,
    placeholder: q.placeholder || '',
    ...(q.options ? {
      options: q.options.map(o => typeof o === 'string' ? o : (o.value || o.text || '')),
      allowOther: !!q.allowOther,
    } : {}),
    ...(q.type === 'linear_scale' ? {
      scaleMin: q.scaleMin ?? 1,
      scaleMax: q.scaleMax ?? 5,
      lowLabel: q.lowLabel || '',
      highLabel: q.highLabel || '',
    } : {}),
    ...(q.type === 'section_header' ? {
      sectionTitle: q.sectionTitle || q.label || '',
      sectionDesc: q.sectionDesc || '',
    } : {}),
  }));

  // Ensure questions always start with a section_header
  if (questions.length > 0 && questions[0].type !== 'section_header') {
    questions.unshift({
      id: uuidv4(),
      type: 'section_header',
      label: title || 'Form',
      helpText: '',
      required: false,
      placeholder: '',
      sectionTitle: title || 'Form',
      sectionDesc: description || '',
    });
  }

  return { title, description, questions };
}
