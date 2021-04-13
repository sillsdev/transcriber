import React from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, IGroupSettingsStrings } from '../../model';
import localStrings from '../../selector/localize';
import {
  FormLabel,
  FormGroup,
  List,
  IconButton,
  Grid,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import useStyles from './GroupSettingsStyles';
import PersonItems from './PersonItems';

interface IStateProps {
  t: IGroupSettingsStrings;
}
export interface IPerson {
  canDelete: boolean;
  user: string;
}
interface IProps extends IStateProps {
  detail: boolean;
  title: string;
  titledetail: string;
  people: IPerson[];
  add: () => void;
  del: (id: string, name: string) => void;
  allUsers?: boolean;
}

function TeamCol(props: IProps) {
  const { detail, people, add, del, allUsers, title, titledetail } = props;
  const classes = useStyles();
  const [orgRole] = useGlobal('orgRole');

  return (
    <Grid item xs={12} md={4}>
      <FormGroup className={classes.group}>
        <FormLabel className={classes.label}>
          {title} {titledetail}
          <div className={classes.grow}>{'\u00A0'}</div>
          {!detail && orgRole === 'admin' && !allUsers && (
            <IconButton
              id="teamColAdd"
              size="small"
              className={classes.addButton}
              onClick={add}
            >
              <AddIcon />
            </IconButton>
          )}
        </FormLabel>
        <List dense={true}>
          <PersonItems
            {...props}
            ids={people}
            rev={true}
            del={del}
            allUsers={allUsers}
          />
        </List>
      </FormGroup>
    </Grid>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
});

export default connect(mapStateToProps)(TeamCol) as any;
