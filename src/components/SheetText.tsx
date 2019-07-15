import React, { useState } from 'react';
import { TextField } from '@material-ui/core';

interface IProps {
  initValue: string;
  onCommit: (value: string) => void;
}

export function SheetText(props: IProps) {
  const { initValue, onCommit } = props;
  const [value, setValue] = useState(initValue);

  const handleChange = (e: any) => setValue(e.currentTarget.value);
  const handleKeyDown = (e: any) => {
    if (e.keyCode === 27) {
      onCommit(initValue);
    } else if (e.keyCode === 13 || e.keyCode === 9) {
      onCommit(value);
    }
  };

  return (
    <TextField
      multiline
      {...props}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}
export default SheetText;
