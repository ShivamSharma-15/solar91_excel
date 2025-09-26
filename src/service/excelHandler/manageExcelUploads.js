const { upsertSectionedRows } = require("./excelUpdater");

async function excelHandler(fullData) {
  for (let i = 0; i < fullData.length; i++) {
    let sheet_id = fullData[i].sheet_id;
    let rowsData = fullData[i].rows;
    let oauthJsonPath = "../../data/service-account.json";

    let sheetName = "Sheet1";
    console.log("Uploading Data to Google Sheets");
    let result = await upsertSectionedRows(
      rowsData,
      sheet_id,
      oauthJsonPath,
      sheetName,
      "00:00"
    );
    console.log("Finished");
  }
  return true;
}

module.exports = { excelHandler };
