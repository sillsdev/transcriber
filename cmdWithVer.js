var fs = require('fs-extra');
var { spawnSync } = require('child_process');
var path = require('path');
var { StringDecoder } = require('string_decoder');

var cmd = process.argv.length > 2 ? process.argv[2] : '';
var name = process.argv.length > 3 ? process.argv[3] : 'doScript.sh';

const cleanFileName = (str) =>
  str
    .replace(/[<>|:"*?\\/]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, 'file');

name = cleanFileName(name);
var content = fs.readFileSync(path.join(__dirname, '/package.json'), 'utf-8');
var json = JSON.parse(content);
const errFile = 'error.rep';
const resFile = 'result.rep';
if (fs.existsSync(errFile)) fs.unlinkSync(errFile);
if (fs.existsSync(resFile)) fs.unlinkSync(resFile);
var result = cmd
  .replace(/{version}/gi, json.version)
  .replace(/\\n/g, ' >>result.rep 2>>error.rep\n');
fs.writeFileSync(name, result + ' >>result.rep 2>>error.rep\n');
var res = !name.endsWith('.ps1')
  ? spawnSync(name, [], { shell: true })
  : spawnSync('powershell', ['-File', name], { shell: true });
fs.unlinkSync(name);
const decoder = new StringDecoder('utf8');
if (res.status) {
  console.log(`stderr: "${decoder.write(res.stderr)}"`);
}
const displayResultFile = (fileName, title) => {
  const resBuf = fs.readFileSync(fileName);
  const resVal = decoder.write(resBuf);
  const len = resVal.length;
  if (len !== 0) console.log(title, resVal);
  return len;
};
displayResultFile(resFile, 'OUTPUT: ');
var err = displayResultFile(errFile, 'ERROR: ');
process.exit(res.status | err);
