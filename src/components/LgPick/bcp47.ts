import { langTags } from './LanguagePicker';

// https://tools.ietf.org/html/bcp47 page 4
const lgPat = /^([a-z]{2,3}([a-z]{3}(-[a-z]{3}){2})?)(-[A-Z][a-z]{3})?(-[A-Z]{2}|-[0-9]{3})?(-[0-9a-z]{5,8}|-[0-9][0-9a-zA-Z]{3})*(-[0-9A-WY-Za-wy-z]-[0-9A-Za-z]{2,8})*(-[xX]-[0-9a-zA-Z]{1,8})*$/;

export function bcp47Match(code: string) {
  const result = lgPat.test(code);
  if (result) return result;
  return /en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE/.test(
    code
  );
}

const multi = (pat: RegExp, input: string): Array<string> => {
  const result = Array<string>();
  let index = 0;
  while (true) {
    const puItem = pat.exec(input.slice(index));
    if (!puItem) break;
    result.push(puItem[1]);
    index += puItem.index + puItem[1].length;
  }
  return result;
};

export function bcp47Parse(code: string) {
  const match = lgPat.exec(code);
  // console.log(match);
  const language = match ? match[1] : null;
  const script = match && match[4] ? match[4].slice(1) : null;
  const region = match && match[5] ? match[5].slice(1) : null;
  const variant = match && match[6] ? match[6].slice(1) : null;
  const extension = match && match[7] ? match[7].slice(1) : null;
  const privateUse = multi(/-[xX]-([0-9a-zA-Z]{1,8})/, code);
  const irregular = !match && bcp47Match(code) ? code : null;
  return {
    language,
    script,
    region,
    variant,
    extension,
    privateUse,
    irregular,
  };
}

const tagLen = (i: number) => {
  const tag = langTags[i];
  return tag.full ? tag.full.length + tag.tag.length : tag.tag.length;
};

export function bcp47Index(code: string) {
  if (!bcp47Match(code)) return null;
  const exact = Array<number>();
  langTags.forEach((lt, i) => {
    if (lt.tag === code) exact.push(i);
  });
  if (exact.length === 1) return exact;
  const inAll = Array<number>();
  langTags.forEach((lt, i) => {
    if (lt.iso639_3 === code) {
      inAll.push(i);
    } else {
      if (lt.tags && lt.tags.filter(ltTag => ltTag === code).length > 0)
        inAll.push(i);
    }
  });
  if (inAll.length === 1) return inAll;
  if (inAll.length > 0)
    return inAll.sort((i, j) => (langTags[i].name < langTags[j].name ? -1 : 1));
  const part = Array<number>();
  langTags.forEach((lt, i) => {
    if (lt.full && lt.full === code.slice(0, lt.full.length)) {
      part.push(i);
    } else {
      if (lt.tag === code.slice(0, lt.tag.length)) part.push(i);
    }
  });
  const spart = part.sort((i, j) => (tagLen(i) < tagLen(j) ? 1 : -1));
  if (spart.length <= 1) return part;
  const long = tagLen(spart[0]);
  const longList = part
    .filter(ll => tagLen(ll) === long)
    .sort((i, j) => (langTags[i].name < langTags[j].name ? -1 : 1));
  return longList;
}

export function bcp47Find(code: string) {
  const result = bcp47Index(code)
    ?.map(i => langTags[i])
    .sort((i, j) => (i.tag < j.tag ? -1 : 1));
  if (result?.length === 0) return null;
  if (result?.length === 1) return result[0];
  return result;
}
