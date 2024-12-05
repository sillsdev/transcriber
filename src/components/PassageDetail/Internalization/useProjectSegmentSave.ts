import { useGlobal } from 'reactn';
import { MediaFile, MediaFileD } from '../../../model';
import { UpdateRecord } from '../../../model/baseModel';

interface IProps {
  media: MediaFile;
  segments: string;
}
export const useProjectSegmentSave = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async ({ media, segments }: IProps) => {
    await memory.update((t) => [
      ...UpdateRecord(
        t,
        {
          type: 'mediafile',
          id: media.id,
          attributes: {
            ...media?.attributes,
            segments: segments,
          },
        } as any as MediaFileD,
        user
      ),
    ]);
  };
};
