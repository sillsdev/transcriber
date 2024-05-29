import { XMLSerializer } from 'xmldom';
const ipc = (window as any)?.electron;

export const writeChapter = async (
  paths: {
    chapterFile: string;
    book: string;
    chapter: string;
    program: (args: string[]) => Promise<any>;
  },
  ptProjName: string,
  usxDom: Document
) => {
  const usxXml: string = XMLSerializer.serializeToString(usxDom);
  ipc?.write(paths.chapterFile, usxXml);
  return await paths.program([
    '-w',
    ptProjName,
    paths.book,
    paths.chapter,
    paths.chapterFile,
    '-x',
  ]);
};
