import { isElectron } from '../api-variable';
var fs = isElectron ? require('fs-extra') : undefined;

export const createFolder = (folder: string) => {
  // Create folder if it doesn't exist
  try {
    fs.statSync(folder);
  } catch (err) {
    if (err.code === 'ENOENT') fs.mkdirSync(folder);
  }
};
