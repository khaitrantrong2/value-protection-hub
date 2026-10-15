/**
 * Value Protection Hub — Links and Process Atlas API
 *
 * A bound Google Apps Script Web App that reads the configured Google Sheet
 * and returns Links / Categories / Config as JSON for the frontend.
 *
 * Deploy: Deploy > New deployment > Web app.
 *   - Execute as: Me
 *   - Who has access: choose per your security policy (see README.md)
 *
 * Expected tabs:
 *   Links       (required)  — columns listed in LINK_COLUMNS below
 *   Categories  (optional)  — Category, Description, Color, Icon, SortOrder
 *   Config      (optional)  — Key, Value
 *   Portfolio   (optional)  — Member, Country, Brand, Class, Complexity, Platforms
 *                             (Platforms = comma-separated, e.g. "Lazada, Shopee, Tiktok")
 *   AtlasStages / AtlasControls / AtlasReferences / AtlasConfig — separate action=atlas
 *     route with allowlisted fields and explicit Public + Published rows only.
 *     Publication and evidence-location labels do not assert control effectiveness.
 * Web App source: set Script Property VPH_SPREADSHEET_ID; no request parameter selects a file.
 */

var LINK_COLUMNS = [
  "ID",
  "Category",
  "Title",
  "Description",
  "URL",
  "Owner",
  "Country",
  "Status",
  "Tags",
  "AccessNote",
  "Criticality",
  "SortOrder",
  "IsActive",
  "LastUpdated",
];

function doGet(e) {
  if (e && e.parameter && e.parameter.action === "atlas") return doGetAtlas_();
  var sourceID = getSourceSpreadsheetId_();
  var cacheKey = sourceID ? "vph_payload_v1:" + sourceID : "vph_payload_v1";
  // Serve a 60-second server cache so repeat hits skip re-reading the sheet (faster response).
  var cache = CacheService.getScriptCache();
  var cached = cache.get(cacheKey);
  if (cached) {
    return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
  }

  var payload = {
    links: getLinks(),
    categories: getCategories(),
    config: getConfig(),
    portfolio: getPortfolio(),
  };
  var json = JSON.stringify(payload);
  try {
    cache.put(cacheKey, json, 60); // edits show within ~1 minute; source changes use a separate key
  } catch (err) {
    // payload > 100KB — skip caching, still return fresh
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/** Reads the "Links" tab and returns active rows as objects. */
function getLinks() {
  var rows = readSheet("Links");
  if (!rows.length) return [];

  return rows
    .filter(function (row) {
      return isTrue(row.IsActive);
    })
    .map(function (row) {
      var obj = {};
      LINK_COLUMNS.forEach(function (col) {
        obj[col] = row[col] !== undefined ? row[col] : "";
      });
      return obj;
    });
}

/** Reads the optional "Categories" tab. Returns [] if the tab is missing. */
function getCategories() {
  return readSheet("Categories");
}

/**
 * Reads the per-member claimback scope. Flexible about tab name (any sheet whose
 * name contains "portfolio") and column names (matches by normalized header, so
 * "Member/Owner/Protector", "Complexity/Stream", "In Scope Platforms/Platforms" all work).
 */
function getPortfolio() {
  var sheet = findSheetLike_("portfolio");
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(normalizeHeader_);
  var iMember = colIndex_(headers, ["member", "owner", "protector", "name", "staff", "person"]);
  var iCountry = colIndex_(headers, ["country", "market"]);
  var iBrand = colIndex_(headers, ["brand"]);
  var iClass = colIndex_(headers, ["class"]);
  var iComplexity = colIndex_(headers, ["complexity", "stream"]);
  var iPlatforms = colIndex_(headers, ["platforms", "inscopeplatforms", "platform"]);

  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var member = iMember >= 0 ? normalizeCell(row[iMember]) : "";
    member = member === null || member === undefined ? "" : String(member).trim();
    if (!member) continue;
    out.push({
      Member: member,
      Country: iCountry >= 0 ? String(normalizeCell(row[iCountry]) || "").trim() : "",
      Brand: iBrand >= 0 ? String(normalizeCell(row[iBrand]) || "").trim() : "",
      Class: iClass >= 0 ? String(normalizeCell(row[iClass]) || "").trim() : "",
      Complexity: iComplexity >= 0 ? String(normalizeCell(row[iComplexity]) || "").trim() : "",
      Platforms: iPlatforms >= 0 ? String(normalizeCell(row[iPlatforms]) || "").trim() : "",
    });
  }
  return out;
}

function normalizeHeader_(h) {
  return String(h)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function colIndex_(headers, aliases) {
  for (var i = 0; i < headers.length; i++) {
    if (aliases.indexOf(headers[i]) >= 0) return i;
  }
  return -1;
}

/** Finds a sheet named exactly, else the first whose name contains the keyword (case-insensitive). */
function findSheetLike_(keyword) {
  var ss = getSourceSpreadsheet_();
  var exact = ss.getSheetByName("Portfolio");
  if (exact) return exact;
  var all = ss.getSheets();
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].getName()).toLowerCase().indexOf(keyword) >= 0) return all[i];
  }
  return null;
}

/**
 * Reads the optional "Config" tab into an array of {Key, Value}.
 * AdminSheetUrl is only returned if it is explicitly configured — never
 * expose the edit URL of the source sheet by default.
 */
function getConfig() {
  var rows = readSheet("Config");
  if (!rows.length) return [];

  return rows
    .filter(function (row) {
      return row.Key;
    })
    .map(function (row) {
      return { Key: String(row.Key).trim(), Value: row.Value !== undefined ? String(row.Value).trim() : "" };
    });
}

/** Generic reader: first row is the header, remaining rows become keyed objects. */
function readSheet(sheetName) {
  var sheet = getSourceSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) return [];

  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (h) {
    return String(h).trim();
  });

  var out = [];
  for (var r = 1; r < values.length; r++) {
    var rowValues = values[r];
    var isEmpty = rowValues.every(function (cell) {
      return cell === "" || cell === null;
    });
    if (isEmpty) continue;

    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      obj[headers[c]] = normalizeCell(rowValues[c]);
    }
    out.push(obj);
  }
  return out;
}

function normalizeCell(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return value;
}

function isTrue(value) {
  if (value === true) return true;
  if (value === false) return false;
  return String(value).trim().toUpperCase() === "TRUE";
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Web App executions cannot rely on a bound editor's active spreadsheet context. */
function getSourceSpreadsheetId_() {
  try {
    var id = PropertiesService.getScriptProperties().getProperty("VPH_SPREADSHEET_ID");
    if (id === null || id === "") return "";
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{20,150}$/.test(id)) throw new Error();
    return id;
  } catch (err) {
    throw new Error("Source spreadsheet is not configured or accessible.");
  }
}

function getSourceSpreadsheet_() {
  var id = getSourceSpreadsheetId_();
  try {
    // The fallback supports editor calls only; deployed Web Apps must configure the property.
    var spreadsheet = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error();
    return spreadsheet;
  } catch (err) {
    throw new Error("Source spreadsheet is not configured or accessible.");
  }
}

/** Atlas content is public only after an explicit publication decision in the source Sheet. */
var ATLAS_STAGE_IDS = ["01", "02", "03", "04", "05", "06", "07", "08", "A", "B"];
var ATLAS_COLUMNS = {
  AtlasStages: ["ID", "Kind", "Order", "ShortTitle", "Title", "BusinessQuestion", "RoleTag", "Supplier", "Input", "Process", "Output", "Customer", "Accountable", "Responsible", "Consulted", "Informed", "Narrative", "Caution", "Fork", "Applicability", "PracticeState", "Pipeline", "Supports", "ReferenceIDs", "Publication", "Visibility", "ContentVersion", "EffectiveFrom", "UpdatedAt", "SourceBasis"],
  AtlasControls: ["ID", "StageID", "Title", "WCGW", "Assertions", "Nature", "Frequency", "OwnerRole", "PracticeState", "EvidenceLocation", "EvidenceState", "Limitation", "Publication", "Visibility", "ContentVersion", "SourceBasis"],
  AtlasReferences: ["ID", "StageID", "Order", "Group", "Title", "Body", "Applicability", "URL", "PracticeState", "Publication", "Visibility", "ContentVersion"],
  AtlasConfig: ["Key", "Value", "Publication", "Visibility"],
};
var ATLAS_PUBLIC_HOSTS = ["standards.auasb.gov.au", "docs.oracle.com", "ifrs.org", "www.ifrs.org", "iso.org", "www.iso.org", "developers.google.com", "gsap.com"];

function atlasInvalid_() {
  var error = new Error("Invalid Atlas content");
  error.atlasCode = "ATLAS_INVALID";
  throw error;
}

function atlasText_(value, limit, required) {
  if (value === undefined || value === null || value === "") {
    if (required) atlasInvalid_();
    return "";
  }
  if (typeof value !== "string") atlasInvalid_();
  var text = value.trim();
  if (text.length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) || (required && !text)) atlasInvalid_();
  return text;
}

function atlasEnum_(value, allowed) {
  var text = atlasText_(value, 80, true);
  if (allowed.indexOf(text) < 0) atlasInvalid_();
  return text;
}

function atlasList_(value, separator, itemLimit, countLimit) {
  var text = atlasText_(value, 6000, false);
  if (!text) return [];
  var items = text.split(separator).map(function (item) { return atlasText_(item, itemLimit, true); });
  if (items.length > countLimit || new Set(items).size !== items.length) atlasInvalid_();
  return items;
}

function atlasID_(value) {
  var id = atlasText_(value, 64, true);
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) atlasInvalid_();
  return id;
}

function atlasStageID_(value) {
  return atlasEnum_(value, ATLAS_STAGE_IDS);
}

function atlasDate_(value) {
  if (value instanceof Date) value = normalizeCell(value);
  var text = atlasText_(value, 10, false);
  if (text) {
    var date = new Date(text + "T00:00:00Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== text) atlasInvalid_();
  }
  return text;
}

function atlasOrder_(value) {
  if ((typeof value !== "number" && typeof value !== "string") || (typeof value === "string" && !/^\d+$/.test(value.trim()))) atlasInvalid_();
  var order = Number(value);
  if (!Number.isInteger(order) || order < 1 || order > 9999) atlasInvalid_();
  return order;
}

function atlasPublicURL_(value) {
  var text = atlasText_(value, 1000, false);
  if (!text) return "";
  var match = /^https:\/\/([a-z0-9.-]+)(?:[/?#][^\s"'<>\\]*)?$/i.exec(text);
  if (!match || ATLAS_PUBLIC_HOSTS.indexOf(match[1].toLowerCase()) < 0) atlasInvalid_();
  return text;
}

function atlasEvidenceLabel_(value) {
  var text = atlasText_(value, 1200, false);
  if (/[a-z][a-z0-9+.-]*:\/\/|(?:^|\s)www\.|[A-Za-z]:[\\/]|\\\\|(?:^|\s)\/\//i.test(text)) atlasInvalid_();
  return text;
}

function atlasPublishedRows_(sheetName) {
  var sheet = getSourceSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) atlasInvalid_();
  var rowCount = sheet.getLastRow();
  var colCount = sheet.getLastColumn();
  if (rowCount < 1 || rowCount > 1001 || colCount < 1 || colCount > 60) atlasInvalid_();
  var values = sheet.getRange(1, 1, rowCount, colCount).getValues();
  var headers = values[0].map(function (value) { return String(value).trim(); });
  var columns = ATLAS_COLUMNS[sheetName];
  columns.forEach(function (column) {
    if (headers.indexOf(column) < 0 || headers.indexOf(column) !== headers.lastIndexOf(column)) atlasInvalid_();
  });
  var publication = headers.indexOf("Publication");
  var visibility = headers.indexOf("Visibility");
  return values.slice(1).filter(function (row) {
    return row[publication] === "Published" && row[visibility] === "Public";
  }).map(function (row) {
    var out = {};
    columns.forEach(function (column) { out[column] = row[headers.indexOf(column)]; });
    return out;
  });
}

function atlasStage_(row) {
  var id = atlasStageID_(row.ID);
  var kind = atlasEnum_(row.Kind, ["chapter", "supporting"]);
  if (kind !== (id === "A" || id === "B" ? "supporting" : "chapter")) atlasInvalid_();
  return {
    id: id,
    kind: kind,
    order: atlasOrder_(row.Order),
    shortTitle: atlasText_(row.ShortTitle, 80, true),
    title: atlasText_(row.Title, 240, true),
    businessQuestion: atlasText_(row.BusinessQuestion, 600, false),
    roleTag: atlasText_(row.RoleTag, 240, false),
    sipoc: {
      supplier: atlasText_(row.Supplier, 2000, false),
      input: atlasText_(row.Input, 2000, false),
      process: atlasText_(row.Process, 3000, false),
      output: atlasText_(row.Output, 2000, false),
      customer: atlasText_(row.Customer, 2000, false),
    },
    raci: {
      accountable: atlasText_(row.Accountable, 240, false),
      responsible: atlasList_(row.Responsible, "|", 240, 30),
      consulted: atlasList_(row.Consulted, "|", 240, 30),
      informed: atlasList_(row.Informed, "|", 240, 30),
    },
    narrative: atlasText_(row.Narrative, 6000, false),
    caution: atlasText_(row.Caution, 3000, false),
    fork: atlasEnum_(row.Fork, ["none", "parallel", "settlement-route", "qo-mode"]),
    applicability: atlasText_(row.Applicability, 1600, false),
    practiceState: atlasEnum_(row.PracticeState, ["reported", "proposed", "develop"]),
    pipeline: atlasList_(row.Pipeline, /\r?\n/, 600, 30),
    supports: atlasList_(row.Supports, "|", 2, 10).map(atlasStageID_),
    referenceIds: atlasList_(row.ReferenceIDs, "|", 64, 100).map(atlasID_),
    contentVersion: atlasText_(row.ContentVersion, 80, false),
    effectiveFrom: atlasDate_(row.EffectiveFrom),
    updatedAt: atlasDate_(row.UpdatedAt),
    sourceBasis: atlasText_(row.SourceBasis, 1600, false),
  };
}

function atlasControl_(row) {
  return {
    id: atlasID_(row.ID),
    stageId: atlasStageID_(row.StageID),
    title: atlasText_(row.Title, 240, true),
    wcgw: atlasText_(row.WCGW, 2000, false),
    assertions: atlasList_(row.Assertions, "|", 160, 20),
    nature: atlasEnum_(row.Nature, ["preventive", "detective", "mixed"]),
    frequency: atlasText_(row.Frequency, 240, false),
    ownerRole: atlasText_(row.OwnerRole, 240, false),
    practiceState: atlasEnum_(row.PracticeState, ["reported", "proposed", "develop"]),
    evidenceLocation: atlasEvidenceLabel_(row.EvidenceLocation),
    evidenceState: atlasEnum_(row.EvidenceState, ["to-locate", "located"]),
    limitation: atlasText_(row.Limitation, 3000, false),
    contentVersion: atlasText_(row.ContentVersion, 80, false),
    sourceBasis: atlasText_(row.SourceBasis, 1600, false),
  };
}

function atlasReference_(row) {
  return {
    id: atlasID_(row.ID),
    stageId: row.StageID === "" ? "" : atlasStageID_(row.StageID),
    order: atlasOrder_(row.Order),
    group: atlasEnum_(row.Group, ["reason-code", "document-step", "settlement-route", "escalation", "kpi", "record", "pipeline-step", "guidance"]),
    title: atlasText_(row.Title, 240, true),
    body: atlasText_(row.Body, 4000, false),
    applicability: atlasText_(row.Applicability, 1600, false),
    url: atlasPublicURL_(row.URL),
    practiceState: atlasEnum_(row.PracticeState, ["reported", "proposed", "develop"]),
    contentVersion: atlasText_(row.ContentVersion, 80, false),
  };
}

function atlasMeta_(rows) {
  var allowed = ["ContentVersion", "ProcessStatus", "EffectiveFrom", "UpdatedAt", "Subtitle"];
  var config = Object.create(null);
  rows.forEach(function (row) {
    if (allowed.indexOf(row.Key) < 0) return;
    if (Object.prototype.hasOwnProperty.call(config, row.Key)) atlasInvalid_();
    config[row.Key] = row.Key === "EffectiveFrom" || row.Key === "UpdatedAt"
      ? atlasDate_(row.Value)
      : atlasText_(row.Value, row.Key === "ContentVersion" ? 80 : 600, false);
  });
  return {
    contentVersion: config.ContentVersion || "",
    processStatus: config.ProcessStatus || "",
    effectiveFrom: config.EffectiveFrom || "",
    updatedAt: config.UpdatedAt || "",
    generatedAt: new Date().toISOString(),
    subtitle: config.Subtitle || "",
  };
}

function atlasUniqueIDs_(items) {
  var ids = new Set();
  items.forEach(function (item) {
    if (ids.has(item.id)) atlasInvalid_();
    ids.add(item.id);
  });
  return ids;
}

/** The Atlas route never caches, so a refresh reads the latest publication decisions. */
function doGetAtlas_() {
  try {
    var stages = atlasPublishedRows_("AtlasStages").map(atlasStage_);
    var controls = atlasPublishedRows_("AtlasControls").map(atlasControl_);
    var references = atlasPublishedRows_("AtlasReferences").map(atlasReference_);
    if (stages.length > 10 || controls.length > 500 || references.length > 500) atlasInvalid_();
    var stageIDs = atlasUniqueIDs_(stages);
    var referenceIDs = atlasUniqueIDs_(references);
    atlasUniqueIDs_(controls);
    stages.forEach(function (stage) {
      stage.supports.forEach(function (id) { if (!stageIDs.has(id)) atlasInvalid_(); });
      stage.referenceIds.forEach(function (id) { if (!referenceIDs.has(id)) atlasInvalid_(); });
    });
    controls.forEach(function (control) { if (!stageIDs.has(control.stageId)) atlasInvalid_(); });
    references.forEach(function (reference) { if (reference.stageId && !stageIDs.has(reference.stageId)) atlasInvalid_(); });
    stages.sort(function (a, b) { return a.order - b.order || a.id.localeCompare(b.id); });
    references.sort(function (a, b) { return a.order - b.order || a.id.localeCompare(b.id); });
    var payload = {
      schemaVersion: 1,
      meta: atlasMeta_(atlasPublishedRows_("AtlasConfig")),
      stages: stages,
      controls: controls,
      references: references,
    };
    if (JSON.stringify(payload).length > 500000) atlasInvalid_();
    return jsonResponse({ ok: true, atlas: payload });
  } catch (err) {
    // No row contents, sheet identifiers or internal exception details cross the API boundary.
    return jsonResponse({
      ok: false,
      error: { code: err && err.atlasCode === "ATLAS_INVALID" ? "ATLAS_INVALID" : "ATLAS_UNAVAILABLE", message: "Atlas content could not be loaded." },
    });
  }
}
