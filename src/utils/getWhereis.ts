const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

interface Iexeca {
  stdout: string;
}

export const getWhereis = async (key: string) => {
  let val: string | undefined = undefined;
  try {
    const { stdout } = (await execa('whereis', [key])) as Iexeca;
    val = stdout;
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return val && val.length > 0 ? val : '';
};
