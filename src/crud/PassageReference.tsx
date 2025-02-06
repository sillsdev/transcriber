import { FC } from 'react';
import { passageTypeFromRef, RefRender } from '../control/RefRender';
import { Passage, BookName, SharedResourceD } from '../model';
import { passageBook } from './passage';

interface IProps {
  passage: Passage;
  bookData: BookName[];
  flat: boolean;
  sharedResource?: SharedResourceD;
  fontSize?: string;
}
export const PassageReference: FC<IProps> = ({
  passage,
  bookData = [],
  flat,
  sharedResource,
  fontSize,
}: IProps) => {
  let ref = passage?.attributes?.reference;
  if (sharedResource?.attributes?.title) ref = sharedResource.attributes.title;
  if (!ref) return <></>;
  if (!/^\d/.test(ref))
    return (
      <RefRender
        value={ref}
        flat={flat}
        pt={passageTypeFromRef(passage?.attributes.reference)}
        fontSize={fontSize}
      />
    );
  const book = passageBook(passage, bookData);
  return <>{book ? `${book} ${ref}` : ref}</>;
};
