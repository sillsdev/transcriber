import React, { Component } from 'react';
import loading from './loading.svg';

class Callback extends Component {
  render() {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const style = {
      position: 'absolute',
      display: 'flex',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
    }

    return (
      // <div style={style}>
      <div>
        <img src={loading} alt="loading"/>
      </div>
    );
  }
}

export default Callback;
