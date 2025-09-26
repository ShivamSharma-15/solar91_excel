const {
  getUnitKeysModel,
  setUnitModel,
  removeUnitsModel,
  insertUnits,
} = require("../model/unitModel");
const { readJsonFromFile } = require("../util/jsonEditor");
const axios = require("axios");
const { URLSearchParams } = require("url");
require("dotenv").config();

async function manageUnitsLogic(sites) {
  for (let i = 0; i < 1; i++) {
    let freshUnits = await getAllSiteUnits(sites[i].site_key, sites[i].site_id);
    let units = await getUnitKeysModel(sites[i].site_id);
    if (!units) {
      await insertUnits(freshUnits);
    }
    let managedUnits = diffUnits(freshUnits, units);
    if (managedUnits.removed.length !== 0) {
      for (let j = 0; j < managedUnits.removed.length; j++) {
        if (process.env.UNIT_FLAG !== "1") {
          await removeUnitsModel(
            managedUnits.removed[j].unit_key,
            managedUnits.removed[j].site_id
          );
        }
      }
    }
    if (managedUnits.added.length !== 0) {
      if (process.env.UNIT_FLAG !== "1") {
        await insertUnits(managedUnits.added);
      }
    }
  }
  return true;
}

async function getAllSiteUnits(siteKey, siteId) {
  const authObject = await readJsonFromFile("../data/authToken.json");
  const authToken = authObject.auth_token;
  let units = [];
  let flag = false;
  let j = 1;
  while (!flag) {
    let params = {
      per: 10,
      page: j,
    };
    let pageUnits = await fetchUnitsData(siteKey, params, authToken);
    pageUnits.forEach((obj) => {
      obj.site_id = siteId;
    });

    if (pageUnits.length !== 0) {
      units = units.concat(pageUnits);
      j++;
    } else {
      flag = true;
    }
  }
  return units;
}

async function fetchUnitsData(siteKey, params, authToken) {
  try {
    const response = await axios.get(
      `${process.env.HOST}/integrations/v1/site/${siteKey}/units`,
      {
        headers: {
          "x-api-key": process.env.X_API_KEY,
          "x-auth-token": authToken,
        },
        params,
      }
    );
    const managedData = manageUnitsMetadata(response.data.units);
    return managedData;
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
}

function manageUnitsMetadata(units) {
  const transformed = units.map(({ unit_category_name, unit_key, name }) => ({
    unit_type: unit_category_name,
    unit_key,
    unit_name: name,
  }));
  return transformed;
}

function diffUnits(freshUnits, units) {
  const freshKeys = new Set(freshUnits.map((u) => u.unit_key));
  const existingKeys = new Set(units.map((u) => u.unit_key));

  const removed = units
    .filter((u) => !freshKeys.has(u.unit_key))
    .map((u) => ({
      unit_key: u.unit_key,
      site_id: u.site_id,
    }));
  const added = freshUnits.filter((u) => !existingKeys.has(u.unit_key));

  return { removed, added };
}
async function getSiteUnitsLogic(site) {
  const response = await axios.get(`${process.env.LOGIC_POWER_URL}/Get_LIST`, {
    params: {
      PLANT_CODE: site.plant_code,
      LOGIN_ID: site.site_user_id,
      PASS_KEY: site.pass_key,
      USER_CODE: process.env.USER_CODE_LOGIC,
      APP_KEY: process.env.APP_KEY_LOGIC,
    },
  });
  return response.data.data;
  // console.log(JSON.stringify(response.data));
}
module.exports = { manageUnitsLogic, getSiteUnitsLogic };
