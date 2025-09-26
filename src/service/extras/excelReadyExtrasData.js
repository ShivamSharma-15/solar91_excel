const { getSiteById } = require("../../model/siteModel");

async function getExcelReadyExtrasData(data) {
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
    let sectionName = "Other";
    let arrObjs = [];
    arrObjs.push({
      conlumnName: "CUF",
      value: data[i]["CUF"],
      sectionName,
    });

    row = row.concat(arrObjs);
  }
  return row;
}
function cufAverage(data) {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].rows.length; j++) {
      let datas = [];
      let totalCuf = 0;
      for (let k = 0; k < data[i].rows[j].length; k++) {
        if (data[i].rows[j][k]?.columnName === "Date") {
          datas.push(data[i].rows[j][k]);
        } else {
          totalCuf += data[i].rows[j][k].value;
        }
      }
      datas.push({
        columnName: "CUF",
        value: Number((totalCuf / (data[i].rows[j].length - 1)).toFixed(2)),
        sectionName: "Other",
      });
      data[i].rows[j] = datas;
    }
  }
  return data;
}
async function getExcelReadyExtrasDataPR(data) {
  let fullArr = [];
  for (let i = 0; i < data.length; i++) {
    let keys = Object.keys(data[i]);
    for (let j = 0; j < keys.length; j++) {
      let site = await getSiteById(keys[i]);
      let sheetId = site[0].sheet_id;
      let siteJson = {};
      let rows = getRowWiseMeterDataPR(data[i][keys[j]]);
      siteJson.rows = rows;
      siteJson.sheet_id = sheetId;
      fullArr.push(siteJson);
    }
  }
  return fullArr;
}

function getRowWiseMeterDataPR(data) {
  let rows = [];
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    let row = getRowObjPR(data[keys[i]], keys[i]);
    rows.push(row);
  }
  return rows;
}

function getRowObjPR(data, date) {
  let row = [];
  let dateObj = {
    columnName: "Date",
    value: date,
  };
  row.push(dateObj);
  for (let i = 0; i < data.length; i++) {
    let sectionName = "Other";
    let arrObjs = [];
    arrObjs.push({
      conlumnName: "PR%",
      value: data[i]["Performance Ratio"],
      sectionName,
    });

    row = row.concat(arrObjs);
  }
  return row;
}
function PRAverage(data) {
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].rows.length; j++) {
      let datas = [];
      let totalCuf = 0;
      for (let k = 0; k < data[i].rows[j].length; k++) {
        if (data[i].rows[j][k]?.columnName === "Date") {
          datas.push(data[i].rows[j][k]);
        } else {
          totalCuf += data[i].rows[j][k].value;
        }
      }
      datas.push({
        columnName: "PR%",
        value: Number((totalCuf / (data[i].rows[j].length - 1)).toFixed(2)),
        sectionName: "Other",
      });
      data[i].rows[j] = datas;
    }
  }
  return data;
}
module.exports = {
  getExcelReadyExtrasData,
  cufAverage,
  getExcelReadyExtrasDataPR,
  PRAverage,
};
