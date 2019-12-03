export const slug = (s: string | null) => {
  if (!s) return '';
  return s
    .toLocaleLowerCase()
    .replace('&', '')
    .replace(' ', '')
    .replace(' ', '');
};

export default slug;
