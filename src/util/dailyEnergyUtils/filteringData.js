function enrichFilterValues(filterValues, unitData) {
  const unitMetaMap = unitData.reduce((acc, unit) => {
    acc[unit.unit_key] = unit.unit_metadata;
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(filterValues).map(([date, units]) => [
      date,
      units.map((u) => ({
        ...u,
        ...unitMetaMap[u.unitKey],
      })),
    ])
  );
}
function pickMaxByTimestampAndValue(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  const normalize = (t) =>
    typeof t === "number"
      ? t
      : typeof t === "string"
      ? Date.parse(t)
      : Number.NEGATIVE_INFINITY;

  let maxIdx = 0;
  let maxTs = normalize(arr[0]?.timestamp);
  let maxVal = arr[0]?.value ?? Number.NEGATIVE_INFINITY;

  for (let i = 1; i < arr.length; i++) {
    const ts = normalize(arr[i]?.timestamp);
    const val = arr[i]?.value ?? Number.NEGATIVE_INFINITY;

    if (ts > maxTs || (ts === maxTs && val > maxVal)) {
      maxTs = ts;
      maxVal = val;
      maxIdx = i;
    }
  }

  return maxTs === Number.NEGATIVE_INFINITY ? [] : [arr[maxIdx]];
}

function collapseToLatestPerUnit(dataByDate) {
  if (!dataByDate || typeof dataByDate !== "object") return dataByDate;

  const out = {};
  for (const dateKey of Object.keys(dataByDate)) {
    const units = dataByDate[dateKey];
    if (!units || typeof units !== "object") {
      out[dateKey] = units;
      continue;
    }

    const newUnits = {};
    for (const unitKey of Object.keys(units)) {
      const unitObj = units[unitKey];
      if (!unitObj || typeof unitObj !== "object") {
        newUnits[unitKey] = unitObj;
        continue;
      }
      const { data, ...rest } = unitObj;
      newUnits[unitKey] = {
        ...rest,
        data: pickMaxByTimestampAndValue(data),
      };
    }
    out[dateKey] = newUnits;
  }
  return out;
}

function getFilteredValues(inputData) {
  const output = {};
  for (const [date, units] of Object.entries(inputData)) {
    output[date] = [];

    for (const [unitKey, unitData] of Object.entries(units)) {
      const { unit_name: unitName, data } = unitData;
      if (data && data.length > 0) {
        const value = data[0].value;

        output[date].push({
          unitName,
          unitKey,
          value,
        });
      }
    }
  }

  return output;
}
function infuseTotals(data) {
  for (let i = 0; i < data.length; i++) {
    let siteSpecificRows = data[i].rows;
    for (let j = 0; j < siteSpecificRows.length; j++) {
      let total = addTotalGeneration(siteSpecificRows[j]);
      data[i].rows[j] = total;
    }
  }
  return data;
}
function addTotalGeneration(data) {
  // Calculate the sum
  const total = data.reduce((sum, item) => {
    if (
      typeof item.value === "number" &&
      !item.columnName.startsWith("Generation Per kW") &&
      !item.columnName.startsWith("DC Capacity")
    ) {
      return sum + item.value;
    }
    return sum;
  }, 0);

  // Append the new JSON object
  data.push({
    columnName: "Total Generation",
    value: total,
    section: "Inverter",
  });
  return data;
}

module.exports = {
  infuseTotals,
  enrichFilterValues,
  collapseToLatestPerUnit,
  getFilteredValues,
};
