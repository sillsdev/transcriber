import React from 'react';
import MediaActions from './MediaActions';

export interface IRow {
  index: number;
  planid: string;
  passId: string;
  id: string;
  planName: string;
  playIcon: string;
  fileName: string;
  sectionId: string;
  sectionDesc: string;
  reference: React.ReactNode;
  duration: string;
  size: number;
  version: string;
  date: string;
  readyToShare: boolean;
  user: string;
  actions: typeof MediaActions;
}
