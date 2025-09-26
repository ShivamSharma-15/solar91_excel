const { getSiteById } = require("../../model/siteModel");

async function getExcelReadyWmsData(data) {
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
    let sectionName = "Weather Monitoring System";
    let arrObjs = [];
    arrObjs.push({
      conlumnName: "Ambient Temperature",
      value: data[i]["Ambient Temperature"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Module Temperature",
      value: data[i]["Module Temperature"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Solar Irradiation",
      value: data[i]["Solar Irradiation"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Wind Direction",
      value: data[i]["Wind Direction"],
      sectionName,
    });
    arrObjs.push({
      conlumnName: "Wind Speed",
      value: data[i]["Wind Speed"],
      sectionName,
    });
    row = row.concat(arrObjs);
  }
  return row;
}

module.exports = { getExcelReadyWmsData };
