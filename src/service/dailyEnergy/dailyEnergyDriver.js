const {
  getInvertersBySiteModel,
} = require("../../model/dailyEnergyModel/dailyEnergyModel");
const { getSiteById } = require("../../model/siteModel");
const {
  enrichFilterValues,
  collapseToLatestPerUnit,
  getFilteredValues,
} = require("../../util/dailyEnergyUtils/filteringData");
const {
  getStructuredTimeStampsForDailyEnergyInverter,
  getCurrentDateIST,
} = require("../../util/dailyEnergyUtils/timestampManager");
const { readJsonFromFile } = require("../../util/jsonEditor");
const {
  postUnitsDataTimeRange,
} = require("../globalUnitsService/unitsDataTimeRange");

// const { saveJsonToFile, readJsonFromFile } = require("./tempJsonCreator");

async function getDailyEnergy(sites) {
  let finalData = [];
  for (let i = 0; i < sites.length; i++) {
    let unitData = await getInvertersBySiteModel(sites[i].site_id);
    if (!unitData) {
      continue;
    }
    let units = unitData.map((unit) => unit.unit_key);
    let params = ["Daily Energy"];
    let from, to, recordAt;
    let customConfig = await readJsonFromFile("../data/unitsConfig.json");
    let siteId = String(sites[i].site_id);
    if (customConfig[siteId].customDate) {
      from = customConfig[siteId].from;
      to = customConfig[siteId].to;
      recordAt = customConfig[siteId].recordAt;
    } else {
      let currentDateIST = getCurrentDateIST();
      from = `${currentDateIST} 00:00:00`;
      to = `${currentDateIST} 23:59:59`;
      recordAt = customConfig[siteId].recordAt;
    }
    console.log(
      `Getting data from ${from} to ${to} and recording at ${recordAt}`
    );
    let timestamps = getStructuredTimeStampsForDailyEnergyInverter(
      from,
      to,
      recordAt
    );
    let dailyData = await postUnitsDataTimeRange(units, params, timestamps);
    let filterMax = collapseToLatestPerUnit(dailyData);
    let filterValues = getFilteredValues(filterMax);
    let infuseMetadata = enrichFilterValues(filterValues, unitData);
    let siteWiseData = {};
    siteWiseData[sites[i].site_id] = infuseMetadata;
    finalData.push(siteWiseData);
  }
  return finalData;
}

async function getExcelReadyDailyEnergy(data) {
  let finalOutput = [];
  for (let i = 0; i < data.length; i++) {
    let siteData = data[i];
    let site = Object.keys(data[i]);
    let site_id = site[0];
    siteData = siteData[site_id];
    let rows = rowCreationHelperDailyEnergy(siteData, site_id);
    let sheetId = await getSiteById(site_id);
    sheetId = sheetId[0].sheet_id;
    let mixSheetID = {
      rows: rows,
      sheet_id: sheetId,
    };
    finalOutput.push(mixSheetID);
  }
  return finalOutput;
}

function rowCreationHelperDailyEnergy(siteData, site_id) {
  const dateKeys = Object.keys(siteData);
  let rows = [];
  for (let i = 0; i < dateKeys.length; i++) {
    let row = [];
    let dateData = siteData[dateKeys[i]];
    let dateObj = {
      columnName: "Date",
      value: dateKeys[i],
    };
    row.push(dateObj);
    for (let j = 0; j < siteData[dateKeys[i]].length; j++) {
      let valueObj = {
        columnName: dateData[j].unitName,
        value: dateData[j].value,
      };
      row.push(valueObj);
      let dcKey = Object.keys(dateData[j]).find((k) =>
        k.startsWith("DC Capacity")
      );
      let extraPart;
      let DcValueObj;
      if (dcKey) {
        extraPart = dcKey.replace("DC Capacity", "").trim();
        DcValueObj = {
          columnName: dcKey,
          value: dateData[j][dcKey],
        };
        row.push(DcValueObj);
      }
      if (extraPart && DcValueObj) {
        let generationPerKiloWatt = valueObj.value / DcValueObj.value;
        generationPerKiloWatt = parseFloat(generationPerKiloWatt.toFixed(2));
        let generationPerKiloWattObj = {
          columnName: `Generation Per kW ${extraPart.trim()}`,
          value: generationPerKiloWatt,
        };
        row.push(generationPerKiloWattObj);
      }
    }

    rows.push(row);
  }
  return rows;
}
module.exports = { getDailyEnergy, getExcelReadyDailyEnergy };
