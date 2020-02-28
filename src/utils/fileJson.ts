const isElectron = process.env.REACT_APP_MODE === 'electron';
var fs = isElectron ? require('fs-extra') : null;
const convert = require('xml-js');

export const fileJson = (settings: string) => {
  if (fs.existsSync(settings)) {
    const data = fs.readFileSync(settings, 'utf-8');
    const jsonStr = convert.xml2json(data, { compact: true, spaces: 2 });
    return JSON.parse(jsonStr);
  }
  return null;
};

export default fileJson;
