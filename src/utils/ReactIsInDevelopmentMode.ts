import React from 'react';

export function ReactIsInDevelomentMode() {
  return '_self' in React.createElement('div');
}
