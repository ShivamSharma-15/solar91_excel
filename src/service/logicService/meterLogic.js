const axios = require("axios");
const { saveJsonToFile } = require("../../util/jsonEditor");
const { getExcelReadyExtrasDataPR } = require("../extras/excelReadyExtrasData");
async function handleMeterLogic(meters, site) {
  const meterData = [];
  for (let i = 0; i < meters.length; i++) {
    const response = await axios.get(
      `${process.env.LOGIC_POWER_URL}/GET_LOG_DATA`,
      {
        params: {
          PLANT_CODE: site.plant_code,
          ID: meters[i].ID,
          LOGIN_ID: site.site_user_id,
          PASS_KEY: site.pass_key,
          USER_CODE: process.env.USER_CODE_LOGIC,
          APP_KEY: process.env.APP_KEY_LOGIC,
        },
      }
    );
    const data = response.data;
    if (data.LOG.length !== 0) {
      const latestData = latestByDateTime(response.data.LOG);
      if (latestData.Sn) {
        delete latestData.Sn;
      }
      if (latestData.ID) {
        delete latestData.ID;
      }
      if (latestData.METERNO) {
        delete latestData.METERNO;
      }
      if (latestData.Date_Time) {
        delete latestData.Date_Time;
      }
      if (latestData.DATE) {
        delete latestData.DATE;
      }
      if (latestData.TIME) {
        delete latestData.TIME;
      }
      if (latestData.Day) {
        delete latestData.Day;
      }
      if (latestData.SLOT) {
        delete latestData.SLOT;
      }
      const keys = Object.keys(latestData);
      for (let j = 0; j < keys.length; j++) {
        const paramData = {
          columnName: keys[j],
          value: [latestData[keys[j]]],
          section: meters[i].NAME,
        };
        meterData.push(paramData);
      }
    }
  }
  return meterData;
}
function latestByDateTime(data) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const MONTH = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const toTs = (row) => {
    // Prefer "Date_Time", fallback to "DATE_TIME", else "DATE"+"TIME"
    const raw =
      row.Date_Time ||
      row.DATE_TIME ||
      (row.DATE && row.TIME ? `${row.DATE} ${row.TIME}` : null);
    if (!raw) return -Infinity;

    // Expect formats like "26/Sep/2025 14:50:00"
    const m =
      /^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/.exec(
        raw.trim()
      );
    if (!m) return -Infinity;

    const [, dd, mon, yyyy, hh, mm, ss] = m;
    const d = new Date(
      Number(yyyy),
      MONTH[mon],
      Number(dd),
      Number(hh),
      Number(mm),
      Number(ss)
    );
    return d.getTime();
  };

  // Reduce to the row with the max timestamp (ties: keep the later one encountered)
  return data.reduce((best, row) => (toTs(row) >= toTs(best) ? row : best));
}
module.exports = { handleMeterLogic };
