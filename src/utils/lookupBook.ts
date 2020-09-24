import { BookName, BookNameMap } from '../model';

interface IProps {
  book: string;
  allBookData: BookName[];
  bookMap: BookNameMap;
}

export const lookupBook = (props: IProps): string => {
  const { book, allBookData, bookMap } = props;

  const bookUc = book?.toLocaleUpperCase() || '';
  if (bookUc !== '' && !bookMap[bookUc]) {
    const proposed = allBookData.filter(
      (bookName) =>
        bookName.short.toLocaleUpperCase() === bookUc ||
        bookName.long.toLocaleUpperCase() === bookUc ||
        bookName.abbr.toLocaleUpperCase() === bookUc
    );
    if (proposed.length >= 1) return proposed[0].code;
  }
  return bookUc;
};
