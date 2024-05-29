export const isText = (v: Node | null) => v?.nodeType === Node.TEXT_NODE;

export const isPara = (v: Node | null) =>
  v?.nodeType === Node.ELEMENT_NODE && v?.nodeName === 'para';

export const isSection = (v: Node) =>
  isPara(v) && (v as Element)?.getAttribute('style') === 's';

export const isVerse = (v: Node | null) => {
  if (v == null || v.nodeType !== Node.ELEMENT_NODE) return false;
  return (v as Element).nodeName === 'verse';
};

export const isNote = (v: Node) =>
  v.nodeType === Node.ELEMENT_NODE && v.nodeName === 'note';

export const isEmptyPara = (v: Node | null) =>
  v !== null &&
  isPara(v) &&
  (v?.firstChild === null ||
    (isText(v.firstChild) &&
      (v?.firstChild.nodeValue as string).trimEnd() === ''));

export const isAfterSection = (v: Node) => {
  var prevSib;
  if (isPara(v)) prevSib = v.previousSibling;
  else prevSib = v.parentNode?.previousSibling;
  if (prevSib === null) return undefined;
  if (isText(prevSib as Node) && isSection(prevSib?.previousSibling as Element))
    return prevSib?.previousSibling as Element;
};
