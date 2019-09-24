export function randomString(length: number) {
  var charset =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._~';
  let result = '';

  while (length > 0) {
    var bytes = new Uint8Array(16);
    var random = window.crypto.getRandomValues(bytes);

    /* eslint-disable-next-line no-loop-func */
    random.forEach(c => {
      if (length === 0) {
        return;
      }
      if (c < charset.length) {
        result += charset[c];
        length--;
      }
    });
  }
  return result;
}

export default randomString;
