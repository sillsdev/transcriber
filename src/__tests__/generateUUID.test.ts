import { generateUUID } from '../utils';

test('produce correctly formatted guid', () => {
  expect(generateUUID()).toMatch(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{8}/
  );
});

test('produce different guid each time', () => {
  const a = generateUUID();
  const b = generateUUID();
  expect(a === b).toBeFalsy();
});
