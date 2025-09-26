const { getSiteKeysModel, addNewSiteModel } = require("../model/siteModel");
const { readJsonFromFile } = require("../util/jsonEditor");
const { compareSitesData } = require("../util/sitesUtil");

const axios = require("axios");
require("dotenv").config();

async function manageSiteLogic() {
  const sites = await getSiteKeysModel();
  if (!sites || sites.length === 0) {
    return false;
  }
  const freshSitesData = await getFreshSites();

  if (!freshSitesData || freshSitesData.length === 0) {
    return false;
  } else {
    let dataConsensus = compareSitesData(freshSitesData, sites);
    if (dataConsensus.removed.length !== 0) {
      if (process.env.SITE_FLAG !== "1") {
        await removeSiteModel(dataConsensus.removed);
      }
    }
    if (dataConsensus.added.length !== 0) {
      if (process.env.SITE_FLAG !== "1") {
        for (let i = 0; i < dataConsensus.added.length; i++) {
          await addNewSiteModel(
            dataConsensus.added[i].site_key,
            dataConsensus.added[i].site_name
          );
        }
      }
    }
  }
  const freshSites = await getSiteKeysModel();
  return freshSites;
}

async function getFreshSites() {
  const authObject = await readJsonFromFile("../data/authToken.json");
  const authToken = authObject.auth_token;
  let flag = false;
  let siteData = [];
  let j = 1;
  while (!flag) {
    let params = {
      page: j,
      per: 10,
    };
    let pageData = await makeSiteRequest(params, authToken);
    if (pageData.length === 0) {
      flag = true;
    } else {
      siteData = siteData.concat(pageData);
      j++;
    }
  }
  return siteData;
}

async function makeSiteRequest(params, authToken) {
  try {
    const response = await axios.get(
      `${process.env.HOST}/integrations/v1/sites`,
      {
        headers: {
          "x-api-key": process.env.X_API_KEY,
          "x-auth-token": authToken,
        },
        params,
      }
    );
    return response.data.sites;
  } catch (error) {
    console.error("Error fetching site data:", error.message);
  }
}
async function getSitePassKeyLogic(site) {
  try {
    const payload = new URLSearchParams({
      USER_ID: site.site_user_id,
      PASSWORD: site.site_password,
      USER_CODE: process.env.USER_CODE_LOGIC,
      APP_KEY: process.env.APP_KEY_LOGIC,
    });

    const response = await axios.post(
      `${process.env.LOGIC_POWER_URL}/Login`,
      payload.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const data = {
      PLANT_Code: response.data.PLANT_Code,
      PASS_KEY: response.data.PASS_KEY,
    };
    return data;
  } catch (error) {
    console.log("Error in getSiteUnitsLogic", error.message);
    throw error;
  }
}
module.exports = { manageSiteLogic, getSitePassKeyLogic };
