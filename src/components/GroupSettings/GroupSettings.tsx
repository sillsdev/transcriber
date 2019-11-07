import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Group, IGroupSettingsStrings } from '../../model';
import localStrings from '../../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  TextField,
  FormLabel,
  FormControl,
  FormGroup,
  FormControlLabel,
  Button,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import useStyles from './GroupSettingsStyles';
import Team from './Team';
import GroupProjects from './GroupProjects';

interface IStateProps {
  t: IGroupSettingsStrings;
}

interface IRecordProps {
  groups: Array<Group>;
}

interface IProps extends IStateProps, IRecordProps {}

export function GroupSettings(props: IProps) {
  const { groups, t } = props;
  const [memory] = useGlobal('memory');
  const classes = useStyles();
  const [orgRole] = useGlobal('orgRole');
  const [group, setGroup] = useGlobal('group');
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleDescriptionChange = (e: any) => {
    setAbbreviation(e.target.value);
  };
  const handleSave = () => {
    memory.update((t: TransformBuilder) =>
      t.updateRecord({
        type: 'group',
        id: group,
        attributes: {
          name: name,
          abbreviation: abbreviation,
        },
      } as Group)
    );
    setGroup('');
  };

  useEffect(() => {
    const curGroup = groups.filter((p: Group) => p.id === group);
    if (curGroup.length === 1) {
      const attr = curGroup[0].attributes;
      setName(attr.name);
      setAbbreviation(attr.abbreviation ? attr.abbreviation : '');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [group, groups]);

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <FormControl>
          <FormGroup className={classes.group}>
            <FormControlLabel
              control={
                <TextField
                  id="name"
                  label={t.name}
                  className={classes.textField}
                  value={name}
                  onChange={handleNameChange}
                  margin="normal"
                  style={{ width: 400 }}
                  variant="filled"
                  required={true}
                  disabled={orgRole !== 'admin'}
                />
              }
              label=""
            />
            <FormControlLabel
              control={
                <TextField
                  id="abbreviation"
                  label={t.abbreviation}
                  className={classes.textField}
                  value={abbreviation}
                  onChange={handleDescriptionChange}
                  margin="normal"
                  variant="filled"
                  required={false}
                  disabled={orgRole !== 'admin'}
                />
              }
              label=""
            />
          </FormGroup>
          <FormLabel className={classes.label}>{t.projects}</FormLabel>
          <FormGroup className={classes.group}>
            <GroupProjects />
          </FormGroup>
        </FormControl>

        <Team detail={false} />
        {orgRole === 'admin' && (
          <div className={classes.actions}>
            <Button
              key="save"
              aria-label={t.save}
              variant="contained"
              color="primary"
              className={classes.button}
              onClick={handleSave}
            >
              {t.save}
              <SaveIcon className={classes.icon} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
});

const mapRecordsToProps = {
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  GroupSettings
) as any) as any;
