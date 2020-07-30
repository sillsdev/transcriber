export const toCamel = (val: string) =>
  val
    .split(' ')
    .map(
      (v, i) =>
        v !== '' &&
        (i === 0
          ? v[0].toLowerCase() + v.slice(1)
          : v[0].toUpperCase() + v.slice(1))
    )
    .join('');
