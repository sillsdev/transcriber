export const slug = (s: string) => {
  return s
    .toLocaleLowerCase()
    .replace('&', '')
    .replace(' ', '')
    .replace(' ', '');
};

export default slug;
