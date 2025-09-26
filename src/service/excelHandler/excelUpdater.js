// Node >= 16
const { google } = require("googleapis");
const path = require("path");

// ---------- normalization helpers ----------
const KEY_NO_SECTION = "__NOSECTION__";

function normLabel(s) {
  return String(s ?? "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // strip zero-width
    .replace(/\s+/g, " ") // collapse spaces
    .trim()
    .toLowerCase();
}
const toRawKey = (section, col) => `${section || KEY_NO_SECTION}|${col || ""}`;
const toNormKey = (section, col) =>
  `${normLabel(section || KEY_NO_SECTION)}|${normLabel(col)}`;

// ---------- UI helpers you already had ----------
function columnNumberToLetter(n) {
  let s = "";
  while (n > 0) {
    let r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function ensureDateColumnTextFormat({
  sheets,
  spreadsheetId,
  sheetIdNumeric,
  dateColIndex,
}) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: sheetIdNumeric,
              startRowIndex: 0, // whole column (incl. headers)
              startColumnIndex: dateColIndex,
              endColumnIndex: dateColIndex + 1,
            },
            cell: { userEnteredFormat: { numberFormat: { type: "TEXT" } } },
            fields: "userEnteredFormat.numberFormat",
          },
        },
      ],
    },
  });
}

async function mergeSectionHeaders({
  sheets,
  spreadsheetId,
  sheetIdNumeric,
  headerOrder,
}) {
  if (!headerOrder || !headerOrder.length) return;

  const sections = headerOrder.map((rawKey) => {
    const [sec] = rawKey.split("|");
    return sec === KEY_NO_SECTION ? "" : sec;
  });

  // unmerge row 1
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          unmergeCells: {
            range: {
              sheetId: sheetIdNumeric,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: sections.length,
            },
          },
        },
      ],
    },
  });

  // merge contiguous identical section labels
  const requests = [];
  let start = 0;
  while (start < sections.length) {
    const label = sections[start];
    let end = start + 1;
    while (end < sections.length && sections[end] === label) end++;
    if (label) {
      requests.push({
        mergeCells: {
          range: {
            sheetId: sheetIdNumeric,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: start,
            endColumnIndex: end,
          },
          mergeType: "MERGE_ALL",
        },
      });
    }
    start = end;
  }

  if (requests.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });
  }
}

// ---------- MAIN ----------
async function upsertSectionedRows(
  data,
  sheetId,
  oauthJsonPath,
  sheetName,
  time,
  opts = {}
) {
  if (!Array.isArray(data) || data.length === 0)
    throw new Error("`data` must be a non-empty array.");
  const keyColumnName = opts.keyColumnName || "Date";

  const resolvedOauthPath = path.resolve(__dirname, oauthJsonPath);
  const auth = new google.auth.GoogleAuth({
    keyFile: resolvedOauthPath,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });

  // ensure sheet exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const sheetByTitle = (meta.data.sheets || []).find(
    (s) => s.properties && s.properties.title === sheetName
  );
  const sheetIdNumeric = sheetByTitle
    ? sheetByTitle.properties.sheetId
    : (
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: sheetName } } }],
          },
        })
      ).data.replies[0].addSheet.properties.sheetId;

  // read current grid
  const getRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:ZZ`,
    majorDimension: "ROWS",
  });
  const grid = getRes.data.values || [];
  const existingSectionRow = grid[0] || [];
  const existingColumnRow = grid[1] || [];

  // === Build lookup maps from the SHEET (authoritative) ===
  // Handle merged row-1: forward-fill the section label across the band
  const sectionRowRaw = existingSectionRow || [];
  const columnRowRaw = existingColumnRow || [];
  const maxHeaderLen = Math.max(sectionRowRaw.length, columnRowRaw.length);

  const sectionRowFF = [];
  let currentSection = "";
  for (let i = 0; i < maxHeaderLen; i++) {
    const raw = String(sectionRowRaw[i] || "").trim();
    if (raw) currentSection = raw;
    sectionRowFF[i] = currentSection; // propagate through merged band
  }

  // - existingByRaw:    rawKey -> index
  // - existingByNorm:   normKey -> { index, rawKey, sectionRaw, colRaw }
  const existingHeaderKeys = [];
  const existingByRaw = new Map();
  const existingByNorm = new Map();

  for (let i = 0; i < maxHeaderLen; i++) {
    const secRaw = sectionRowFF[i] || ""; // forward-filled section
    const colRaw = String(columnRowRaw[i] || "").trim();
    if (!(secRaw || colRaw)) continue;

    const rawKey = toRawKey(secRaw || KEY_NO_SECTION, colRaw);
    const normKey = toNormKey(secRaw || KEY_NO_SECTION, colRaw);

    if (!existingByRaw.has(rawKey)) {
      existingByRaw.set(rawKey, i);
      existingByNorm.set(normKey, {
        index: i,
        rawKey,
        sectionRaw: secRaw,
        colRaw,
      });
      existingHeaderKeys.push(rawKey);
    }
  }

  // === Discover truly new headers from incoming data using NORMALIZED matching ===
  const newHeaders = []; // [{section, col, rawKey, normKey}]
  const newByNorm = new Map();

  for (const row of data) {
    for (const cell of row) {
      if (!cell) continue;
      const section = (cell.section ?? cell.sectionName ?? "").toString();
      const colName = (cell.columnName ?? cell.conlumnName ?? "").toString();
      if (!colName) continue;

      const normKey = toNormKey(section || KEY_NO_SECTION, colName);
      if (existingByNorm.has(normKey) || newByNorm.has(normKey)) continue;

      const rawKey = toRawKey(section || KEY_NO_SECTION, colName);
      newByNorm.set(normKey, rawKey);
      newHeaders.push({
        section: section || "",
        col: colName,
        rawKey,
        normKey,
      });
    }
  }

  // === Build final header order (sheet order first, then new headers) ===
  const headerOrder = [
    ...existingHeaderKeys,
    ...newHeaders.map((h) => h.rawKey),
  ];
  const timeRawKey = toRawKey(KEY_NO_SECTION, "Time");
  let timeHeaderAdded = false;

  if (!headerOrder.includes(timeRawKey)) {
    headerOrder.push(timeRawKey);
    timeHeaderAdded = true;
  }
  // If we added headers, write them back (rows 1 & 2)
  if (newHeaders.length > 0 || timeHeaderAdded) {
    const sectionRow = [];
    const columnRow = [];
    for (const rawKey of headerOrder) {
      const [secRaw, col] = rawKey.split("|");
      sectionRow.push(secRaw === KEY_NO_SECTION ? "" : secRaw);
      columnRow.push(col);
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { majorDimension: "ROWS", values: [sectionRow, columnRow] },
    });

    // freeze headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetIdNumeric,
                gridProperties: { frozenRowCount: 2 },
              },
              fields: "gridProperties.frozenRowCount",
            },
          },
        ],
      },
    });
  }

  // merge top sections for nice UX
  await mergeSectionHeaders({
    sheets,
    spreadsheetId: sheetId,
    sheetIdNumeric,
    headerOrder,
  });

  // ---- Build header index (by RAW key) and date column index
  const headerIndexByRaw = new Map(headerOrder.map((k, i) => [k, i]));
  const dateRawKey = toRawKey(KEY_NO_SECTION, keyColumnName);
  const keyColIndex = headerIndexByRaw.get(dateRawKey);
  const timeColIndex = headerIndexByRaw.get(timeRawKey);

  if (keyColIndex === undefined)
    throw new Error(`Key column "${keyColumnName}" not found.`);

  // format Date column as TEXT
  await ensureDateColumnTextFormat({
    sheets,
    spreadsheetId: sheetId,
    sheetIdNumeric,
    dateColIndex: keyColIndex,
  });

  // ---- Build outgoing rows strictly by (section+column) normalized mapping
  const rowsBuilt = data.map((row) => {
    const out = new Array(headerOrder.length).fill("");
    for (const cell of row) {
      if (!cell) continue;
      const section = (cell.section ?? cell.sectionName ?? "").toString();
      const colName = (cell.columnName ?? cell.conlumnName ?? "").toString();
      if (!colName) continue;

      const normKey = toNormKey(section || KEY_NO_SECTION, colName);
      if (timeColIndex !== undefined) {
        out[timeColIndex] = time ?? "";
      }
      // Pick the sheet's RAW key if it exists, otherwise the new header's RAW key we planned
      const rawKey =
        (existingByNorm.get(normKey) && existingByNorm.get(normKey).rawKey) ||
        newByNorm.get(normKey) ||
        toRawKey(section || KEY_NO_SECTION, colName);

      const idx = headerIndexByRaw.get(rawKey);
      if (idx === undefined) continue;

      // Write Date exactly as provided (sheet column is TEXT already)
      out[idx] = cell.value ?? "";
    }
    return out;
  });

  // ---- Upsert by Date (overwrite if exists, append otherwise)
  const existingDataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A3:ZZ`,
    majorDimension: "ROWS",
  });
  const existingRows = existingDataRes.data.values || [];

  const existingRowByDate = new Map();
  for (let i = 0; i < existingRows.length; i++) {
    const k = ((existingRows[i] || [])[keyColIndex] ?? "")
      .toString()
      .replace(/^'/, "");
    if (k) existingRowByDate.set(k, 3 + i);
  }

  // de-dupe within the current payload (last one wins)
  const pendingByDate = new Map();
  for (const r of rowsBuilt) {
    const k = (r[keyColIndex] ?? "").toString().replace(/^'/, "");
    if (k) pendingByDate.set(k, r);
  }

  const updates = [];
  const appends = [];
  const endColLetter = columnNumberToLetter(headerOrder.length);

  for (const [k, r] of pendingByDate.entries()) {
    const rowNum = existingRowByDate.get(k);
    if (rowNum) {
      updates.push({
        range: `${sheetName}!A${rowNum}:${endColLetter}${rowNum}`,
        values: [r],
      });
    } else {
      appends.push(r);
    }
  }

  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: "RAW",
        data: updates.map((u) => ({
          range: u.range,
          majorDimension: "ROWS",
          values: [u.values[0]],
        })),
      },
    });
  }

  if (appends.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A3`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { majorDimension: "ROWS", values: appends },
    });
  }

  // auto-resize
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: sheetIdNumeric,
              dimension: "COLUMNS",
              startIndex: 0,
            },
          },
        },
      ],
    },
  });

  return {
    updated: updates.length,
    appended: appends.length,
    totalColumns: headerOrder.length,
    mergedHeader: true,
  };
}

module.exports = { upsertSectionedRows };
