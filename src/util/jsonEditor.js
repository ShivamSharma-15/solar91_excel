const fs = require("fs").promises;
const path = require("path");

async function saveJsonToFile(jsonData, fileName) {
  try {
    const filePath = path.resolve(__dirname, fileName);
    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.writeFile(filePath, jsonString, "utf8");
  } catch (error) {
    console.error("Error saving JSON to file:", error);
  }
}

async function readJsonFromFile(filePath = "./data.json") {
  try {
    const absolutePath = path.resolve(__dirname, filePath);
    const data = await fs.readFile(absolutePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON from file:", error);
    return null;
  }
}

module.exports = { saveJsonToFile, readJsonFromFile };
