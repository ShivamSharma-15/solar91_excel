const pool = require("../config/db");
async function getSiteKeysModel() {
  try {
    const result = await pool.query("SELECT * FROM sites;");
    if (result[0].length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    console.log("Error in model getSiteKeyModel", err.message);
  }
}

async function addNewSiteModel(siteKey, siteName) {
  try {
    const [result] = await pool.query(
      "INSERT INTO sites (site_key, site_name) VALUES (?, ?);",
      [siteKey, siteName]
    );

    if (!result || !result.insertId) {
      console.log("error");
    }

    const [rows] = await pool.query("SELECT * FROM sites WHERE site_id = ?", [
      result.insertId,
    ]);

    if (!rows || rows.length !== 1) {
      console.log("Failed to fetch sites", 500, true, {
        service: "addNewSiteModel",
        insertId: result.insertId,
      });
    }

    return rows[0];
  } catch (err) {
    console.log(err.message);
  }
}
async function getSiteById(siteId) {
  try {
    const result = await pool.query("SELECT * FROM sites WHERE site_id = ?;", [
      siteId,
    ]);
    if (result[0].length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    console.log("Error in model getSiteKeyModel", err.message);
  }
}

async function getSiteLogicPower() {
  try {
    const [rows] = await pool.query("SELECT * FROM logicsites;");
    return rows;
  } catch (err) {
    console.log("Error in model getSiteLogicPower", err.message);
  }
}

module.exports = {
  getSiteKeysModel,
  addNewSiteModel,
  getSiteById,
  getSiteLogicPower,
};
