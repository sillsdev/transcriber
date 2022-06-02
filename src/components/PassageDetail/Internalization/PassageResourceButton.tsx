import { useState, CSSProperties } from 'react';
import { IconButton } from '@material-ui/core';
import UncheckedIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckedIcon from '@material-ui/icons/CheckBoxOutlined';

interface IProps {
  value: boolean;
  cb: () => void;
}

const style: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
} as const;

export const PassageResourceButton = (props: IProps) => {
  const [value, setValue] = useState(props.value);

  const handleCheck =
    ({ cb }: IProps) =>
    () => {
      setValue(!value);
      cb();
    };

  return (
    <div style={style}>
      <IconButton id="pass-res" onClick={handleCheck(props)}>
        {value ? (
          <CheckedIcon id="pass-res-yes" />
        ) : (
          <UncheckedIcon id="pass-res-no" />
        )}
      </IconButton>
      {`\u00A0 Passage Resource`}
    </div>
  );
};
