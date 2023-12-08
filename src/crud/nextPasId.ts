import { Section, PassageD } from '../model';
import Memory from '@orbit/memory';
import { related, findRecord } from '.';
import { isPublishingTitle } from '../control/RefRender';

export const nextPasId = (
  section: Section,
  curPass: string,
  memory: Memory
) => {
  let pasId = '';
  const passages = related(section, 'passages');
  if (Array.isArray(passages)) {
    let curIndex = passages.findIndex((p) => p.id === curPass);
    if (curIndex !== -1) {
      for (curIndex += 1; curIndex < passages.length; curIndex++) {
        const passRec = findRecord(
          memory,
          'passage',
          passages[curIndex].id
        ) as PassageD;
        if (!isPublishingTitle(passRec?.attributes?.reference, false)) {
          pasId = passRec?.keys?.remoteId || passRec?.id;
          break;
        }
      }
      if (!pasId) {
        for (curIndex = 0; curIndex < passages.length; curIndex++) {
          const passRec = findRecord(
            memory,
            'passage',
            passages[curIndex].id
          ) as PassageD;
          if (!isPublishingTitle(passRec?.attributes?.reference, false)) {
            pasId = passRec?.keys?.remoteId || passRec?.id;
            break;
          }
        }
      }
    }
  }
  return pasId;
};
