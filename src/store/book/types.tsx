// Describing the shape of the book names's slice of state
import { OptionType } from '../../model';

export interface BookName {
  code: string;
  abbr: string;
  short: string;
  long: string;
}

export interface BookNameMap {
  [code: string]: string;
}

export interface IBookNameData {
  loaded: boolean;
  suggestions: OptionType[];
  map: BookNameMap;
  bookData: BookName[];
}

// Describing the different ACTION NAMES available
export const FETCH_BOOKS = 'FETCH_BOOKS';

interface FetchBookNames {
  type: typeof FETCH_BOOKS;
  payload: { data: BookName[] };
}

export type BookNameMsgs = FetchBookNames;
