import { useGlobal } from 'reactn';
import { useArtifactType, getVernacularMediaRec, getAllMediaRecs } from '.';
export const useTranscription = () => {
  const [memory] = useGlobal('memory');
  const { vernacularId } = useArtifactType();

  return (passageId: string, exportId?: string) => {
    if (exportId === vernacularId) {
      const mediaRec = getVernacularMediaRec(passageId, memory, vernacularId);
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
