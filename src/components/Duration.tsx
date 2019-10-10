import * as React from 'react';

interface IProps {
  direction?: string;
  id?: string;
  seconds: number;
}

class Duration extends React.Component<IProps, object> {
  public render() {
    const { direction, id, seconds } = this.props;

    return (
      <time id={id} dateTime={`P${Math.round(seconds)}S`}>
        {this.format(seconds, direction)}
      </time>
    );
  }

  private format(seconds: number, direction: string | undefined) {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = this.pad(date.getUTCSeconds());
    if (direction && direction === 'rtl') {
      if (hh) {
        return `${ss}:${this.pad(mm)}:${hh}`;
      }
      return `${ss}:${mm}`;
    }
    if (hh) {
      return `${hh}:${this.pad(mm)}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  private pad(text: number) {
    return ('0' + text).slice(-2);
  }
}

export default Duration;
