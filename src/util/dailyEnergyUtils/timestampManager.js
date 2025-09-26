function getStructuredTimeStampsForDailyEnergyInverter(
  startTimeStamp,
  endTimeStamp,
  readingAt
) {
  const secondsPerDay = 86400;
  const fromEpoch = manageTime(startTimeStamp);
  const toEpoch = manageTime(endTimeStamp);
  const readAfter = getReadingTime(readingAt);
  let timestamps = {};
  if (fromEpoch.dayStart === toEpoch.dayStart) {
    let date = epochToISTDate(fromEpoch.dayStart);
    timestamps[date] = {
      from: fromEpoch.dayStart,
      to: fromEpoch.dayStart + readAfter,
    };
  } else if (
    (toEpoch.dayEnd - fromEpoch.dayStart) / secondsPerDay < 2 &&
    (toEpoch.dayEnd - fromEpoch.dayStart) / secondsPerDay > 1
  ) {
    let dateFirst = epochToISTDate(fromEpoch.dayStart);
    timestamps[dateFirst] = {
      from: fromEpoch.dayStart,
      to: fromEpoch.dayStart + readAfter,
    };
    let dateSecond = epochToISTDate(toEpoch.dayStart);
    timestamps[dateSecond] = {
      from: toEpoch.dayStart,
      to: toEpoch.dayStart + readAfter,
    };
  } else if ((toEpoch.dayEnd - fromEpoch.dayStart) / secondsPerDay >= 2) {
    let flag = false;
    let newFrom = fromEpoch.dayStart;
    let newTo = fromEpoch.dayStart + readAfter;
    let j = 0;
    let date = "";
    while (!flag) {
      date = epochToISTDate(newFrom);
      timestamps[date] = {
        from: newFrom,
        to: newTo,
      };
      newFrom += 86400;
      newTo = newFrom + readAfter;
      if (newFrom > toEpoch.dayEnd) {
        flag = true;
      } else {
        j++;
      }
    }
  }
  return timestamps;
}

function manageTime(istStr) {
  const [datePart, timePart] = istStr.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);

  function toUTCepoch(y, m, d, h, min, s) {
    const istDate = new Date(Date.UTC(y, m - 1, d, h, min, s));
    const utcDate = new Date(istDate.getTime() - 330 * 60 * 1000);
    return Math.floor(utcDate.getTime() / 1000);
  }

  const epoch = toUTCepoch(year, month, day, hour, minute, second);

  const dayStart = toUTCepoch(year, month, day, 0, 0, 0);

  const dayEnd = toUTCepoch(year, month, day, 23, 59, 59);

  return {
    epoch,
    dayStart,
    dayEnd,
  };
}

function epochToISTDate(epoch) {
  const date = new Date(epoch * 1000);

  const options = { timeZone: "Asia/Kolkata" };
  const istDate = new Date(date.toLocaleString("en-US", options));

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getReadingTime(readingAt) {
  const [hrs, mins, secs] = readingAt.split(":").map(Number);
  const totalSeconds = hrs * 60 * 60 + mins * 60 + secs;
  return totalSeconds;
}

function getCurrentDateIST() {
  const now = new Date();
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);

  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
module.exports = {
  getStructuredTimeStampsForDailyEnergyInverter,
  getCurrentDateIST,
};
