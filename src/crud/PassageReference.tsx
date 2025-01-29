import { FC } from 'react';
import { RefRender } from '../control/RefRender';
import { Passage, BookName, SharedResourceD } from '../model';
import { passageBook } from './passage';

interface IProps {
  passage: Passage;
  bookData: BookName[];
  flat: boolean;
  sharedResource?: SharedResourceD;
}
export const PassageReference: FC<IProps> = ({
  passage,
  bookData = [],
  flat,
  sharedResource,
}: IProps) => {
  let ref = passage?.attributes?.reference;
  if (!ref) return <></>;
  if (sharedResource?.attributes?.title)
    return <>{sharedResource.attributes.title}</>;
  if (!/^\d/.test(ref)) return <RefRender value={ref} flat={flat} />;
  const book = passageBook(passage, bookData);
  return <>{book ? `${book} ${ref}` : ref}</>;
};
