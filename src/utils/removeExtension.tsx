export const removeExtension = (filename: string) => {
  var ext = '';
  var x = filename.split('.');
  if (x.length > 1) ext = x.pop() || '';
  return { name: x.join('.'), ext: ext };
};
