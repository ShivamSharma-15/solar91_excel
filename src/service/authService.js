const axios = require("axios");
const { saveJsonToFile } = require("../util/jsonEditor");
require("dotenv").config();

async function setAuthToken() {
  const authToken = await getAuthToken();
  let authJson = {
    auth_token: authToken,
  };
  await saveJsonToFile(authJson, "../data/authToken.json");
  return true;
}
async function getAuthToken() {
  const body = {
    email: process.env.LOGIN_EMAIL,
    password: process.env.LOGIN_PASSWORD,
  };
  try {
    const response = await axios.post(
      `${process.env.HOST}/integrations/v1/api_sign_in`,
      body,
      {
        headers: {
          "x-api-key": process.env.X_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.auth_token;
  } catch (error) {
    console.error("Error sending data:", error.message);
  }
}

module.exports = { setAuthToken };
