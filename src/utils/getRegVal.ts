import { IExeca } from '../model';
const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

const lnRe = /([A-Za-z0-9_\\(\\)]+)[^A-Za-z0-9_]+([A-Z_]+)[^A-Za-z0-9_]+(.*)?/;

export const getRegVal = async (key: string, name: string) => {
  let val: (string | undefined)[] = [];
  try {
    const { stdout } = (await execa('reg', ['query', key])) as IExeca;
    val =
      typeof stdout === 'string'
        ? stdout
            .split('\n')
            .map((ln) => {
              const match = lnRe.exec(ln);
              return match && match[1] === name
                ? match[3]
                : match && name === '' && match[1] === '(Default)'
                ? match[3]
                : undefined;
            })
            .filter((r) => r)
        : [];
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
  return val.length > 0 ? val[0] : '';
};
