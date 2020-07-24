import React from 'react';
import { useGlobal } from 'reactn';
import clsx from 'clsx';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Card,
  CardActions,
  CardContent,
  Typography,
  Chip,
} from '@material-ui/core';
import moment from 'moment';
import { Project } from '../../model';
import { TeamContext } from '../../context/TeamContext';
import { ProjectMenu } from '.';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      minWidth: 275,
      margin: theme.spacing(1),
      backgroundColor: theme.palette.primary.light,
    },
    rootLoaded: {
      backgroundColor: theme.palette.primary.dark,
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    firstLine: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
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
  const [projectsLoaded] = useGlobal('projectsLoaded');
  const ctx = React.useContext(TeamContext);
  const { selectProject, projectType, projectPlans } = ctx.state;

  const handleSelect = (project: Project) => () => {
    selectProject(project);
  };

  const handleProjectAction = (what: string) => {
    console.log(`clicked ${what} for ${project?.attributes?.name}`);
  };

  moment.locale(ctx.state.lang);
  return (
    <Card
      className={clsx(classes.root, {
        [classes.rootLoaded]: projectsLoaded.includes(project.id),
      })}
      onClick={handleSelect(project)}
    >
      <CardContent className={classes.content}>
        <div className={classes.firstLine}>
          <Typography variant="h6" component="h2">
            {project?.attributes?.name}
          </Typography>
          <ProjectMenu action={handleProjectAction} />
        </div>
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
          {`${moment(project?.attributes?.dateCreated).format('ll')} - ${moment(
            project?.attributes?.dateUpdated
          ).format('ll')}`}
        </Typography>
      </CardContent>
      <CardActions>
        <Chip size="small" label={projectType(project)} />
      </CardActions>
    </Card>
  );
};
