import { Passage, BookName, SharedResourceD } from '../../model';
import { PassageReference } from '../../crud/PassageReference';
import { FC } from 'react';

interface IProps {
  passage: Passage[];
  bookData: BookName[];
  flat: boolean;
  sr?: SharedResourceD;
}
export const GetReference: FC<IProps> = ({
  passage,
  bookData,
  flat,
  sr,
}: IProps) => {
  if (passage.length === 0) return <></>;
  return (
    <PassageReference
      passage={passage[0]}
      bookData={bookData}
      flat={flat}
      sharedResource={sr}
    />
  );
};
