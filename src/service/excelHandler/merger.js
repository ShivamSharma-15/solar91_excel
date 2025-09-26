function mergeByDate(json1, json2) {
  let data = JSON.parse(JSON.stringify(json1));
  for (let i = 0; i < json1.length; i++) {
    let sheet_id = json1[i]["sheet_id"];
    let index = json2.findIndex((col) => (col.sheet_id = sheet_id));
    let d1 = json2[index].rows;
    let d2 = json1[i].rows;
    let dataa = mergeIt(d2, d1);
    data[i].rows = dataa;
  }
  return data;
}
function mergeIt(data1, data2) {
  for (let i = 0; i < data1.length; i++) {
    let arrSmall = data1[i];
    let date = data1[i].find((item) => item.columnName === "Date");
    date = date.value;
    let index = getIndexForThatDate(date, data2);
    data2[index] = data2[index].filter((item) => item.columnName !== "Date");
    data1[i] = data1[i].concat(data2[index]);
  }
  return data1;
}

function getIndexForThatDate(dateToSearch, data) {
  for (let i = 0; i < data.length; i++) {
    let arrSmall = data[i];
    let dateObj = data[i].find((item) => item.columnName === "Date");
    let datee = dateObj?.value;
    if (datee === dateToSearch) {
      return i;
    }
  }
}

module.exports = { mergeByDate };
