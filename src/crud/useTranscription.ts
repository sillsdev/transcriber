import { useGlobal } from 'reactn';
import { getVernacularMediaRec, getAllMediaRecs, VernacularTag } from '.';
export const useTranscription = () => {
  const [memory] = useGlobal('memory');

  return (passageId: string, exportId?: string | null) => {
    if (exportId === VernacularTag) {
      const mediaRec = getVernacularMediaRec(passageId, memory);
      return mediaRec?.attributes?.transcription || '';
    } else {
      const transcriptions = getAllMediaRecs(passageId, memory, exportId)
        .sort((i, j) =>
          i.attributes?.dateCreated <= j.attributes?.dateCreated ? -1 : 1
        )
        .filter((m) => m.attributes?.transcription)
        .map(
          (m) =>
            `${m.attributes?.performedBy || ''}: ${m.attributes?.transcription}`
        );
      return transcriptions.join('\n');
    }
  };
};
