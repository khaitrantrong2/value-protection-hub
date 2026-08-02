/**
 * Value Protection Hub — Links API
 *
 * A bound Google Apps Script Web App that reads the private Google Sheet
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
  // Serve a 60-second server cache so repeat hits skip re-reading the sheet (faster response).
  var cache = CacheService.getScriptCache();
  var cached = cache.get("vph_payload_v1");
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
    cache.put("vph_payload_v1", json, 60); // edits show within ~1 minute
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
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
