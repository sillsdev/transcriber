import MediaPlayer from '../MediaPlayer';
import { CheckTranscription } from './CheckTranscription';

export default function ConsultantCheckReview() {
  const handleEnded = () => {};
  return (
    <>
      <MediaPlayer srcMediaId={''} requestPlay={false} onEnded={handleEnded} />
      <CheckTranscription />
    </>
  );
}
