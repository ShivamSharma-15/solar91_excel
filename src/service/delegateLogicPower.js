const { getSiteLogicPower } = require("../model/siteModel");
const { excelHandler } = require("./excelHandler/manageExcelUploads");
const { handleInverterLogic } = require("./logicService/inverterLogic");
const { handleMeterLogic } = require("./logicService/meterLogic");
const { getSitePassKeyLogic } = require("./siteService");
const { getSiteUnitsLogic } = require("./unitService");
async function logicPower() {
  let bigData = [];
  console.log("Starting Logic Power Data Fetch");
  const sites = await getSiteLogicPower();
  for (let i = 0; i < sites.length; i++) {
    let siteParamAddition = await getSitePassKeyLogic(sites[i]);
    // sites[i].pass_key = "X2DceJw38eLCDMBDMODeA==";
    // sites[i].plant_code = "202KM";
    sites[i].pass_key = siteParamAddition.PASS_KEY;
    sites[i].plant_code = siteParamAddition.PLANT_Code;
    let units = await getSiteUnitsLogic(sites[i]);
    let inverters = seperateInverters(units);
    let meters = seperateMeters(units);
    const inverterLogic = await handleInverterLogic(inverters, sites[i]);
    const calculateTotal = calcTotalInverter(inverterLogic);
    inverterLogic.push(calculateTotal);
    const meterLogic = await handleMeterLogic(meters, sites[i]);
    const pushData = inverterLogic.concat(meterLogic);
    let thisData = {
      rows: [pushData],
      sheet_id: sites[i].sheet_id,
    };
    bigData.push(thisData);
  }
  console.log("Pushing Logic Power Data To Google Sheets");
  await excelHandler(bigData);
  console.log("Successfully Pushed Logic Power Data To Google Sheets");
}
function calcTotalInverter(inverters) {
  const total = {
    columnName: "Total AC Active Export Energy",
    section: "Inverter",
  };

  const totalValue = (inverters ?? []).reduce((sum, item) => {
    if (!item) return sum;

    const name = String(item.columnName ?? "").trim();
    const valueNum = Number(item.value);

    // Match: starts with "inv-" (case-insensitive). e.g., "INV-1", "Inv-MPPT", "inv-"
    const isInv = /^inv-/.test(name.toLowerCase());

    if (isInv && Number.isFinite(valueNum)) {
      return sum + valueNum;
    }
    return sum;
  }, 0);

  return { ...total, value: totalValue };
}

function seperateInverters(units) {
  const inverters = [];
  for (let i = 0; i < units.length; i++) {
    if (units[i].TYPY === "Inverter") {
      inverters.push(units[i]);
    }
  }
  return inverters;
}
function seperateMeters(units) {
  const meters = [];
  for (let i = 0; i < units.length; i++) {
    if (units[i].TYPY === "Energy Meter") {
      meters.push(units[i]);
    }
  }
  return meters;
}
module.exports = { logicPower };
// logicPower();
