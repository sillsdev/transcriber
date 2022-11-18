import { shallowEqual, useSelector } from 'react-redux';
import { MenuItem, TextField } from '@mui/material';
import { useContext, useEffect, useState, useRef, RefObject } from 'react';
import { ITeamCheckReferenceStrings, SectionResource } from '../../../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { useArtifactCategory } from '../../../crud';
import { teamCheckRefSelector } from '../../../selector';

interface IRecordProps {
  sectionResource: Array<SectionResource>;
}
interface IProps {
  inResource?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
}
export const SelectMyResource = (props: IProps & IRecordProps) => {
  const { onChange, inResource, required } = props;
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
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
      fullWidth={true}
    >
      {rowData
        .filter(
          (r) =>
            r?.isResource && !r?.isText && checkCategory(r?.artifactCategory)
        )
        .map((r, k) => (
          <MenuItem id={`my-res-${k}`} value={r.id} key={r.id}>
            {r.artifactName}
          </MenuItem>
        ))}
    </TextField>
  );
};
const mapRecordsToProps = {
  sectionResource: (q: QueryBuilder) => q.findRecords('sectionresource'),
};

export default withData(mapRecordsToProps)(SelectMyResource) as any as (
  props: IProps
) => JSX.Element;
