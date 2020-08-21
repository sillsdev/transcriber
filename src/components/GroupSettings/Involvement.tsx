import React from 'react';
import { connect } from 'react-redux';
import { IState, Section, Plan, IGroupSettingsStrings } from '../../model';
import localStrings from '../../selector/localize';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { related } from '../../crud';
import useStyles from './GroupSettingsStyles';
import getPlan from './GetPlan';

interface IPlanData {
  [plan: string]: string[];
}

interface IStateProps {
  t: IGroupSettingsStrings;
}

interface IRecordProps {
  sections: Section[];
  plans: Plan[];
}

interface IProps extends IStateProps, IRecordProps {
  user: string;
  rev: boolean;
}

function Involvement(props: IProps) {
  const { user, rev, t } = props;
  const { sections, plans } = props;
  const classes = useStyles();

  let planData: IPlanData = {};
  sections
    .filter(
      (s) =>
        (rev && related(s, 'editor') === user) ||
        (!rev && related(s, 'transcriber') === user)
    )
    .forEach((s) => {
      const planName = getPlan(s, plans);
      if (planName) {
        if (planData.hasOwnProperty(planName)) {
          if (!planData[planName].includes(s.id)) {
            planData[planName].push(s.id);
          }
        } else {
          planData[planName] = [s.id];
        }
      }
    });
  const keys = Object.keys(planData);
  if (keys.length === 0) return <></>;

  return (
    <>
      <Typography>{t.projectPlans}</Typography>
      <List className={classes.detail}>
        {keys
          .sort((i, j) => (i < j ? -1 : 1))
          .map((p) => {
            return (
              <ListItem className={classes.detail}>
                <ListItemText
                  primary={
                    <>
                      <Typography>- {p}</Typography>
                      <Typography>
                        {t.assignedSections}
                        {planData[p].length}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            );
          })}
      </List>
    </>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'groupSettings' }),
});

const mapRecordsToProps = {
  sections: (q: QueryBuilder) => q.findRecords('section'),
  plans: (q: QueryBuilder) => q.findRecords('plan'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(Involvement) as any
) as any;
