import { shallowEqual, useSelector } from 'react-redux';
import { MenuItem, TextField } from '@mui/material';
import { useContext, useEffect, useState, useRef, RefObject } from 'react';
import { ITeamCheckReferenceStrings } from '../../../model';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { related, useArtifactCategory } from '../../../crud';
import { teamCheckRefSelector } from '../../../selector';

interface IProps {
  inResource?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
}

export const SelectMyResource = (props: IProps) => {
  const { onChange, inResource, required } = props;
  const ctx = useContext(PassageDetailContext);
  const { rowData, section, passage } = ctx.state;
  const [resource, setResource] = useState('');
  const { scriptureTypeCategory } = useArtifactCategory();
  const [myWidth, setMyWidth] = useState(0);
  const controlRef = useRef<any>();
  const t: ITeamCheckReferenceStrings = useSelector(
    teamCheckRefSelector,
    shallowEqual
  );

  const handleUserChange = (e: any) => {
    setResource(e.target.value);
    onChange && onChange(e.target.value);
  };

  useEffect(() => {
    if (inResource) setResource(inResource);
  }, [inResource]);

  const checkCategory = (localCat: string) => {
    return scriptureTypeCategory(localCat);
  };

  useEffect(() => {
    const el = controlRef as RefObject<HTMLDivElement>;
    if (el.current?.clientWidth && el.current?.clientWidth !== myWidth) {
      setMyWidth(el.current.clientWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TextField
      id="select-my-resource"
      ref={controlRef}
      sx={{
        mx: 1,
        display: 'flex',
        flexGrow: 1,
        textOverflow: 'ellipsis',
        minWidth: '400px',
        ...(myWidth && {
          maxWidth: `${myWidth - 32}px`,
        }),
      }}
      select
      label={t.resource}
      helperText={t.resourcehelper}
      value={resource}
      onChange={handleUserChange}
      variant="filled"
      required={required}
    >
      {rowData
        .filter(
          (r) =>
            r?.isResource &&
            !r?.isText &&
            checkCategory(r?.artifactCategory) &&
            related(r.resource, 'section') === section.id &&
            (r.passageId === '' || r.passageId === passage.id)
        )
        .map((r, k) => (
          <MenuItem id={`my-res-${k}`} value={r.id} key={r.id}>
            {r.artifactName}
          </MenuItem>
        ))}
    </TextField>
  );
};
export default SelectMyResource;
