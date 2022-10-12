import { useState, CSSProperties } from 'react';
import { IconButton } from '@material-ui/core';
import UncheckedIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckedIcon from '@mui/icons-material/CheckBoxOutlined';
import { passageDetailArtifactsSelector } from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { IPassageDetailArtifactsStrings } from '../../../model';

interface IProps {
  value: boolean;
  label?: string;
  cb: () => void;
}

const style: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
} as const;

export const PassageResourceButton = (props: IProps) => {
  const [value, setValue] = useState(props.value);
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );

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
      {`\u00A0 ${props.label || t.passageResource}`}
    </div>
  );
};
