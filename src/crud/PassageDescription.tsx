import { FC } from 'react';
import { BookName, Passage } from '../model';
import { PassageReference } from './PassageReference';
import { passageNumber } from './passage';

interface IProps {
  passage: Passage;
  bookData: BookName[];
  flat: boolean;
}
export const PassageDescription: FC<IProps> = ({
  passage,
  bookData = [],
  flat,
}: IProps) => {
  const num = passageNumber(passage);
  return num ? (
    <>
      {num}
      {'\u00A0\u00A0'}
      <PassageReference passage={passage} bookData={bookData} flat={flat} />
    </>
  ) : (
    <PassageReference passage={passage} bookData={bookData} flat={flat} />
  );
};
