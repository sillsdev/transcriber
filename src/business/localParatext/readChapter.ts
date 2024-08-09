import { DOMParser } from '@xmldom/xmldom';
import { IExecResult } from '../../model';
const ipc = (window as any)?.electron;
const domParser = new DOMParser();

export const readChapter = async (
  paths: {
    chapterFile: string;
    book: string;
    chapter: string;
    program: (args: string[]) => Promise<IExecResult>;
  },
  ptProjName: string
) => {
  const temp = await ipc?.temp();
  if (!temp) throw new Error('Unable to find temp directory.'); //this is app.getPath('temp')
  const { stdout } = await paths.program([
    '-r',
    ptProjName,
    paths.book,
    paths.chapter,
    paths.chapterFile,
    '-x',
  ]);
  if (stdout) console.log(stdout);

  const usx: string = await ipc?.read(paths.chapterFile, 'utf-8');
  return domParser.parseFromString(usx);
};
