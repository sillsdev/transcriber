import * as React from 'react';
import { pad2 } from '../utils/pad2';

export function formatTime(seconds: number, direction?: string) {
  if (typeof seconds !== 'number') return '';
  let sign = '';
  if (seconds < 0) {
    seconds = -1 * seconds;
    sign = '-';
  }
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = pad2(date.getUTCSeconds());
  if (direction && direction === 'rtl') {
    if (hh) {
      return `${sign}${ss}:${pad2(mm)}:${hh}`;
    }
    return `${sign}${ss}:${mm}`;
  }
  if (hh) {
    return `${sign}${hh}:${pad2(mm)}:${ss}`;
  }
  return `${sign}${mm}:${ss}`;
}

interface IProps {
  direction?: string;
  id?: string;
  seconds: number;
}

export function Duration(props: IProps) {
  const { direction, id, seconds } = props;

  return (
    <time id={id} dateTime={`P${Math.ceil(seconds)}S`}>
      {formatTime(seconds, direction)}
    </time>
  );
}

export default Duration;
