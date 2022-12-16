var path = require('path-browserify');
const ipc = (window as any)?.electron;

export const createFolder = (folder: string) => {
  // Create folder if it doesn't exist
  ipc?.createFolder(folder);
};

export const createPathFolder = (fullName: string) => {
  return createFolder(fullName.substring(0, fullName.lastIndexOf(path.sep)));
};
