import { refMatch } from '../utils/refMatch';

test('verse range', () => {
  expect(refMatch('1:1-4')).toBeTruthy();
});

test('single verse', () => {
  expect(refMatch('1:5')).toBeTruthy();
});

test('verse range with letter', () => {
  expect(refMatch('1:1-4a')).toBeTruthy();
});

test('verse range with two letters', () => {
  expect(refMatch('1:1c-4a')).toBeTruthy();
});

test('cross chapter boundary to fail', () => {
  expect(refMatch('1:25-2:4')).toBeFalsy();
});

test('chapter of 1:2-4 to be 1', () => {
  const match = refMatch('1:2-4');
  expect(match && match[1]).toBe('1');
});

test('start verse of 1:2-4 to be 2', () => {
  const match = refMatch('1:2-4');
  expect(match && match[2]).toBe('2');
});

test('end verse of 1:2-4 to be 4', () => {
  const match = refMatch('1:2-4');
  expect(match && match[3]).toBe('4');
});

test('start verse of 1:2c-4a to be 2c', () => {
  const match = refMatch('1:2c-4a');
  expect(match && match[2]).toBe('2c');
});

test('end verse of 1:2c-4a to be 4a', () => {
  const match = refMatch('1:2c-4a');
  expect(match && match[3]).toBe('4a');
});
