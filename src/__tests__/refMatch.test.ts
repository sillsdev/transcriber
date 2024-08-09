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

test('cross chapter boundary to succeed', () => {
  expect(refMatch('1:25-2:4')).toBeTruthy();
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

test('end chapter of 1:2c-2:4a to be 2', () => {
  const match = refMatch('1:2c-2:4a');
  expect(match && match[3]).toBe('2');
  expect(match && match[4]).toBe('4a');
});

test('should succeed with beg < end, 1:1-2', () => {
  expect(refMatch('1:1-2')).not.toBeNull();
});

test('should fail with beg = end, 1:1-1', () => {
  expect(refMatch('1:1-1')).toBeNull();
});

test('should fail with beg > end, 1:2-1', () => {
  expect(refMatch('1:2-1')).toBeNull();
});

test('should succeed with beg with letter < end 1:1a-2', () => {
  expect(refMatch('1:1a-2')).not.toBeNull();
});

test('should succed with beg < end with letter, 1:1-2a', () => {
  expect(refMatch('1:1-2a')).not.toBeNull();
});

test('should succed with beg with letter < end with letter, 1:1a-2a', () => {
  expect(refMatch('1:1a-2a')).not.toBeNull();
});

test('shoulc fail with beg with letter < end with letter, 1:1b-1a', () => {
  expect(refMatch('1:1b-1a')).toBeNull();
});

test('should fail with beg with letter < end as letter, 1:1b-c', () => {
  expect(refMatch('1:1b-c')).toBeNull();
});

test('should fail with beg as letter < end with letter, 1:b-2c', () => {
  expect(refMatch('1:b-2c')).toBeNull();
});

test('should fail with beg as letter < end as letter, 1:b-c', () => {
  expect(refMatch('1:b-c')).toBeNull();
});

test('should succeed with cross chapter 1:80-2:2', () => {
  expect(refMatch('1:80-2:2')).not.toBeNull();
});

test('should fail with cross whole chapter 1:80-3:2', () => {
  expect(refMatch('1:80-3:2')).toBeNull();
});

test('should fail with cross chapter as same chapter 1:80-1:81', () => {
  expect(refMatch('1:80-1:81')).toBeNull();
});
