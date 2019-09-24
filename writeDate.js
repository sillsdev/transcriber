var writeFile = require('write');
var moment = require('moment');
var content = '{ "date": "' + moment().format('L LT Z') + '" }';
writeFile.sync('src/buildDate.json', content);
