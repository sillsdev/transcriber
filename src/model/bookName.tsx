import { OptionType } from '../model';

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
