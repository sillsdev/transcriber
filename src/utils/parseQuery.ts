export interface IParsedArgs {
  [arg: string]: string | boolean;
}

export function parseQuery(search: string) {
  const args = search.substring(search[0] === '?' ? 1 : 0).split('&');
  const argsParsed: IParsedArgs = {};
  args.forEach(arg => {
    if (-1 === arg.indexOf('=')) {
      argsParsed[decodeURIComponent(arg).trim()] = true;
    } else {
      const kvp = arg.split('=');
      const key = decodeURIComponent(kvp[0]).trim();
      const value = decodeURIComponent(kvp[1]).trim();
      argsParsed[key] = value;
    }
  });
  return argsParsed;
}
