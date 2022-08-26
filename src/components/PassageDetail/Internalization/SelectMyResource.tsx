import { connect } from 'react-redux';
import { MenuItem, TextField } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import {
  ITeamCheckReferenceStrings,
  IState,
  SectionResource,
} from '../../../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../../mods/react-orbitjs';
import localStrings from '../../../selector/localize';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { useArtifactCategory } from '../../../crud';

interface IStateProps {
  t: ITeamCheckReferenceStrings;
}
interface IRecordProps {
  sectionResource: Array<SectionResource>;
}
interface IProps extends IStateProps, IRecordProps {
  inResource?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
}
export const SelectMyResource = (props: IProps) => {
  const { t, onChange, inResource, required } = props;
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const [resource, setResource] = useState('');
  const { scriptureTypeCategory } = useArtifactCategory();

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

  return (
    <TextField
      id="select-my-resource"
      sx={{ mx: 1, display: 'flex', flexGrow: 1 }}
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
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'teamCheckReference' }),
});

const mapRecordsToProps = {
  sectionResource: (q: QueryBuilder) => q.findRecords('sectionresource'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(SelectMyResource) as any
) as any;
