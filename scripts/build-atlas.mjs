/** Validate the editable JSON and emit dependency-free classic browser scripts. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const bank = read('atlas/questions.json'), media = read('atlas/media.json'), review = read('atlas/source-review.json');
const assert = (condition, message) => { if (!condition) throw Error(message); };
const bilingual = x => x && ['he', 'ru'].every(lang => typeof x[lang] === 'string' && x[lang].trim());
assert(bank.questions.length === 80 && bank.rounds.length === 10, 'Exactly 80 questions in 10 rounds required');
const ids = new Set(), prompts = new Set();
for (const q of bank.questions) {
  assert(!ids.has(q.id), `Duplicate ID: ${q.id}`); ids.add(q.id);
  // Visual prompts can share a template, but cannot reuse the same subject.
  const content = `${q.prompt.he}:${q.media || ''}`;
  assert(!prompts.has(content), `Repeated question: ${q.id}`); prompts.add(content);
  for (const field of ['prompt','fact']) assert(bilingual(q[field]), `${q.id}: missing ${field} translation`);
  assert(q.options.length === 3 && q.options.every(bilingual), `${q.id}: three bilingual options required`);
  for (const lang of ['he','ru']) assert(new Set(q.options.map(o => o[lang])).size === 3, `${q.id}: duplicate options in ${lang}`);
  assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 3, `${q.id}: exactly one correct answer index required`);
  assert(bilingual(bank.categories[q.category]), `${q.id}: unknown subject domain`);
  const checked = review.questions.find(r => r.id === q.id);
  assert(checked?.answerReviewed && checked?.factReviewed && checked?.translationReviewed, `${q.id}: editorial review required`);
  assert(q.sources.every(url => checked.sources.some(id => review.sources.some(r => r.id === id && r.url === url))), `${q.id}: source review must cover question sources`);
  assert(q.sources.length && q.sources.every(url => new URL(url).protocol === 'https:'), `${q.id}: factual sources required`);
  if (q.media) {
    assert(bilingual(q.alt) && bilingual(q.accessiblePrompt), `${q.id}: neutral alt and accessible parallel question required`);
    for (const lang of ['he','ru']) assert(media.some(m => m.id === (q.media.startsWith('map-') ? q.media + '-' + lang : q.media)), `${q.id}: missing local media`);
  }
}
const assigned = [];
for (const r of bank.rounds) {
  assert(r.questionIds.length === 8 && new Set(r.questionIds).size === 8, `Round ${r.id}: eight distinct questions required`);
  const qs = r.questionIds.map(id => bank.questions.find(q => q.id === id));
  assert(qs.every(q => q && q.round === r.id), `Round ${r.id}: invalid assignment`);
  assert(new Set(qs.map(q => q.category)).size >= 4, `Round ${r.id}: at least four domains required`);
  assert(r.remember.length === 2 && new Set(r.remember).size === 2 && r.remember.every(id => r.questionIds.includes(id)), `Round ${r.id}: two facts required`);
  assigned.push(...r.questionIds);
}
assert(assigned.length === 80 && new Set(assigned).size === 80, 'Each authored question must occur exactly once');
for (const m of media) {
  assert(m.creator && m.source && m.license && m.modifications, `Missing media credit: ${m.id}`);
  const bytes = fs.readFileSync(path.join(root,m.path));
  assert(crypto.createHash('sha256').update(bytes).digest('hex') === m.sha256, `Changed asset hash: ${m.id}`);
}
fs.writeFileSync(path.join(root,'atlas/questions.js'), '// Generated from questions.json by scripts/build-atlas.mjs. Edit the JSON.\nwindow.AtlasQuestions = '+JSON.stringify(bank)+';\n');
fs.writeFileSync(path.join(root,'atlas/media.js'), '// Generated from media.json by scripts/build-atlas.mjs.\nwindow.AtlasMedia = '+JSON.stringify(media)+';\n');
const credits = '# Curiosity Atlas media credits\n\nEach file was reviewed individually on 2026-11-21. Photos are proportional web copies; no generative alteration. CC BY-SA copies retain their corresponding licence.\n\n'+media.map(m=>`## ${m.id}\n\n- Local: [${m.path}](../${m.path})\n- Source: ${m.source}\n- Creator: ${m.creator}\n- Licence: ${m.license}${m.licenseUrl?' — '+m.licenseUrl:''}\n- Changes: ${m.modifications}\n`).join('\n')+'\n## PaperCSS\n\nCard borders and button interaction adapted from https://github.com/papercss/papercss at b341c1606fca5b3880307d779414f43a5ccbc9b6. ISC, copyright (c) 2017–2018 Rhyne Vlaservich. Full licence: [LICENSE.md](../vendor/papercss/LICENSE.md). Only scoped adaptations are included.\n';
fs.writeFileSync(path.join(root,'atlas/CREDITS.md'),credits);
console.log(`Atlas validated: ${bank.rounds.length} × 8 = ${ids.size} unique questions; ${media.length} local, credited assets.`);
