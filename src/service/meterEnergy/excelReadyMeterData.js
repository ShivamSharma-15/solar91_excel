const { getSiteById } = require("../../model/siteModel");

async function getExcelReadyMeterData(data) {
  let fullArr = [];
  for (let i = 0; i < data.length; i++) {
    let keys = Object.keys(data[i]);
    for (let j = 0; j < keys.length; j++) {
      let site = await getSiteById(keys[i]);
      let sheetId = site[0].sheet_id;
      let siteJson = {};
      let rows = getRowWiseMeterData(data[i][keys[j]]);
      siteJson.rows = rows;
      siteJson.sheet_id = sheetId;
      fullArr.push(siteJson);
    }
  }
  return fullArr;
}

function getRowWiseMeterData(data) {
  let rows = [];
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    let row = getRowObj(data[keys[i]], keys[i]);
    rows.push(row);
  }
  return rows;
}

function getRowObj(data, date) {
  let row = [];
  let dateObj = {
    columnName: "Date",
    value: date,
  };
  row.push(dateObj);
  for (let i = 0; i < data.length; i++) {
    let sectionName = data[i].unitName;
    let arrObjs = [];
    arrObjs.push({
      conlumnName: "Total AC Active Export Energy",
      value: data[i]["Total AC Active Export Energy"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Main Net Export KWH",
      value: data[i]["Main Net Export KWH"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Total AC Active Import Energy",
      value: data[i]["Total AC Active Import Energy"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Net Import KWH",
      value: data[i]["Net Import KWH"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Net Generation",
      value: data[i]["Net Generation"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Total AC Reactive Export Energy",
      value: data[i]["Total AC Reactive Export Energy"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Net Export (kVArh)",
      value: data[i]["Net Export (kVArh)"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Total AC Reactive Import Energy",
      value: data[i]["Total AC Reactive Import Energy"],
      sectionName,
    });

    arrObjs.push({
      conlumnName: "Net Import (kVArh)",
      value: data[i]["Net Import (kVArh)"],
      sectionName,
    });
    row = row.concat(arrObjs);
  }
  return row;
}

module.exports = { getExcelReadyMeterData };
