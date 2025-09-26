const pool = require("../config/db");
async function getUnitKeysModel(siteId) {
  try {
    const result = await pool.query("SELECT * FROM units where site_id = ?;", [
      siteId,
    ]);
    if (result[0].length === 0) {
      return null;
    }
    return result[0];
  } catch (err) {
    console.log("Error in model getUnitKeyModel", err.message);
  }
}
async function setUnitModel(unit_key, unit_name, unit_type, site_id) {
  try {
    const [result] = await pool.query(
      "INSERT INTO units (unit_key, unit_name, unit_type, site_id) VALUES (?, ?, ?);",
      [unit_key, unit_name, unit_type, site_id]
    );

    if (!result || !result.insertId) {
      console.log("error");
    }

    const [rows] = await pool.query("SELECT * FROM units WHERE unit_id = ?", [
      result.insertId,
    ]);

    if (!rows || rows.length !== 1) {
      console.log("Failed to fetch units", 500, true, {
        service: "setUnitModel",
        insertId: result.insertId,
      });
    }

    return rows[0];
  } catch (err) {
    console.log(err.message);
  }
}
async function removeUnitsModel(unit_key, site_id) {
  try {
    const result = await pool.query(
      "DELETE FROM units WHERE unit_key = ? AND site_id = ?",
      [unit_key, site_id]
    );
    return true;
  } catch (err) {
    console.log("Error in model error in removeUnitsModel", err.message);
  }
}
async function insertUnits(units, table = "units") {
  if (!units || units.length === 0) return;
  const columns = Object.keys(units[0]);
  const placeholders = units
    .map(() => `(${columns.map(() => "?").join(",")})`)
    .join(",");
  const values = units.flatMap((obj) => columns.map((col) => obj[col]));

  const sql = `
    INSERT INTO ${table} (${columns.join(",")})
    VALUES ${placeholders}
  `;

  const [result] = await pool.execute(sql, values);
  return result;
}
module.exports = {
  setUnitModel,
  getUnitKeysModel,
  removeUnitsModel,
  insertUnits,
};
