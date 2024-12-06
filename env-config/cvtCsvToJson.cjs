function csvToJson(csv) {
  const lines = csv.split(/\r?\n/);
  const result = [];
  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    let currentLine = lines[i];
    let insideQuotes = false;
    let value = "";
    let values = [];

    for (let char of currentLine) {
      if (char === '"' && !insideQuotes) {
        insideQuotes = true;
      } else if (char === '"' && insideQuotes) {
        insideQuotes = false;
      } else if (char === "," && !insideQuotes) {
        values.push(value);
        value = "";
      } else {
        value += char;
      }
    }
    values.push(value);

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j];
    }

    result.push(obj);
  }

  return JSON.stringify(result, null, 2);
}

// Example usage:
// const csvData = `name,age,city
// "John, Doe",30,"New York, NY"
// "Jane, Smith",25,"Los Angeles, CA"
// "Doe, John",22,"Chicago, IL"`;

// console.log(csvToJson(csvData));

const readFileSync = require("fs").readFileSync;
const writeFile = require("write");

var argName =
  process.argv.length > 2 ? process.argv[2] : "biblebrain_2024-08-22";

const data = readFileSync(__dirname + `/../src/assets/${argName}.csv`, "utf8");

const json = csvToJson(data);

writeFile.sync(__dirname + `/../src/assets/${argName}.json`, json);
