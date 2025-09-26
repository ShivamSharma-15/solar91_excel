const { getSiteLogicPower } = require("../model/siteModel");
const { handleInverterLogic } = require("./logicService/inverterLogic");
const { handleMeterLogic } = require("./logicService/meterLogic");
const { getSitePassKeyLogic } = require("./siteService");
const { getSiteUnitsLogic } = require("./unitService");
async function logicPower() {
  let bigData = [];
  const sites = await getSiteLogicPower();
  for (let i = 0; i < sites.length; i++) {
    let siteParamAddition = await getSitePassKeyLogic(sites[i]);
    console.log(siteParamAddition);
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
  let totalValue = 0;
  for (let i = 0; i < inverters.length; i++) {
    if (inverters[i].columnName === "Date") {
      continue;
    } else {
      totalValue += inverters[i].value;
    }
  }
  total.value = totalValue;
  return total;
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
