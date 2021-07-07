const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

interface Iexeca {
  stdout: string;
}

export const getWhereis = async (key: string, scall?: any) => {
  let val: string | undefined = undefined;
  try {
    const { stdout } = (await (scall || execa)('whereis', [key])) as Iexeca;
    val = stdout;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const res = val ? val : '';
  const opts = res.split(' ');
  for (let item of opts) {
    if (item === '') continue;
    const itemName = item.split('/').pop();
    if (itemName === key) return item;
  }
  return undefined;
};
