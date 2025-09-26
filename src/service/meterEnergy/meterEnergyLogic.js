const {
  getMetersBySiteModel,
} = require("../../model/dailyEnergyModel/dailyEnergyModel");
const {
  getFilteredValues,
  collapseToLatestPerUnit,
} = require("../../util/dailyEnergyUtils/filteringData");
const {
  getStructuredTimeStampsForDailyEnergyInverter,
} = require("../../util/dailyEnergyUtils/timestampManager");
const { readJsonFromFile } = require("../../util/jsonEditor");
const { getPreviousDate } = require("../../util/meterDataUtil/dateHelper");
const {
  postUnitsDataTimeRange,
} = require("../globalUnitsService/unitsDataTimeRange");
const { processEnergyData } = require("./processDeltasMeter");

async function getMeterEnergies(sites) {
  let finalData = [];
  for (let i = 0; i < sites.length; i++) {
    let unitData = await getMetersBySiteModel(sites[i].site_id);
    if (!unitData) {
      continue;
    }
    let units = unitData.map((unit) => unit.unit_key);
    let params = [
      "Total AC Active Export Energy",
      "Total AC Active Import Energy",
      "Total AC Reactive Export Energy",
      "Total AC Reactive Import Energy",
    ];
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
    let fromDay = from.split(" ");
    let newFromDay = getPreviousDate(fromDay.at(0));
    fromDay[0] = newFromDay;
    from = fromDay.join(" ");
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
    let addingAdditionalDetails = processEnergyData(finalSiteData);
    let pakkaFinal = addMoreColumns(addingAdditionalDetails);

    let siteData = {};
    siteData[sites[i].site_id] = pakkaFinal;
    finalData.push(siteData);
  }
  return finalData;
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

function transformData(data) {
  const result = {};

  for (const [date, records] of Object.entries(data)) {
    // Initialize a container for this date
    result[date] = {};

    for (const record of records) {
      const { unitName, unitKey, ...metrics } = record;

      // If this unit hasn't been seen yet, create its object
      if (!result[date][unitKey]) {
        result[date][unitKey] = { unitName, unitKey };
      }

      // Merge metrics into the unit object
      Object.assign(result[date][unitKey], metrics);
    }

    // Convert back to array of objects (optional — if you want arrays instead of unitKey map)
    result[date] = Object.values(result[date]);
  }

  return result;
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
function addMoreColumns(data) {
  let keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    currentObj = keys[i];
    for (let j = 0; j < data[currentObj].length; j++) {
      data[currentObj][j]["Net Generation"] =
        data[currentObj][j]["Main Net Export KWH"] -
        data[currentObj][j]["Net Import KWH"];
    }
  }
  return data;
}
module.exports = { getMeterEnergies };
