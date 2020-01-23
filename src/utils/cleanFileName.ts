export const cleanFileName = (str: string) =>
  str
    .replace(/[<>|:"*?\\/]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, 'file');
export default cleanFileName;
