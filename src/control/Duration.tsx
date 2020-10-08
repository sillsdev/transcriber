import * as React from 'react';

const pad = (text: number) => ('0' + text).slice(-2);

export function formatTime(seconds: number, direction?: string) {
  const date = new Date(seconds * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = pad(date.getUTCSeconds());
  if (direction && direction === 'rtl') {
    if (hh) {
      return `${ss}:${pad(mm)}:${hh}`;
    }
    return `${ss}:${mm}`;
  }
  if (hh) {
    return `${hh}:${pad(mm)}:${ss}`;
  }
  return `${mm}:${ss}`;
}

interface IProps {
  direction?: string;
  id?: string;
  seconds: number;
}

export function Duration(props: IProps) {
  const { direction, id, seconds } = props;

  return (
    <time id={id} dateTime={`P${Math.round(seconds)}S`}>
      {formatTime(seconds, direction)}
    </time>
  );
}

export default Duration;
