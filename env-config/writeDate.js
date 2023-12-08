var writeFile = require('write');
var { DateTime } = require('luxon');
var dt = DateTime.now().toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
var tm = DateTime.now().toLocaleString(DateTime.TIME_WITH_SHORT_OFFSET);
var content = `{ "date": "${dt} ${tm}" }`;
writeFile.sync('src/buildDate.json', content);
