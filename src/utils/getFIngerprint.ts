import Fingerprint2 from 'fingerprintjs2';

export const getFingerprint = async () => {
  var components = await Fingerprint2.getPromise({});
  return Fingerprint2.x64hash128(
    components.map((c) => c.value).join(''),
    31
  );
}
