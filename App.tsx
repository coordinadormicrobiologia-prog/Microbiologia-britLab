// Apps Script (reemplazar Code.gs en tu proyecto)
//
// Versión sin setHeader (Apps Script TextOutput no soporta setHeader).
// Acepta JSON (application/json) o form-urlencoded (e.parameter con sample stringified).

const SPREADSHEET_ID = "1-CXI3hS7K3uhSG-QpGm5K7Jg9pI0DMRi9ircB0e2to";
const SHEETS = {
  SAMPLES: "muestras",
  USERS: "usuarios",
  AUDIT: "auditoria",
};

const API_KEY = "staphylococcusaureus";

// Responde a preflight (simple): devuelve vacio. Idealmente el front evita el preflight.
function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Intentar parsear JSON (cuando el cliente envía application/json)
    let body = {};
    try {
      body = JSON.parse((e.postData && e.postData.contents) || "{}");
    } catch (_) {
      // si no es JSON, puede venir como form-urlencoded -> e.parameter
      body = Object.assign({}, e.parameter || {});
      // si el frontend envía sample como JSON string, parsearlo
      if (body.sample && typeof body.sample === "string") {
        try { body.sample = JSON.parse(body.sample); } catch (_) {}
      }
    }

    if (!body.action) return jsonError_("Missing action");

    // Seguridad mínima por API key
    if (!body.api_key || body.api_key !== API_KEY) {
      return jsonError_("Unauthorized");
    }

    switch (body.action) {
      case "samples:list":
        return jsonOk_({ samples: listSamples_() });

      case "samples:create":
        return jsonOk_({ created: createSample_(body.sample) });

      case "samples:updateStatus":
        return jsonOk_({ updated: updateSampleStatus_(body.id, body.status) });

      case "auth:login":
        return jsonOk_(login_(body.username, body.password));

      default:
        return jsonError_("Unknown action");
    }
  } catch (err) {
    return jsonError_(String(err));
  }
}

/** CORE **/
function listSamples_() {
  const sh = sheet_(SHEETS.SAMPLES);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0].map(String);
  const out = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row.join("").trim() === "") continue;
    const obj = {};
    headers.forEach((h, idx) => obj[h] = row[idx]);
    out.push(obj);
  }

  out.sort((a,b) => String(b.created_at).localeCompare(String(a.created_at)));
  return out;
}

function createSample_(sample) {
  if (!sample) throw new Error("Missing sample");

  const sh = sheet_(SHEETS.SAMPLES);
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);

  const id = Utilities.getUuid();
  const now = new Date();
  const rowObj = {
    id,
    created_at: now.toISOString(),
    created_by: sample.created_by || "",
    patient_name: sample.patient_name || "",
    patient_dni: sample.patient_dni || "",
    sex: sample.sex || "",
    sample_type: sample.sample_type || "",
    presumptive_dx: sample.presumptive_dx || "",
    antecedents: sample.antecedents || "",
    status: sample.status || "PENDIENTE",
  };

  const row = headers.map(h => rowObj[h] ?? "");
  sh.appendRow(row);

  audit_("samples:create", sample.created_by || "", rowObj);
  return rowObj;
}

function updateSampleStatus_(id, status) {
  if (!id) throw new Error("Missing id");
  if (!status) throw new Error("Missing status");

  const sh = sheet_(SHEETS.SAMPLES);
  const data = sh.getDataRange().getValues();
  const headers = data[0].map(String);

  const idCol = headers.indexOf("id");
  const statusCol = headers.indexOf("status");
  if (idCol < 0 || statusCol < 0) throw new Error("Sheet missing id/status columns");

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(id)) {
      sh.getRange(r+1, statusCol+1).setValue(status);
      audit_("samples:updateStatus", "", { id, status });
      return { id, status };
    }
  }
  throw new Error("Sample not found");
}

/** AUTH (opcional) **/
function login_(username, password) {
  const sh = sheet_(SHEETS.USERS);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(String);

  const uCol = headers.indexOf("username");
  const pCol = headers.indexOf("password_hash");
  const rCol = headers.indexOf("role");
  if (uCol < 0 || pCol < 0 || rCol < 0) throw new Error("Usuarios sheet headers incorrectos");

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][uCol]) === String(username) && String(values[i][pCol]) === String(password)) {
      return { ok: true, role: values[i][rCol], username };
    }
  }
  return { ok: false };
}

/** HELPERS **/
function sheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error(`Missing sheet: ${name}`);
  return sh;
}

function audit_(action, by, payload) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEETS.AUDIT);
    if (!sh) return;
    sh.appendRow([new Date().toISOString(), action, by, JSON.stringify(payload)]);
  } catch (_) {}
}

function jsonOk_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...obj }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError_(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
