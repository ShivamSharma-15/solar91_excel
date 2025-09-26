const axios = require("axios");
const { readJsonFromFile } = require("../../util/jsonEditor");
require("dotenv").config();

async function postUnitsDataTimeRange(units, params, timestamps) {
  if (typeof params === "string") {
    const tempParam = params;
    const paramArr = [];
    paramArr.push(tempParam);
    params = paramArr;
  }
  const bodies = makeBody(units, params, timestamps);
  const dailyData = {};
  const keys = Object.keys(bodies);
  const authObject = await readJsonFromFile("../data/authToken.json");
  const authToken = authObject.auth_token;

  for (const key of keys) {
    const value = bodies[key];
    const daysData = await makePostForTimeRangeData(value, authToken);
    dailyData[key] = daysData;
  }
  return dailyData;
}

function makeBody(unitsArray, paramsArray, timestamps) {
  let bodies = {};
  const unitsAndParams = getUnitsAndParams(unitsArray, paramsArray);
  for (const date in timestamps) {
    const data = timestamps[date];
    bodies[date] = {
      units: unitsAndParams,
      from: data.from,
      to: data.to,
    };
  }
  return bodies;
}

function getUnitsAndParams(unitsArray, paramsArray) {
  let units = {};
  for (let i = 0; i < unitsArray.length; i++) {
    units[`${unitsArray[i]}`] = paramsArray;
  }
  return units;
}

async function makePostForTimeRangeData(body, authToken) {
  try {
    const response = await axios.post(
      `${process.env.HOST}/integrations/v1/unit_data`,
      body,
      {
        headers: {
          "x-api-key": process.env.X_API_KEY,
          "x-auth-token": authToken,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending data:", error.message);
  }
}

module.exports = { postUnitsDataTimeRange };
