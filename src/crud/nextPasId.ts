import { Section, PassageD } from '../model';
import Memory from '@orbit/memory';
import { related, findRecord } from '.';
import { isPublishingTitle } from '../control/RefRender';
import { RecordIdentity } from '@orbit/records';

export const nextPasId = (
  section: Section,
  curPass: string,
  memory: Memory
) => {
  let pasId = '';
  const passRecIds: RecordIdentity[] = related(section, 'passages');
  if (Array.isArray(passRecIds)) {
    const passages: PassageD[] = passRecIds
      .map((p) => findRecord(memory, 'passage', p.id) as PassageD)
      .sort((a, b) => a.attributes.sequencenum - b.attributes.sequencenum);
    let curIndex = passages.findIndex((p) => p.id === curPass);
    if (curIndex !== -1) {
      for (curIndex += 1; curIndex < passages.length; curIndex++) {
        const passRec = passages[curIndex];
        if (!isPublishingTitle(passRec?.attributes?.reference, false)) {
          pasId = passRec?.keys?.remoteId || passRec?.id;
          break;
        }
      }
      if (!pasId) {
        for (curIndex = 0; curIndex < passages.length; curIndex++) {
          const passRec = passages[curIndex];
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
