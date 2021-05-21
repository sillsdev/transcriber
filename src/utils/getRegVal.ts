const isElectron = process.env.REACT_APP_MODE === 'electron';
const execa = isElectron ? require('execa') : null;

interface Iexeca {
  stdout: string;
}

const lnRe = /([A-Za-z0-9_\\(\\)]+)[^A-Za-z0-9_]+([A-Z_]+)[^A-Za-z0-9_]+(.*)?/;

export const getRegVal = async (key: string, name: string) => {
  const { stdout } = (await execa('reg', ['query', key])) as Iexeca;
  let val = stdout
    .split('\n')
    .map((ln) => {
      const match = lnRe.exec(ln);
      return match && match[1] === name
        ? match[3]
        : match && name === '' && match[1] === '(Default)'
        ? match[3]
        : undefined;
    })
    .filter((r) => r);
  return val.length > 0 ? val[0] : '';
};
