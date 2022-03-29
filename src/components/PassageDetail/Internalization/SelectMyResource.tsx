import { connect } from 'react-redux';
import { MenuItem, TextField } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import {
  ITeamCheckReferenceStrings,
  IState,
  SectionResource,
} from '../../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../../mods/react-orbitjs';
import localStrings from '../../../selector/localize';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { useArtifactCategory } from '../../../crud';
import { removeExtension } from '../../../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {},
    label: { marginTop: theme.spacing(1) },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
  })
);
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
  const classes = useStyles();
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

  const sortName = (i: string, j: string) => {
    const pat = /^(.*)([0-9]+)[\\.\\:]([0-9]+)?-?([0-9]+)?(.*)$/i;
    const iPat = pat.exec(removeExtension(i).name);
    const jPat = pat.exec(removeExtension(j).name);
    if (iPat && jPat) {
      if (iPat[1] === jPat[1]) {
        const i2 = parseInt(iPat[2]);
        const j2 = parseInt(jPat[2]);
        const i3 = parseInt(iPat[3]);
        const j3 = parseInt(jPat[3]);
        const i4 = parseInt(iPat[4]);
        const j4 = parseInt(jPat[4]);
        return i2 > j2
          ? 1
          : i2 < j2
          ? -1
          : i3 > j3
          ? 1
          : i3 < j3
          ? -1
          : i4 > j4
          ? 1
          : i4 < j4
          ? -1
          : iPat[5] > jPat[5]
          ? 1
          : -1;
      }
    }
    return i > j ? 1 : -1;
  };

  return (
    <TextField
      id="select-my-resource"
      className={classes.textField}
      select
      label={t.resource}
      helperText={t.resourcehelper}
      value={resource}
      onChange={handleUserChange}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
      variant="filled"
      required={required}
      fullWidth={true}
    >
      {rowData
        .filter(
          (r) =>
            r?.isResource && !r?.isText && checkCategory(r?.artifactCategory)
        )
        .sort((i, j) => sortName(i.artifactName, j.artifactName))
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
