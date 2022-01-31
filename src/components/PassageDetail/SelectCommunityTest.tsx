import { connect } from 'react-redux';
import { MenuItem, TextField } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { ICommunityStrings, IState } from '../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import localStrings from '../../selector/localize';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { useArtifactType } from '../../crud';

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
  t: ICommunityStrings;
}
interface IRecordProps {}
interface IProps extends IStateProps, IRecordProps {
  inResource?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
}
export const SelectCommunityTest = (props: IProps) => {
  const { t, onChange, inResource, required } = props;
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const [resource, setResource] = useState('');
  const { localizedArtifactType } = useArtifactType();

  const handleUserChange = (e: any) => {
    setResource(e.target.value);
    onChange && onChange(e.target.value);
  };

  useEffect(() => {
    if (inResource) setResource(inResource);
  }, [inResource]);

  const nameOnly = (n: string) => {
    const parts = n.split('.');
    return parts.length > 1 ? parts[0] : n;
  };

  return (
    <TextField
      id="select-community-test"
      className={classes.textField}
      select
      label={t.playTest}
      value={resource}
      onChange={handleUserChange}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
      variant="filled"
      required={required}
    >
      {rowData
        .filter(
          (r) =>
            r.artifactType === localizedArtifactType('retell') ||
            r.artifactType === localizedArtifactType('qanda')
        )
        .sort((i, j) =>
          i.artifactType < j.artifactType
            ? -1
            : i.artifactType > j.artifactType
            ? 1
            : i.artifactName < j.artifactName
            ? -1
            : 1
        )
        .map((r) => (
          <MenuItem value={r.id} key={r.id}>
            {`${r.artifactType}:    ${nameOnly(r.artifactName)} ${
              r.mediafile.attributes?.performedBy
            }`}
          </MenuItem> //TODO change rows to a table?
        ))}
    </TextField>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'community' }),
});

export default connect(mapStateToProps)(SelectCommunityTest) as any;
