import { ArtifactTypeSlug } from '../../crud';
import MediaPlayer from '../MediaPlayer';

interface IProps {
  item: ArtifactTypeSlug;
}

export default function ConsultantCheckReview({ item }: IProps) {
  const handleEnded = () => {};
  return (
    <>
      <MediaPlayer srcMediaId={''} requestPlay={false} onEnded={handleEnded} />
    </>
  );
}
