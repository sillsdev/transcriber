import { IExeca } from '../model';
const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

export const getWhereis = async (key: string, scall?: any) => {
  let val: string | undefined = undefined;
  try {
    const { stdout } = (await (scall || execa)('whereis', [key], {
      env: { ...{ ...process }.env, DISPLAY: ':0' },
    })) as IExeca;
    if (typeof stdout === 'string') val = stdout;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const res = val ? val : '';
  const opts = res.trim().split(' ');
  for (let item of opts) {
    if (item === '') continue;
    const itemName = item.split('/').pop();
    if (itemName === key) return item;
  }
  return '';
};
