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

/** Reads the optional "Portfolio" tab (per-member claimback scope). Returns [] if missing. */
function getPortfolio() {
  var rows = readSheet("Portfolio");
  if (!rows.length) return [];

  return rows
    .filter(function (row) {
      return row.Member;
    })
    .map(function (row) {
      return {
        Member: String(row.Member).trim(),
        Country: row.Country !== undefined ? String(row.Country).trim() : "",
        Brand: row.Brand !== undefined ? String(row.Brand).trim() : "",
        Class: row.Class !== undefined ? String(row.Class).trim() : "",
        Complexity: row.Complexity !== undefined ? String(row.Complexity).trim() : "",
        Platforms: row.Platforms !== undefined ? String(row.Platforms).trim() : "",
      };
    });
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
