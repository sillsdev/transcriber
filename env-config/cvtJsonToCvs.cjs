function JsonToCsv(json) {
  const data = JSON.parse(json);
  const headers = Object.keys(data[0]);

  let csv = headers.join(",") + "\n";

  for (let obj of data) {
    let values = headers.map((header) => obj[header]);
    csv += values.join(",") + "\n";
  }

  return csv;
}

// Example usage:
// const csvData = `name,age,city
// "John, Doe",30,"New York, NY"
// "Jane, Smith",25,"Los Angeles, CA"
// "Doe, John",22,"Chicago, IL"`;

// console.log(csvToJson(csvData));

const readFileSync = require("fs").readFileSync;
const writeFile = require("write");

var argName = process.argv.length > 2 ? process.argv[2] : "book-es";

const data = readFileSync(
  __dirname + `/../public/localization/${argName}.json`,
  "utf8"
).replace(/^\uFEFF/, "");

const csv = JsonToCsv(data);

writeFile.sync(__dirname + `/../public/localization/${argName}.csv`, csv);
