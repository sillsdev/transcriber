import { useState, useEffect } from 'react';
import codeNum from '../assets/code-num.json';

export const useBookN = () => {
  const [bookCodes, setBookCodes] = useState<Map<string, number>>();

  useEffect(() => {
    setBookCodes(new Map(codeNum as any));
  }, []);

  return (book: string) => (bookCodes ?? new Map(codeNum as any)).get(book) ?? 0;
};
