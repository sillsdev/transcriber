const fs = require('fs-extra');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf-8');

if (process.argv.length <= 3 || !fs.existsSync(process.argv[1])) {
  console.log('Usage: node vrs2json.js [eng.vrs] [code-num.json]');
  console.log(`where\n[eng.vrs] is a versification file`);
  process.abort();
}

const vrsFileBuf = fs.readFileSync(process.argv[2], 'utf-8');
const vrsFileVal = decoder.write(vrsFileBuf);
const vrsFileLines = vrsFileVal
  .split('\n')
  .filter(
    (line) =>
      !line.startsWith('#') && line.trim().length !== 0 && line.indexOf('=') < 0
  );
const vrsArr = vrsFileLines.map((line, index) => [
  line.trim().split(' ')[0],
  index + 1,
]);
fs.writeFileSync(process.argv[3], JSON.stringify(vrsArr), {
  encoding: 'utf-8',
  replace: true,
});
