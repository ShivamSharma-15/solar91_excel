const { default: axios } = require("axios");
const { readJsonFromFile, saveJsonToFile } = require("../../util/jsonEditor");
const {
  getMetaDataLogicInverter,
} = require("../../model/dailyEnergyModel/dailyEnergyModel");

async function handleInverterLogic(inverters, sites) {
  let data = [];
  for (let i = 0; i < inverters.length; i++) {
    if (data.length < 1) {
      data.push({
        columnName: "Date",
        value: inverters[i].E_DATE,
      });
    }
    let metadataInfuse = await getMetaDataLogicInverter(
      inverters[i].ID,
      sites.site_id
    );
    let generationPerKw =
      Math.floor(
        (inverters[i].DAY_KWH / metadataInfuse.unit_metadata["DC Capacity"]) *
          100
      ) / 100;
    let dataToPush = {
      columnName: inverters[i].NAME,
      value: inverters[i].DAY_KWH,
      section: "Inverter",
    };
    let dataToPushDCCapacity = {
      columnName: "DC Capacity",
      value: metadataInfuse.unit_metadata["DC Capacity"],
      section: "Inverter",
    };
    let dataToPushGenPerKw = {
      columnName: `Generation Per kW ${inverters[i].NAME}`,
      value: generationPerKw,
      section: "Inverter",
    };
    data.push(dataToPush);
    data.push(dataToPushDCCapacity);
    data.push(dataToPushGenPerKw);
  }
  return data;
}

// let sites = {
//   site_id: 1,
// };

// let inverters = [
//   {
//     ID: "872WT001",
//     NAME: "INV-01",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "36.86",
//     TOT_GEN: "162412",
//     E_DATE: "25-Sep-2025 12:11:00",
//     STS: "Online",
//     SID: "001",
//     ALARM: "Ok",
//     DAY_KWH: "124",
//   },
//   {
//     ID: "872WT002",
//     NAME: "INV-02",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "39.69",
//     TOT_GEN: "50537",
//     E_DATE: "25-Sep-2025 12:11:00",
//     STS: "Online",
//     SID: "002",
//     ALARM: "Ok",
//     DAY_KWH: "133",
//   },
//   {
//     ID: "872WT003",
//     NAME: "INV-03",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "31.36",
//     TOT_GEN: "136067",
//     E_DATE: "25-Sep-2025 12:11:00",
//     STS: "Online",
//     SID: "003",
//     ALARM: "Ok",
//     DAY_KWH: "111",
//   },
//   {
//     ID: "872WT004",
//     NAME: "INV-04",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "29.14",
//     TOT_GEN: "149988",
//     E_DATE: "25-Sep-2025 12:11:00",
//     STS: "Online",
//     SID: "004",
//     ALARM: "Ok",
//     DAY_KWH: "103",
//   },
//   {
//     ID: "872WT005",
//     NAME: "INV-05",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "43.04",
//     TOT_GEN: "181895",
//     E_DATE: "25-Sep-2025 12:11:00",
//     STS: "Online",
//     SID: "005",
//     ALARM: "Ok",
//     DAY_KWH: "134",
//   },
//   {
//     ID: "872WT006",
//     NAME: "INV-06",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "51.28",
//     TOT_GEN: "214705",
//     E_DATE: "25-Sep-2025 12:11:00",
//     STS: "Online",
//     SID: "006",
//     ALARM: "Ok",
//     DAY_KWH: "145",
//   },
//   {
//     ID: "872WT007",
//     NAME: "INV-07",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "51.13",
//     TOT_GEN: "210877",
//     E_DATE: "25-Sep-2025 12:08:00",
//     STS: "Online",
//     SID: "007",
//     ALARM: "Ok",
//     DAY_KWH: "137",
//   },
//   {
//     ID: "872WT008",
//     NAME: "INV-08",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "50.19",
//     TOT_GEN: "212243",
//     E_DATE: "25-Sep-2025 12:10:00",
//     STS: "Online",
//     SID: "008",
//     ALARM: "Ok",
//     DAY_KWH: "140",
//   },
//   {
//     ID: "872WT009",
//     NAME: "INV-09",
//     MAKE: "HITACHI",
//     TYPY: "Inverter",
//     CAPACITY: "70",
//     KW: "50.01",
//     TOT_GEN: "198689",
//     E_DATE: "25-Sep-2025 12:10:00",
//     STS: "Online",
//     SID: "009",
//     ALARM: "Ok",
//     DAY_KWH: "145",
//   },
// ];
// handleInverterLogic(inverters, sites);
module.exports = { handleInverterLogic };
// async function handleInverterLogic(inverters) {
//   let inverterData = [];
//   for (let i = 0; i < inverters.length; i++) {
//     let response = await axios.post(
//       `${process.env.LOGIC_POWER_URL}/GET_LOG_DATA`,
//       {
//         params: {
//           PLANT_CODE: site.plant_code,
//           ID: inverters[i].ID,
//           LOGIN_ID: site.site_user_id,
//           PASS_KEY: site.pass_key,
//           USER_CODE: process.env.USER_CODE_LOGIC,
//           APP_KEY: process.env.APP_KEY_LOGIC,
//         },
//       }
//     );
//     const filterMax = filterMaxTime(response.data.LOG);
//     const checkPastData = checkPastData(sute_user_id, inverters[i].ID);
//     if (!checkPastData) {
//       const json = await readJsonFromFile("../../data/logicHistory.json");
//       if (!json) {
//         await saveJsonToFile({
//           [site.site_user_id]: {
//             [inverters[i].ID]: filterMax.TOTAL_KWH,
//           },
//         });
//       } else if (!json[site.site_user_id]) {
//         json[site.site_user_id] = {
//           [inverters[i].ID]: filterMax.TOTAL_KWH,
//         };
//         await saveJsonToFile(json);
//       } else if (!json[site.site_user_id][inverters[i].ID]) {
//         json[site.site_user_id][inverters[i].ID] = filterMax.TOTAL_KWH;
//         await saveJsonToFile(json);
//       }
//     } else {
//       let totalGen = checkPastData[site.site_user_id][inverters[i].ID];
//       let currentGen = totalGen - filterMax.TOTAL_KWH;
//       let newHistoricGen = await readJsonFromFile(
//         "../../data/logicHistory.json"
//       );
//       newHistoricGen[site.site_user_id][inverters[i].ID] = filterMax.TOTAL_KWH;
//       await saveJsonToFile(newHistoricGen);
//       inverterData.push({
//         columnName: inverters[i].NAME,
//         value:
//       });
//     }
//   }
// }

// function filterMaxTime(data) {
//   if (!Array.isArray(data) || data.length === 0) return null;

//   return data.reduce((latest, current) => {
//     const parseDate = (dt) => {
//       const [datePart, timePart] = dt.split(" ");
//       const [day, month, year] = datePart.split("/").map(Number);
//       const [hours, minutes] = timePart.split(":").map(Number);
//       return new Date(year, month - 1, day, hours, minutes);
//     };

//     const latestDate = parseDate(latest.DT);
//     const currentDate = parseDate(current.DT);

//     return currentDate > latestDate ? current : latest;
//   });
// }
