import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { catalogs } from './localeHarness.mjs';
import { reactive } from 'vue';

async function load(path) {
  const result = await build({ entryPoints: [fileURLToPath(new URL(path, import.meta.url))], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const { atlasDemo } = await load('../src/data/atlasDemo.ts');
const api = await load('../src/services/atlasTranslationService.ts');
const { ATLAS_TRANSLATABLE_FIELDS } = await load('../src/types/atlasTranslations.ts');
function field(entity, path) { return path.split('.').reduce((value, key) => value?.[key], entity); }
async function overlay(entity, type, locale = 'vi') {
  const sourceFingerprint = await api.atlasSourceFingerprint(entity);
  return ATLAS_TRANSLATABLE_FIELDS[type].filter(path => { const value = field(entity, path); return typeof value === 'string' ? !!value.trim() : Array.isArray(value) && value.length; }).map(path => {
    const value = field(entity, path);
    return { entityType: type, entityId: entity.id, field: path, locale, text: Array.isArray(value) ? JSON.stringify(value.map((_, i) => `Bản dịch ${i}`)) : `Bản dịch ${path}`, sourceFingerprint, reviewStatus: 'Reviewed', publication: 'Published', visibility: 'Public' };
  });
}

test('All UI catalogs have complete EN/VI key parity, including mobile/error states', () => {
  const keys = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => typeof child === 'string' ? [`${prefix}${key}`] : keys(child, `${prefix}${key}.`)).sort();
  assert.deepEqual(keys(catalogs.en), keys(catalogs.vi));
});

test('Complete current reviewed overlay translates a whole record without changing source identity or control state', async () => {
  const source = structuredClone(atlasDemo), original = structuredClone(source);
  source.translations = await overlay(source.stages[0], 'stage');
  const result = await api.localizeAtlasPayload(source, 'vi');
  assert.equal(result.data.stages[0].title, 'Bản dịch title');
  assert.equal(result.data.stages[0].id, original.stages[0].id);
  assert.equal(result.data.stages[0].practiceState, original.stages[0].practiceState);
  assert.deepEqual(source.stages, original.stages);
  assert.deepEqual(result.data.controls, original.controls);
  assert.ok(result.translatedKeys.has('stage:01'));
});

test('Reviewed overlays work on the actual Vue-reactive payload without DataCloneError or source mutation', async () => {
  const source = reactive(structuredClone(atlasDemo));
  source.translations = await overlay(source.stages[0], 'stage');
  const original = source.stages[0].title;
  const result = await api.localizeAtlasPayload(source, 'vi');
  assert.equal(result.data.stages[0].title, 'Bản dịch title');
  assert.equal(source.stages[0].title, original);
});

test('Missing, stale, duplicate, unreviewed and invalid-array translations all retain the entire source record', async () => {
  for (const kind of ['missing','stale','duplicate','unreviewed','array','wrong-locale']) {
    const source = structuredClone(atlasDemo);
    const rows = await overlay(source.stages[0], 'stage');
    if (kind === 'missing') rows.pop();
    if (kind === 'stale') rows[0].sourceFingerprint = `sha256:${'0'.repeat(64)}`;
    if (kind === 'duplicate') rows.push({ ...rows[0] });
    if (kind === 'unreviewed') rows[0].reviewStatus = 'Draft';
    if (kind === 'array') { const row = rows.find(row => row.field === 'raci.responsible'); row.text = 'not a JSON array'; }
    if (kind === 'wrong-locale') rows.forEach(row => row.locale = 'en');
    source.translations = rows;
    const result = await api.localizeAtlasPayload(source, 'vi');
    assert.deepEqual(result.data.stages[0], source.stages[0], kind);
    assert.equal(result.translatedKeys.has('stage:01'), false, kind);
  }
});

test('Translation boundary rejects IDs, URLs, evidence locations, states and nonpublic records', async () => {
  const [row] = await overlay(atlasDemo.controls[0], 'control');
  for (const field of ['id','evidenceLocation','practiceState','evidenceState','url','stageId','contentVersion']) assert.deepEqual(api.parseAtlasTranslations([{ ...row, field }]), []);
  for (const change of [{ visibility: 'Internal' }, { publication: 'Draft' }, { text: '' }, { locale: 'fr' }]) assert.deepEqual(api.parseAtlasTranslations([{ ...row, ...change }]), []);
  assert.deepEqual(api.parseAtlasTranslations(Array(1001).fill(row)), []);
});
