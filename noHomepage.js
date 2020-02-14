var fs = require('fs-extra');
var content = fs.readFileSync('package.json', 'utf-8');
var json = JSON.parse(content);
delete json.homepage;
delete json.main;
fs.writeFileSync('package.json', JSON.stringify(json, null, 2) + '\n');
