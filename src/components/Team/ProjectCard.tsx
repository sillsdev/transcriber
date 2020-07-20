import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Card,
  CardActions,
  CardContent,
  Typography,
  Chip,
  Button,
} from '@material-ui/core';
import moment from 'moment';
import { Project } from '../../model';
import { TeamContext } from '../../context/TeamContext';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      minWidth: 275,
      margin: theme.spacing(1),
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    button: {
      textTransform: 'none',
    },
    pos: {
      marginBottom: 12,
    },
  })
);

const t = {
  language: 'Language: {0}',
  plans: 'Plans',
  passages: 'Passages',
};

interface IProps {
  project: Project;
}

export const ProjectCard = (props: IProps) => {
  const classes = useStyles();
  const { project } = props;
  const ctx = React.useContext(TeamContext);
  const { selectProject, projectType, projectPlans } = ctx.state;

  const handleSelect = (project: Project) => () => {
    selectProject(project);
  };

  moment.locale(ctx.state.lang);
  return (
    <Button
      key={project.id}
      className={classes.button}
      onClick={handleSelect(project)}
    >
      <Card className={classes.root}>
        <CardContent className={classes.content}>
          <Typography variant="h6" component="h2">
            {project?.attributes?.name}
          </Typography>
          <Typography className={classes.pos} color="textSecondary">
            {project?.attributes?.description}
          </Typography>
          <Typography variant="body2" component="p">
            {t.language.replace('{0}', project?.attributes?.languageName || '')}
          </Typography>
          <Typography variant="body2" component="p">
            {`${projectPlans(project)} ${t.plans}`}
          </Typography>
          <Typography variant="body2" component="p">
            {`${moment(project?.attributes?.dateCreated).format(
              'll'
            )} - ${moment(project?.attributes?.dateUpdated).format('ll')}`}
          </Typography>
        </CardContent>
        <CardActions>
          <Chip size="small" label={projectType(project)} />
        </CardActions>
      </Card>
    </Button>
  );
};
