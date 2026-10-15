import { ATLAS_STAGE_IDS } from "../types/atlas";
import type { AtlasControl, AtlasPayload, AtlasReference, AtlasStage } from "../types/atlas";

const INVALID_DATA = "Dữ liệu Atlas không hợp lệ. Kiểm tra nội dung đã publish trong Google Sheet.";
const UNAVAILABLE = "Không tải được Atlas. Kiểm tra kết nối rồi thử lại.";
const UNSUPPORTED = "API chưa hỗ trợ Atlas. Cần cập nhật Apps Script.";
const INVALID_URL = "Địa chỉ API Atlas không hợp lệ.";
const TIMEOUT = "Yêu cầu tải Atlas hết thời gian. Thử refresh lại.";
const PUBLIC_HOSTS = ["standards.auasb.gov.au", "docs.oracle.com", "ifrs.org", "www.ifrs.org", "iso.org", "www.iso.org", "developers.google.com", "gsap.com"];
const PRACTICE_STATES = ["reported", "proposed", "develop"] as const;
const MAX_BODY_BYTES = 2_000_000;
const MAX_JSON_CHARS = 500_100;

function invalid(): never { throw new Error(INVALID_DATA); }

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}

function text(value: unknown, limit: number, required = false): string {
  if (typeof value !== "string") invalid();
  const result = value.trim();
  if (result.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result) || (required && !result)) invalid();
  return result;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[]): T {
  const result = text(value, 80, true);
  if (!allowed.includes(result as T)) invalid();
  return result as T;
}

function list(value: unknown, itemLimit: number, countLimit: number): string[] {
  if (!Array.isArray(value) || value.length > countLimit) invalid();
  const result = value.map((item: unknown) => text(item, itemLimit, true));
  if (new Set(result).size !== result.length) invalid();
  return result;
}

function id(value: unknown): string {
  const result = text(value, 64, true);
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(result)) invalid();
  return result;
}

function date(value: unknown): string {
  const result = text(value, 10);
  if (result) {
    const parsed = new Date(`${result}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) invalid();
  }
  return result;
}

function generatedAt(value: unknown): string {
  const result = text(value, 30);
  if (result && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(result) || !Number.isFinite(Date.parse(result)) || new Date(result).toISOString() !== result)) invalid();
  return result;
}

function order(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 9999) invalid();
  return value;
}

function publicURL(value: unknown): string {
  const result = text(value, 1000);
  if (!result) return "";
  const match = /^https:\/\/([a-z0-9.-]+)(?:[/?#][^\s"'<>\\]*)?$/i.exec(result);
  if (!match || !PUBLIC_HOSTS.includes(match[1].toLowerCase())) invalid();
  return result;
}

function evidenceLabel(value: unknown): string {
  const result = text(value, 1200);
  if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|\s)www\.|[A-Za-z]:[\\/]|\\\\|(?:^|\s)\/\//i.test(result)) invalid();
  return result;
}

function stage(value: unknown): AtlasStage {
  const row = record(value), sipoc = record(row.sipoc), raci = record(row.raci);
  const stageId = enumValue(row.id, ATLAS_STAGE_IDS);
  const kind = enumValue(row.kind, ["chapter", "supporting"] as const);
  if (kind !== (stageId === "A" || stageId === "B" ? "supporting" : "chapter")) invalid();
  return {
    id: stageId, kind, order: order(row.order),
    shortTitle: text(row.shortTitle, 80, true), title: text(row.title, 240, true),
    businessQuestion: text(row.businessQuestion, 600), roleTag: text(row.roleTag, 240),
    sipoc: { supplier: text(sipoc.supplier, 2000), input: text(sipoc.input, 2000), process: text(sipoc.process, 3000), output: text(sipoc.output, 2000), customer: text(sipoc.customer, 2000) },
    raci: { accountable: text(raci.accountable, 240), responsible: list(raci.responsible, 240, 30), consulted: list(raci.consulted, 240, 30), informed: list(raci.informed, 240, 30) },
    narrative: text(row.narrative, 6000), caution: text(row.caution, 3000),
    fork: enumValue(row.fork, ["none", "parallel", "settlement-route", "qo-mode"] as const),
    applicability: text(row.applicability, 1600), practiceState: enumValue(row.practiceState, PRACTICE_STATES),
    pipeline: list(row.pipeline, 600, 30), supports: list(row.supports, 2, 10).map((value) => enumValue(value, ATLAS_STAGE_IDS)),
    referenceIds: list(row.referenceIds, 64, 100).map(id), contentVersion: text(row.contentVersion, 80),
    effectiveFrom: date(row.effectiveFrom), updatedAt: date(row.updatedAt), sourceBasis: text(row.sourceBasis, 1600),
  };
}

function control(value: unknown): AtlasControl {
  const row = record(value);
  return {
    id: id(row.id), stageId: enumValue(row.stageId, ATLAS_STAGE_IDS), title: text(row.title, 240, true),
    wcgw: text(row.wcgw, 2000), assertions: list(row.assertions, 160, 20),
    nature: enumValue(row.nature, ["preventive", "detective", "mixed"] as const), frequency: text(row.frequency, 240),
    ownerRole: text(row.ownerRole, 240), practiceState: enumValue(row.practiceState, PRACTICE_STATES),
    evidenceLocation: evidenceLabel(row.evidenceLocation), evidenceState: enumValue(row.evidenceState, ["to-locate", "located"] as const),
    limitation: text(row.limitation, 3000), contentVersion: text(row.contentVersion, 80), sourceBasis: text(row.sourceBasis, 1600),
  };
}

function reference(value: unknown): AtlasReference {
  const row = record(value);
  return {
    id: id(row.id), stageId: row.stageId === "" ? "" : enumValue(row.stageId, ATLAS_STAGE_IDS), order: order(row.order),
    group: enumValue(row.group, ["reason-code", "document-step", "settlement-route", "escalation", "kpi", "record", "pipeline-step", "guidance"] as const),
    title: text(row.title, 240, true), body: text(row.body, 4000), applicability: text(row.applicability, 1600),
    url: publicURL(row.url), practiceState: enumValue(row.practiceState, PRACTICE_STATES), contentVersion: text(row.contentVersion, 80),
  };
}

function rows<T>(value: unknown, limit: number, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value) || value.length > limit) invalid();
  return value.map(parse);
}

function uniqueIDs(items: { id: string }[]): Set<string> {
  const ids = new Set(items.map((item) => item.id));
  if (ids.size !== items.length) invalid();
  return ids;
}

/** Copy approved API fields into a fresh object; nothing from raw rows is spread into state. */
export function parseAtlasResponse(value: unknown): AtlasPayload {
  const response = record(value);
  if ("links" in response && response.ok === undefined && response.atlas === undefined) throw new Error(UNSUPPORTED);
  if (response.ok !== true) {
    const code = response.ok === false && response.error && typeof response.error === "object" ? record(response.error).code : "";
    throw new Error(code === "ATLAS_INVALID" ? INVALID_DATA : UNAVAILABLE);
  }
  const payload = record(response.atlas), meta = record(payload.meta);
  if (payload.schemaVersion !== 1) invalid();
  const stages = rows(payload.stages, 10, stage), controls = rows(payload.controls, 500, control), references = rows(payload.references, 500, reference);
  const stageIds = uniqueIDs(stages), referenceIds = uniqueIDs(references);
  uniqueIDs(controls);
  for (const stage of stages) {
    if (stage.supports.some((value) => !stageIds.has(value)) || stage.referenceIds.some((value) => !referenceIds.has(value))) invalid();
  }
  if (controls.some((value) => !stageIds.has(value.stageId)) || references.some((value) => value.stageId && !stageIds.has(value.stageId))) invalid();
  stages.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  references.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const result: AtlasPayload = {
    schemaVersion: 1,
    meta: { contentVersion: text(meta.contentVersion, 80), processStatus: text(meta.processStatus, 600), effectiveFrom: date(meta.effectiveFrom), updatedAt: date(meta.updatedAt), generatedAt: generatedAt(meta.generatedAt), subtitle: text(meta.subtitle, 600) },
    stages, controls, references,
  };
  if (JSON.stringify(result).length > 500000) invalid();
  return result;
}

function requestURL(apiUrl: string): string {
  try {
    if (typeof apiUrl !== "string" || !apiUrl.trim() || apiUrl.length > 2048) throw new Error();
    const url = new URL(apiUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || /^(?:localhost|[\d.]+)$|\.(?:localhost|local|internal)$|[\[\]:]/i.test(url.hostname)) throw new Error();
    url.searchParams.set("action", "atlas");
    return url.toString();
  } catch {
    throw new Error(INVALID_URL);
  }
}

async function readJSON(response: Response): Promise<unknown> {
  const announcedLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(announcedLength) && announcedLength > MAX_BODY_BYTES) invalid();
  let body = "";
  if (response.body) {
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let bytes = 0;
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BODY_BYTES) invalid();
        body += decoder.decode(chunk.value, { stream: true });
        if (body.length > MAX_JSON_CHARS) invalid();
      }
      body += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  } else {
    body = await response.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) invalid();
  }
  if (body.length > MAX_JSON_CHARS) invalid();
  try { return JSON.parse(body) as unknown; } catch { return invalid(); }
}

function abortError(): Error {
  const error = new Error("Đã hủy yêu cầu tải Atlas.");
  error.name = "AbortError";
  return error;
}

/** The legacy endpoint URL is reused; Atlas has its own uncached action and strict parser. */
export async function fetchAtlas(apiUrl: string, signal?: AbortSignal): Promise<AtlasPayload> {
  const url = requestURL(apiUrl);
  if (signal?.aborted) throw abortError();
  const controller = new AbortController();
  let timedOut = false;
  let rejectInterrupted!: (reason: Error) => void;
  const interruption = new Promise<never>((_, reject) => { rejectInterrupted = reject; });
  const cancel = () => { controller.abort(); rejectInterrupted(abortError()); };
  signal?.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
    rejectInterrupted(new Error(TIMEOUT));
  }, 20_000);
  try {
    const request = (async () => {
      const response = await fetch(url, { method: "GET", cache: "no-store", credentials: "omit", signal: controller.signal });
      if (!response.ok) throw new Error(UNAVAILABLE);
      return parseAtlasResponse(await readJSON(response));
    })();
    return await Promise.race([request, interruption]);
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (timedOut) throw new Error(TIMEOUT);
    if (error instanceof Error && [INVALID_DATA, UNSUPPORTED, UNAVAILABLE].includes(error.message)) throw error;
    throw new Error(UNAVAILABLE);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    controller.abort();
  }
}
