var fs = require('fs-extra');
var { spawnSync } = require('child_process');
var path = require('path');
var { StringDecoder } = require('string_decoder');

if (process.argv.length <= 2) {
  console.log(`Usage: node setWinEnv.js [rm] [env] [script-file] [yml-file]`);
  console.log(`where\nrm is the remove settings command`);
  console.log(`env is the enironment in the yml file`);
  console.log(`script-file is the name of the script - ends with .ps1`);
  console.log(`yml-file is the name of the YAML file - two folders up`);
}
var env = process.argv.length > 2 ? process.argv[2] : 'dev';
var nameN = 3;
var rm = env === 'rm';
if (rm) {
  env = process.argv.length > 3 ? process.argv[3] : 'dev';
  nameN = 4;
}
var name = process.argv.length > nameN ? process.argv[nameN] : 'doScript.ps1';
var yN = nameN + 1;
var ymlNm = process.argv.length > yN ? process.argv[yN] : 'serverless.env.yml';

const loadYml = () => {
  var sets = {};
  var envs = {};
  var curEnv = '';

  var filename = path.join(__dirname, '..', '..', ymlNm);
  if (!fs.existsSync(filename))
    filename = path.join(__dirname, '..', '..', 'web-transcriber-lambda', 'src', ymlNm);
  if (!fs.existsSync(filename))
    console.log(`yml-file not found`, ymlNm);
  else {
    var settingsContent = fs.readFileSync(filename,
      'utf-8'
    );
    settingsContent.split('\n').forEach((line) => {
      if (/[a-z]/i.test(line.slice(0, 1))) {
        if (curEnv !== '') {
          envs[curEnv] = sets;
          sets = {};
        }
        curEnv = line.slice(0, line.indexOf(':'));
      } else if (line.slice(0, 1) === ' ') {
        const mat = line.match(/\s*([A-Z_0-9]+):\s*"(.+)"\r?/i);
        if (mat) sets[mat[1]] = mat[2];
      }
    });
    if (curEnv !== '') envs[curEnv] = sets;
  }
  return envs;
};

const envs = loadYml();

const cleanFileName = (str) =>
  str
    .replace(/[<>|:"*?\\/]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, 'file');

name = cleanFileName(name);

const errFile = 'error.rep';
const resFile = 'result.rep';
if (fs.existsSync(errFile)) fs.unlinkSync(errFile);
if (fs.existsSync(resFile)) fs.unlinkSync(resFile);
const myEnv = envs[env];
var cmd = '';
for (var property in myEnv) {
  const val = rm ? `$null` : `'${myEnv[property]}'`;
  cmd += `[System.Environment]::SetEnvironmentVariable('${property}', ${val},[System.EnvironmentVariableTarget]::Machine) >>result.rep 2>>error.rep\n`;
}
fs.writeFileSync(name, cmd);

var res = !name.endsWith('.ps1')
  ? spawnSync(name, [], { shell: true })
  : spawnSync(
      'powershell',
      [
        'Start-Process',
        'powershell.exe',
        '-Verb',
        'RunAs',
        '-ArgumentList',
        `'-noprofile -file "${path.join(__dirname, name)}"'`,
      ],
      {
        shell: true,
      }
    );
// The settings don't seem to happen if this is deleted!
// if (process.argv.length <= nameN) fs.unlinkSync(name);
const decoder = new StringDecoder('utf8');
if (res.status) {
  console.log(`stderr: "${decoder.write(res.stderr)}"`);
}
const displayResultFile = (fileName, title) => {
  if (!fs.existsSync(fileName)) return;
  const resBuf = fs.readFileSync(fileName);
  const resVal = decoder.write(resBuf);
  const len = resVal.length;
  if (len !== 0) console.log(title, resVal);
  return len;
};
displayResultFile(resFile, 'OUTPUT: ');
var err = displayResultFile(errFile, 'ERROR: ');
process.exit(res.status | err);
