import { getReadWriteProg } from '../../utils/paratextPath';
const path = require('path-browserify');
const ipc = (window as any)?.electron;

export const paratextPaths = async (chap: string) => {
  const ptProg = await getReadWriteProg();
  const pt = chap.split('-');
  const temp = await ipc?.temp();
  return {
    chapterFile: path.join(temp, chap + '.usx'),
    book: pt[0],
    chapter: pt[1],
    program: ptProg,
  };
};
