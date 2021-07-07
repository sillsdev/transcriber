import { IExeca } from '../model';
import { getWhereis } from '../utils';

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

test('audacity no response', async () => {
  expect(await getWhereis('audacity', scall)).toBeFalsy();
});

test('audacity header response', async () => {
  res = 'audacity:';
  expect(await getWhereis('audacity', scall)).toBeFalsy();
});

test('audacity snap response', async () => {
  res = '/snap/audacit/ab12/audacity';
  expect(await getWhereis('audacity', scall)).toBe(
    '/snap/audacit/ab12/audacity'
  );
});

test('audacity header snap response', async () => {
  res = 'audacity: /snap/audacit/ab12/audacity';
  expect(await getWhereis('audacity', scall)).toBe(
    '/snap/audacit/ab12/audacity'
  );
});

test('python not installed', async () => {
  expect(await getWhereis('python', scall)).toBeFalsy();
});

test('python not installed', async () => {
  res = '/usr/bin/python3.9 /opt/python2.7';
  expect(await getWhereis('python', scall)).toBeFalsy();
});

test('python with header not installed', async () => {
  res = 'python: /usr/bin/python3.9 /opt/python2.7';
  expect(await getWhereis('python', scall)).toBeFalsy();
});

test('python installed', async () => {
  res = '/usr/bin/python /usr/bin/python3.9 /opt/python2.7';
  expect(await getWhereis('python', scall)).toBe('/usr/bin/python');
});
