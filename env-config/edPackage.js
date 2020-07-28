var fs = require('fs-extra');

var argEnv = process.argv.length > 2 ? process.argv[2] : '';

var content = fs.readFileSync('package.json', 'utf-8');
var json = JSON.parse(content);
json.main = 'public/electron{0}.js'.replace('{0}', argEnv);
json.homepage = './';
fs.writeFileSync('package.json', JSON.stringify(json, null, 2) + '\n');
