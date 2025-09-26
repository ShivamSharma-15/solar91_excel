const {
  getInvertersBySiteModel,
  getDerivedBySiteModel,
} = require("../../model/dailyEnergyModel/dailyEnergyModel");
const {
  collapseToLatestPerUnit,
  getFilteredValues,
} = require("../../util/dailyEnergyUtils/filteringData");
const {
  getCurrentDateIST,
  getStructuredTimeStampsForDailyEnergyInverter,
} = require("../../util/dailyEnergyUtils/timestampManager");
const { readJsonFromFile } = require("../../util/jsonEditor");
const {
  postUnitsDataTimeRange,
} = require("../globalUnitsService/unitsDataTimeRange");

async function getExtras(sites) {
  let finalData = [];
  for (let i = 0; i < sites.length; i++) {
    let wmsData = await getInvertersBySiteModel(sites[i].site_id);
    let units = wmsData.map((unit) => unit.unit_key);
    let params = ["CUF"];
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
    let arrAllParams = [];
    for (let j = 0; j < params.length; j++) {
      let dailyData = await postUnitsDataTimeRange(
        units,
        params[j],
        timestamps
      );
      let filterMax = collapseToLatestPerUnit(dailyData);
      let filterValues = getFilteredValues(filterMax);
      let managedParams = manageParamsInsertion(filterValues, params[j]);
      arrAllParams.push(managedParams);
    }
    let thisSiteData = mergeByDate(arrAllParams);
    let finalSiteData = transformData(thisSiteData);

    let siteData = {};
    siteData[sites[i].site_id] = finalSiteData;
    finalData.push(siteData);
  }
  return finalData;
}
function manageParamsInsertion(data, newKey) {
  const cloned = JSON.parse(JSON.stringify(data));
  for (const date in cloned) {
    cloned[date] = cloned[date].map((entry) => {
      const { value, ...rest } = entry;
      return { ...rest, [newKey]: value };
    });
  }

  return cloned;
}
function transformData(data) {
  const result = {};

  for (const [date, records] of Object.entries(data)) {
    result[date] = {};

    for (const record of records) {
      const { unitName, unitKey, ...metrics } = record;

      if (!result[date][unitKey]) {
        result[date][unitKey] = { unitName, unitKey };
      }

      Object.assign(result[date][unitKey], metrics);
    }

    result[date] = Object.values(result[date]);
  }

  return result;
}
function mergeByDate(data) {
  const result = {};
  data.forEach((group) => {
    Object.keys(group).forEach((date) => {
      if (!result[date]) {
        result[date] = [];
      }
      result[date].push(...group[date]);
    });
  });

  return result;
}
async function prAndOthersDriver(sites) {
  let finalData = [];
  for (let i = 0; i < sites.length; i++) {
    let wmsData = await getInvertersBySiteModel(sites[i].site_id);
    let units = wmsData.map((unit) => unit.unit_key);
    let params = ["Performance Ratio"];
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
    let arrAllParams = [];
    for (let j = 0; j < params.length; j++) {
      let dailyData = await postUnitsDataTimeRange(
        units,
        params[j],
        timestamps
      );
      let filterMax = collapseToLatestPerUnit(dailyData);
      let filterValues = getFilteredValues(filterMax);
      let managedParams = manageParamsInsertion(filterValues, params[j]);
      arrAllParams.push(managedParams);
    }
    let thisSiteData = mergeByDate(arrAllParams);
    let finalSiteData = transformData(thisSiteData);

    let siteData = {};
    siteData[sites[i].site_id] = finalSiteData;
    finalData.push(siteData);
  }
  return finalData;
}
// async function run() {
//   const data = await prAndOthersDriver(sites);
//   // console.log(JSON.stringify(data));
// }
// const sites = [
//   {
//     site_id: 1,
//     site_key: "6b809f8b8b",
//     site_name: "JOD01",
//     sheet_id: "1s5cRnXA4A_EnInAtFbJElSoj5wbd7pTKbnySlzgBvlk",
//   },
// ];
// run();
// async function getAlarm(sites) {
//   let finalData = [];
//   for (let i = 0; i < sites.length; i++) {
//     let alarmData = await getInvertersBySiteModel(sites[i].site_id);
//     let units = wmsData.map((unit) => unit.unit_key);
//     let params = ["CUF"];
//     let from, to, recordAt;
//     let customConfig = await readJsonFromFile("../data/unitsConfig.json");
//     let siteId = String(sites[i].site_id);
//     if (customConfig[siteId].customDate) {
//       from = customConfig[siteId].from;
//       to = customConfig[siteId].to;
//       recordAt = customConfig[siteId].recordAt;
//     } else {
//       let currentDateIST = getCurrentDateIST();
//       from = `${currentDateIST} 00:00:00`;
//       to = `${currentDateIST} 23:59:59`;
//       recordAt = customConfig[siteId].recordAt;
//     }
//     console.log(
//       `Getting data from ${from} to ${to} and recording at ${recordAt}`
//     );
//     let timestamps = getStructuredTimeStampsForDailyEnergyInverter(
//       from,
//       to,
//       recordAt
//     );
//     let arrAllParams = [];
//     for (let j = 0; j < params.length; j++) {
//       let dailyData = await postUnitsDataTimeRange(
//         units,
//         params[j],
//         timestamps
//       );
//       let filterMax = collapseToLatestPerUnit(dailyData);
//       let filterValues = getFilteredValues(filterMax);
//       let managedParams = manageParamsInsertion(filterValues, params[j]);
//       arrAllParams.push(managedParams);
//     }
//     let thisSiteData = mergeByDate(arrAllParams);
//     let finalSiteData = transformData(thisSiteData);

//     let siteData = {};
//     siteData[sites[i].site_id] = finalSiteData;
//     finalData.push(siteData);
//   }
//   return finalData;
// }
module.exports = { getExtras, prAndOthersDriver };
