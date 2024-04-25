import { FC } from 'react';
import { RefRender } from '../control/RefRender';
import { Passage, BookName } from '../model';
import { passageBook } from './passage';

interface IProps {
  passage: Passage;
  bookData: BookName[];
  flat: boolean;
}
export const PassageReference: FC<IProps> = ({
  passage,
  bookData = [],
  flat,
}: IProps) => {
  let ref = passage?.attributes?.reference;
  if (!ref) return <></>;
  if (!/^\d/.test(ref)) return <RefRender value={ref} flat={flat} />;
  const book = passageBook(passage, bookData);
  return <>{book ? `${book} ${ref}` : ref}</>;
};
