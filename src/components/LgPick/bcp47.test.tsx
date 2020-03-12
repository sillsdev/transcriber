import '@testing-library/jest-dom/extend-expect';
import { langTags } from './LanguagePicker';
import { bcp47Match, bcp47Parse, bcp47Find, bcp47Index } from './bcp47';

test('test en', async () => {
  expect(bcp47Match('en')).toBeTruthy();
});

test('test eng', async () => {
  expect(bcp47Match('eng')).toBeTruthy();
});

test('test engl - expect false', async () => {
  expect(bcp47Match('engl')).toBeFalsy();
});

test('test e5 - expect false', async () => {
  expect(bcp47Match('e5')).toBeFalsy();
});

test('test es-419', async () => {
  expect(bcp47Match('es-419')).toBeTruthy();
});

test('test nan-Hant-TW', async () => {
  expect(bcp47Match('nan-Hant-TW')).toBeTruthy();
});

test('test nan-Latn', async () => {
  expect(bcp47Match('nan-Latn')).toBeTruthy();
});

test('test nan-Latn-035', async () => {
  expect(bcp47Match('nan-Latn-035')).toBeTruthy();
});

test('test nan-Latn-MY', async () => {
  expect(bcp47Match('nan-Latn-MY')).toBeTruthy();
});

test('test en-x-phonipa', async () => {
  expect(bcp47Match('en-x-phonipa')).toBeTruthy();
});

test('test rm-sursilv', async () => {
  expect(bcp47Match('rm-sursilv')).toBeTruthy();
});

test('test gsw-u-sd', async () => {
  expect(bcp47Match('gsw-u-sd')).toBeTruthy();
});

// Testing irregular codes
test('test i-navajo', async () => {
  expect(bcp47Match('i-navajo')).toBeTruthy();
});

test('test en-GB-oed', async () => {
  expect(bcp47Match('en-GB-oed')).toBeTruthy();
});

test('test i-default', async () => {
  expect(bcp47Match('i-default')).toBeTruthy();
});

test('parse en', async () => {
  expect(bcp47Parse('en')).toEqual({
    language: 'en',
    script: null,
    region: null,
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse eng', async () => {
  expect(bcp47Parse('eng')).toEqual({
    language: 'eng',
    script: null,
    region: null,
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse engl', async () => {
  expect(bcp47Parse('engl')).toEqual({
    language: null,
    script: null,
    region: null,
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse zh-Hans', async () => {
  expect(bcp47Parse('zh-Hans')).toEqual({
    language: 'zh',
    script: 'Hans',
    region: null,
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse zh-CN', async () => {
  expect(bcp47Parse('zh-CN')).toEqual({
    language: 'zh',
    script: null,
    region: 'CN',
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse es-419', async () => {
  expect(bcp47Parse('es-419')).toEqual({
    language: 'es',
    script: null,
    region: '419',
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse zh-Hant-TW', async () => {
  expect(bcp47Parse('zh-Hant-TW')).toEqual({
    language: 'zh',
    script: 'Hant',
    region: 'TW',
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse en-x-phonipa', async () => {
  expect(bcp47Parse('en-x-phonipa')).toEqual({
    language: 'en',
    script: null,
    region: null,
    variant: null,
    extension: null,
    privateUse: ['phonipa'],
    irregular: null,
  });
});

test('parse en-x-phonipa-x-test', async () => {
  expect(bcp47Parse('en-x-phonipa-x-test')).toEqual({
    language: 'en',
    script: null,
    region: null,
    variant: null,
    extension: null,
    privateUse: ['phonipa', 'test'],
    irregular: null,
  });
});

test('parse nan-Latn-035', async () => {
  expect(bcp47Parse('nan-Latn-035')).toEqual({
    language: 'nan',
    script: 'Latn',
    region: '035',
    variant: null,
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse rm-sursilv', async () => {
  expect(bcp47Parse('rm-sursilv')).toEqual({
    language: 'rm',
    script: null,
    region: null,
    variant: 'sursilv',
    extension: null,
    privateUse: [],
    irregular: null,
  });
});

test('parse gsw-u-sd', async () => {
  expect(bcp47Parse('gsw-u-sd')).toEqual({
    language: 'gsw',
    script: null,
    region: null,
    variant: null,
    extension: 'u-sd',
    privateUse: [],
    irregular: null,
  });
});

test('parse i-default', async () => {
  expect(bcp47Parse('i-default')).toEqual({
    language: null,
    script: null,
    region: null,
    variant: null,
    extension: null,
    privateUse: [],
    irregular: 'i-default',
  });
});

test('find en', async () => {
  const result = bcp47Find('en');
  expect(result && !Array.isArray(result) ? result.tag : null).toEqual('en');
});

test('find eng', async () => {
  const result = bcp47Find('eng');
  expect(result && Array.isArray(result) ? result[0].tag : result).toEqual(
    'en'
  );
});

test('find es-419', async () => {
  const result = bcp47Find('es-419');
  expect(result && !Array.isArray(result) ? result.tag : result).toEqual(
    'es-419'
  );
});

test('find zh-Hant-TW', async () => {
  const result = bcp47Find('zh-Hant-TW');
  expect(result && !Array.isArray(result) ? result.tag : result).toEqual(
    'zh-TW'
  );
});

test('find nan-Latn-035', async () => {
  const result = bcp47Find('nan-Latn-035');
  expect(result && !Array.isArray(result) ? result.tag : result).toEqual(
    'nan-Latn'
  );
});

test('find zh-Hans', async () => {
  const result = bcp47Find('zh-Hans');
  expect(result && !Array.isArray(result) ? result.tag : result).toEqual(
    'zh-CN'
  );
});

test('find en-x-phonipa', async () => {
  const result = bcp47Find('en-x-phonipa');
  expect(result && !Array.isArray(result) ? result.tag : result).toEqual('en');
});

test('find rm-sursilv', async () => {
  const result = bcp47Find('rm-sursilv');
  expect(result && !Array.isArray(result) ? result.tag : result).toEqual('rm');
});

test('find gsw-u-sd', async () => {
  const result = bcp47Find('gsw-u-sd');
  expect(result && !Array.isArray(result) ? result.tag : result).toEqual('gsw');
});

test('find i-default', async () => {
  expect(bcp47Find('i-default')).toBeNull();
});

test('index en', async () => {
  const result = bcp47Index('en');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('en');
});

test('index eng', async () => {
  const result = bcp47Index('eng');
  expect(result?.length).toBeGreaterThan(100);
});

test('index es-419', async () => {
  const result = bcp47Index('es-419');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('es-419');
});

test('index zh-Hant-TW', async () => {
  const result = bcp47Index('zh-Hant-TW');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('zh-TW');
});

test('index nan-Latn-035', async () => {
  const result = bcp47Index('nan-Latn-035');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('nan-Latn');
});

test('index zh-Hans', async () => {
  const result = bcp47Index('zh-Hans');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('zh-CN');
});

test('index en-x-phonipa', async () => {
  const result = bcp47Index('en-x-phonipa');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('en');
});

test('index rm-sursilv', async () => {
  const result = bcp47Index('rm-sursilv');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('rm');
});

test('index gsw-u-sd', async () => {
  const result = bcp47Index('gsw-u-sd');
  expect(result?.length).toEqual(1);
  expect(result && langTags[result[0]].tag).toEqual('gsw');
});

test('index i-default', async () => {
  const result = bcp47Index('i-default');
  expect(result?.length).toEqual(0);
});
