const DATA_SHEET_NAME = 'Data';

function doGet(e) {
  const params = e.parameter || {};
  const callback = params.callback || 'callback';
  const key = params.key || '';
  const payload = {
    ok: true,
    key: key,
    data: key ? loadValue_(key) : loadAll_()
  };

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const body = JSON.parse((e.postData && e.postData.contents) || '{}');
  if (body.action === 'save' && body.key) {
    saveValue_(body.key, Array.isArray(body.data) ? body.data : []);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ok: true}))
    .setMimeType(ContentService.MimeType.JSON);
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
