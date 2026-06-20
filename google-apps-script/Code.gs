const DATA_SHEET_NAME = 'Data';

function doGet(e) {
  const params = e.parameter || {};
  const callback = params.callback || 'callback';
  const key = params.key || '';
  let data = key ? loadValue_(key) : loadAll_();

  if (params.action === 'save' && key) {
    try {
      data = JSON.parse(params.data || '[]');
    } catch (err) {
      data = [];
    }
    saveValue_(key, Array.isArray(data) ? data : []);
  }

  const payload = {
    ok: true,
    key: key,
    data: data
  };

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e.postData && e.postData.contents) || '{}');
  } catch (err) {
    body = {};
  }

  if (body.action === 'save' && body.key) {
    saveValue_(body.key, Array.isArray(body.data) ? body.data : []);
  } else if (body.action === 'uploadPdf') {
    uploadPdf_(body);
  } else if (body.action === 'deletePdf') {
    deletePdf_(body);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ok: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function uploadPdf_(body) {
  const depositId = String(body.depositId || '');
  const fileName = String(body.fileName || 'document.pdf');
  const base64 = String(body.base64 || '');
  const mimeType = String(body.mimeType || 'application/pdf');

  if (!depositId || !base64 || mimeType !== 'application/pdf') {
    throw new Error('Invalid PDF upload request.');
  }

  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = getPdfFolder_().createFile(blob);
  const key = getPdfKey_(depositId, body.storageKey);
  const files = loadValue_(key);
  const metadata = {
    id: file.getId(),
    name: file.getName(),
    size: file.getSize(),
    url: file.getUrl(),
    uploadedAt: new Date().toISOString()
  };

  files.push(metadata);
  saveValue_(key, files);
}

function deletePdf_(body) {
  const depositId = String(body.depositId || '');
  const fileId = String(body.fileId || '');
  if (!depositId || !fileId) return;

  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (err) {
    // The metadata must still be removable if the file was already deleted.
  }

  const key = getPdfKey_(depositId, body.storageKey);
  const files = loadValue_(key).filter(function(file) {
    return file && file.id !== fileId;
  });
  saveValue_(key, files);
}

function getPdfKey_(depositId, storageKey) {
  const suppliedKey = String(storageKey || '');
  if (/^(deposit|daisha)-pdfs-[A-Za-z0-9-]+$/.test(suppliedKey)) {
    return suppliedKey;
  }
  return 'deposit-pdfs-' + depositId;
}

function getPdfFolder_() {
  const folderName = 'MuseuM VMS PDFs';
  const folders = DriveApp.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
}

function authorizePdfStorage() {
  return getPdfFolder_().getUrl();
}

function loadValue_(key) {
  const sheet = getDataSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      try {
        return JSON.parse(values[i][1] || '[]');
      } catch (err) {
        return [];
      }
    }
  }

  return [];
}

function loadAll_() {
  const sheet = getDataSheet_();
  const values = sheet.getDataRange().getValues();
  const result = {};

  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    if (!key) continue;
    try {
      result[key] = JSON.parse(values[i][1] || '[]');
    } catch (err) {
      result[key] = [];
    }
  }

  return result;
}

function saveValue_(key, data) {
  const sheet = getDataSheet_();
  const values = sheet.getDataRange().getValues();
  const json = JSON.stringify(data);
  const now = new Date();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      sheet.getRange(i + 1, 2, 1, 2).setValues([[json, now]]);
      return;
    }
  }

  sheet.appendRow([key, json, now]);
}

function getDataSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET_NAME);
    sheet.appendRow(['key', 'json', 'updatedAt']);
  }

  return sheet;
}
