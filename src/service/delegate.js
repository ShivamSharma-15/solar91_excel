const { infuseTotals } = require("../util/dailyEnergyUtils/filteringData");
const { getDateForLog } = require("../util/logHelper");
const { infuseSection } = require("../util/rowsHandler");
const { setAuthToken } = require("./authService");
const {
  getDailyEnergy,
  getExcelReadyDailyEnergy,
} = require("./dailyEnergy/dailyEnergyDriver");
const { excelHandler } = require("./excelHandler/manageExcelUploads");
const { mergeByDate } = require("./excelHandler/merger");
const {
  getExcelReadyExtrasData,
  cufAverage,
  PRAverage,
  getExcelReadyExtrasDataPR,
} = require("./extras/excelReadyExtrasData");
const { getExtras, prAndOthersDriver } = require("./extras/extraDriver");
const { getExcelReadyMeterData } = require("./meterEnergy/excelReadyMeterData");
const { getMeterEnergies } = require("./meterEnergy/meterEnergyLogic");
const { manageSiteLogic } = require("./siteService");
const { manageUnitsLogic } = require("./unitService");
const { getExcelReadyWmsData } = require("./wms/excelReadyWmsData");
const { wmsDriver } = require("./wms/wmsDriver");

async function delegator() {
  const currentDate = getDateForLog();
  console.log(currentDate);
  console.log("-------------- ", currentDate, " --------------");
  console.log("1. Attempting login to get session token");
  const loginStatus = await setAuthToken();
  if (!loginStatus) {
    console.log("-> Failed");
    return false;
  }
  console.log("-> Success");
  console.log("2. Getting Site Data");
  const sites = await manageSiteLogic();
  console.log("-> Success");
  console.log("3. Getting Units Data");
  const units = await manageUnitsLogic(sites);
  if (!units) {
    console.log("-> Failed");
    return false;
  }
  console.log("-> Success");
  console.log("4. Getting Daily Energy");
  console.log(JSON.stringify(sites));
  const getDailyEnergies = await getDailyEnergy(sites);
  console.log("-> Success");
  console.log("5. Getting Meter Data");
  const meterData = await getMeterEnergies(sites);
  console.log("-> Success");
  console.log("6. Getting WMS Data");
  const wmsData = await wmsDriver(sites);
  console.log("-> Success");
  console.log("7. Getting Extra Data");
  const extras = await getExtras(sites);
  const prAndOthers = await prAndOthersDriver(sites);
  console.log("-> Success");
  // const alarm = await getAlarm(sites);
  // console.log("-> Success");
  let finalExcelData = [];
  console.log("9. Getting data ready for Google sheets");
  const excelDataDailyEnergy = await getExcelReadyDailyEnergy(getDailyEnergies);
  const infuseSections = await infuseSection("Inverter", excelDataDailyEnergy);
  const infuseTotal = infuseTotals(infuseSections);
  const excelMeterData = await getExcelReadyMeterData(meterData);
  const excelWmsData = await getExcelReadyWmsData(wmsData);
  const excelExtrasData = await getExcelReadyExtrasData(extras);
  const excelPrData = await getExcelReadyExtrasDataPR(prAndOthers);
  const calcCufAverage = cufAverage(excelExtrasData);
  const calcPrAverage = PRAverage(excelPrData);
  console.log("-> Success");
  finalExcelData = mergeByDate(infuseTotal, excelMeterData);
  finalExcelData = mergeByDate(finalExcelData, excelWmsData);
  finalExcelData = mergeByDate(finalExcelData, calcCufAverage);
  finalExcelData = mergeByDate(finalExcelData, calcPrAverage);
  console.log(JSON.stringify(finalExcelData));
  console.log("9. Pushing data to excel");
  await excelHandler(finalExcelData);
  console.log("-> Success");
  console.log("-------------- ### --------------");
  return true;
}

module.exports = { delegator };
