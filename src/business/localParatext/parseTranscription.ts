import { parseRef } from '../../crud/passage';
import { Passage } from '../../model';

export const parseTranscription = (
  currentPassage: Passage,
  transcription: string
) => {
  const pattern = /(\\v\s*[0-9]+[a-f]?-?[0-9]*[a-f]?\s)/g;
  const internalverses = Array.from(transcription.matchAll(pattern));
  // Get all matches
  if (internalverses.length < 1) {
    currentPassage.attributes.lastComment = transcription.trimEnd();
    return [currentPassage];
  }
  var ret: Passage[] = [];
  var start = 0;
  const chapPat = /^\\c\s*([0-9]+)\s/;
  internalverses.forEach((match, index) => {
    const chapIndex = match.input?.slice(0, match.index).lastIndexOf('\\c');
    const chapMatch = match.input?.slice(chapIndex).match(chapPat);
    start = match.index! + match[0].length;
    var t =
      index < internalverses.length - 1
        ? transcription.substring(start, internalverses![index + 1].index!)
        : transcription.substring(start);
    ret.push({
      attributes: {
        book: currentPassage.attributes.book,
        reference:
          (chapMatch
            ? chapMatch[1]
            : chapIndex && chapIndex > 0
            ? (currentPassage.attributes.endChapter || 0).toString()
            : (currentPassage.attributes.startChapter || 0).toString()) +
          ':' +
          match[0].replace('\\v', '').trim(),
        lastComment: t.trimStart().trimEnd(),
      },
      relationships: currentPassage.relationships,
    } as Passage);
  });
  ret[0].attributes.sequencenum = currentPassage.attributes.sequencenum;
  ret.forEach((p) => parseRef(p));
  return ret;
};
