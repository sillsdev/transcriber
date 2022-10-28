import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IState, Section, Plan, IGroupSettingsStrings } from '../../model';
import localStrings from '../../selector/localize';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import { related, useOrganizedBy } from '../../crud';
import { detailProps } from './GroupSettingsStyles';
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
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy] = useState(getOrganizedBy(false));

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
      <List sx={detailProps}>
        {keys
          .sort((i, j) => (i <= j ? -1 : 1))
          .map((p) => {
            return (
              <ListItem sx={detailProps}>
                <ListItemText
                  primary={
                    <>
                      <Typography>- {p}</Typography>
                      <Typography>
                        {t.assignedSections.replace('{0}', organizedBy)}
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
