import React from 'react';

export interface IPRow {
  id: string;
  sectionId: string;
  sectionDesc: string;
  reference: React.ReactNode;
  attached: string;
  sort: string;
  book: string;
  chap: number;
  beg: number;
  end: number;
  secNum: number;
  pasNum: number;
}
