import { IExeca } from '../model';
import { getWhereis } from '../utils/getWhereis';
// const execa = require('execa');

let res: string | undefined = '';

const scall = async (cmd: string, arg: string[]) => {
  return new Promise(function (resolve, reject) {
    resolve({
      stdout: res,
    } as IExeca);
  });
};

test('no response', async () => {
  res = undefined;
  expect(await getWhereis('xyAb', scall)).toBeFalsy();
});

test('audacity header response', async () => {
  res = 'audacity:';
  expect(await getWhereis('audacity', scall)).toBeFalsy();
});

test('audacity header snap response', async () => {
  res = 'audacity: /snap/bin/audacity';
  expect(await getWhereis('audacity', scall)).toBe('/snap/bin/audacity');
});

test('audacity header snap response with newline', async () => {
  res = 'audacity: /snap/bin/audacity\n';
  expect(await getWhereis('audacity', scall)).toBe('/snap/bin/audacity');
});

// fails on Windows
// test('audacity live', async () => {
//   expect(await getWhereis('audacity', execa)).toBe('/snap/bin/audacity');
// });

test('python not installed', async () => {
  res = 'python: ';
  expect(await getWhereis('python', scall)).toBeFalsy();
});

test('python with header not installed', async () => {
  res = 'python: /usr/bin/python3.9 /opt/python2.7';
  expect(await getWhereis('python', scall)).toBeFalsy();
});

test('python installed', async () => {
  res = 'python: /usr/bin/python /usr/bin/python3.9 /opt/python2.7';
  expect(await getWhereis('python', scall)).toBe('/usr/bin/python');
});
