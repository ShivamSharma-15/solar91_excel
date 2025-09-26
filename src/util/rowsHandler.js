async function infuseSection(string, json) {
  for (let i = 0; i < json.length; i++) {
    for (let j = 0; j < json[i].rows.length; j++) {
      for (let k = 0; k < json[i].rows[j].length; k++) {
        // let json[i].rows[j][k] = json[i].rows[j][k];
        if (json[i].rows[j][k].columnName === "Date") {
          continue;
        } else {
          json[i].rows[j][k].section = string;
        }
      }
    }
  }
  return json;
}

module.exports = { infuseSection };
