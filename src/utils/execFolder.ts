import path from 'path-browserify';
const ipc = (window as any)?.electron;

export const execFolder = async () => {
  const folder = await ipc?.execPath();
  const fromStr = path.join('node_modules', 'electron', 'dist');
  const toStr = path.join('dist', 'win-unpacked');
  const replaced = folder.replace(fromStr, toStr);
  const result = path.dirname(replaced);
  return result;
};
