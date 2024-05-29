import Memory from '@orbit/memory';
import { PassageInfo } from './PassageInfo';
import { paratextPaths } from './paratextPaths';
import { readChapter } from './readChapter';
import { postPass } from './postPass';
import { writeChapter } from './writeChapter';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
import { ActivityStates } from '../../model';
import { UpdateMediaStateOps } from '../../crud/updatePassageState';
const ipc = (window as any)?.electron;

export const doChapter = async (
  chap: string,
  passInfo: PassageInfo[],
  ptProjName: string,
  memory: Memory,
  userId: string,
  exportNumbers: boolean,
  sectionArr: [number, string][] | undefined
) => {
  const paths = await paratextPaths(chap);

  let usxDom: Document = await readChapter(paths, ptProjName);

  passInfo = passInfo.sort(
    (i, j) =>
      (i.passage?.attributes.startVerse || 0) -
      (j.passage?.attributes.startVerse || 0)
  );
  passInfo.forEach((p) => {
    postPass(usxDom, chap.split('-')[1], p, exportNumbers, sectionArr, memory);
  });

  const { stdoutw } = await writeChapter(paths, ptProjName, usxDom);
  if (stdoutw) console.log(stdoutw);
  var ops: RecordOperation[] = [];
  var tb = new RecordTransformBuilder();
  for (let p of passInfo) {
    var cmt = p.passage.attributes.lastComment;
    p.passage.attributes.lastComment = '';
    UpdateMediaStateOps(
      p.mediaId,
      p.passage.id,
      ActivityStates.Done,
      userId,
      tb,
      ops,
      memory,
      'Paratext-' + cmt
    );
  }
  await memory.update(ops);

  ipc?.delete(paths.chapterFile);
};
