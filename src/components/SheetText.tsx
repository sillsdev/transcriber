import React, { useState } from 'react';
import { TextField } from '@material-ui/core';

interface IProps {
  initValue: string;
  onCommit: (value: string) => void;
  setCommit: (method: () => void) => void;
}

export function SheetText(props: IProps) {
  const { initValue, onCommit, setCommit } = props;
  const [value, setValue] = useState(initValue);

  const handleChange = (e: any) => setValue(e.currentTarget.value);
  const handleKeyDown = (e: any) => {
    const KEY_ESCAPE = 27;
    const KEY_RETURN = 13;
    const KEY_TAB = 9;
    if (e.keyCode === KEY_ESCAPE) {
      onCommit(initValue);
    } else if (e.keyCode === KEY_RETURN || e.keyCode === KEY_TAB) {
      onCommit(value);
    }
  };
  const handleBlur = () => {
    onCommit(value);
  };
  setCommit(handleBlur);

  return (
    <TextField
      multiline
      {...props}
      autoFocus
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
export default SheetText;
