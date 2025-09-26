const { getPreviousDate } = require("../../util/meterDataUtil/dateHelper");

function processEnergyData(data) {
  const keys = Object.keys(data);
  const starting = findStarting(keys);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === starting) {
      continue;
    }
    let previousDate = getPreviousDate(keys[i]);
    let targetData = data[keys[i]];

    let deltaData = data[previousDate];
    let finals = calculateDeltas(targetData, deltaData);
    data[keys[i]] = finals;
  }
  delete data[starting];
  return data;
}
function calculateDeltas(target, prev) {
  for (let i = 0; i < target.length; i++) {
    let index = prev.findIndex((obj) => obj.unitKey === target[i].unitKey);
    let netExport =
      (target[i]["Total AC Active Export Energy"] -
        prev[index]["Total AC Active Export Energy"]) *
      6000;
    netExport = Number(netExport.toFixed(4));
    let netImport =
      (target[i]["Total AC Active Import Energy"] -
        prev[index]["Total AC Active Import Energy"]) *
      6000;
    netImport = Number(netImport.toFixed(4));
    let netExportReactive =
      (target[i]["Total AC Reactive Export Energy"] -
        prev[index]["Total AC Reactive Export Energy"]) *
      6000;
    netExportReactive = Number(netExportReactive.toFixed(4));
    let netImportReactive =
      (target[i]["Total AC Reactive Import Energy"] -
        prev[index]["Total AC Reactive Import Energy"]) *
      6000;
    netImportReactive = Number(netImportReactive.toFixed(4));
    target[i]["Main Net Export KWH"] = netExport;
    target[i]["Net Import KWH"] = netImport;
    target[i]["Net Export (kVArh)"] = netExportReactive;
    target[i]["Net Import (kVArh)"] = netImportReactive;
  }
  return target;
}
function findStarting(keys) {
  for (let i = 0; i < keys.length; i++) {
    let dateString = getPreviousDate(keys[0]);
    if (keys.includes(dateString)) {
      continue;
    } else {
      return keys[i];
    }
  }
}

module.exports = { processEnergyData };
