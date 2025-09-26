const pool = require("../../config/db");
async function getInvertersBySiteModel(site_id) {
  try {
    const result = await pool.query(
      "SELECT * FROM units where site_id = ? AND unit_type = ?",
      [site_id, "Inverter"]
    );
    if (result[0].length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    console.log("Error in model getUnitKeyModel", err.message);
  }
}
async function getDerivedBySiteModel(site_id) {
  try {
    const result = await pool.query(
      "SELECT * FROM units where site_id = ? AND unit_type = ?",
      [site_id, "Derived"]
    );
    if (result[0].length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    console.log("Error in model getUnitKeyModel", err.message);
  }
}
async function getMetersBySiteModel(site_id) {
  try {
    const result = await pool.query(
      "SELECT * FROM units where site_id = ? AND unit_type = ?",
      [site_id, "Meter"]
    );
    if (result[0].length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    console.log("Error in model getUnitKeyModel", err.message);
  }
}
async function getWmsBySiteModel(site_id) {
  try {
    const result = await pool.query(
      "SELECT * FROM units where site_id = ? AND unit_type = ?",
      [site_id, "Weather Monitoring"]
    );
    if (result[0].length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    console.log("Error in model getUnitKeyModel", err.message);
  }
}
async function getMetaDataLogicInverter(id, site_id) {
  const [result] = await pool.query(
    "SELECT * FROM logicunits where id = ? AND site_id = ?",
    [id, site_id]
  );
  if (!result || result.length === 0) {
    return null;
  }
  return result[0];
}
module.exports = {
  getInvertersBySiteModel,
  getMetersBySiteModel,
  getWmsBySiteModel,
  getDerivedBySiteModel,
  getMetaDataLogicInverter,
};
