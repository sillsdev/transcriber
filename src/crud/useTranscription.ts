import { useGlobal } from 'reactn';
import { ActivityStates } from '../model';
import { getVernacularMediaRec, getAllMediaRecs, VernacularTag } from '.';
export const useTranscription = (
  addSpeaker: boolean,
  state?: ActivityStates,
  version?: number
) => {
  const [memory] = useGlobal('memory');

  return (passageId: string, exportId?: string | null) => {
    if (exportId === VernacularTag) {
      const mediaRec = getVernacularMediaRec(passageId, memory);
      return mediaRec?.attributes?.transcription || '';
    } else {
      const transcriptions = getAllMediaRecs(
        passageId,
        memory,
        exportId,
        version
      )
        .sort((i, j) =>
          i.attributes?.dateCreated <= j.attributes?.dateCreated ? -1 : 1
        )
        .filter(
          (m) =>
            m.attributes?.transcription &&
            (!state || m.attributes?.transcriptionstate === state)
        )
        .map((m) => {
          const speaker = m.attributes?.performedBy;
          let transcription = '';
          if (addSpeaker && speaker) {
            transcription = `${speaker}: `;
          }
          return transcription + m.attributes?.transcription;
        });
      return transcriptions.join('\n');
    }
  };
};
