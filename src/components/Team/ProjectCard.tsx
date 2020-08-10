import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Card,
  CardActions,
  CardContent,
  Typography,
  Chip,
} from '@material-ui/core';
import ScriptureIcon from '@material-ui/icons/MenuBook';
import { BsPencilSquare } from 'react-icons/bs';
import moment from 'moment';
import { VProject, DialogMode } from '../../model';
import { TeamContext } from '../../context/TeamContext';
import { ProjectMenu } from '.';
import Confirm from '../AlertDialog';
import { ProjectDialog, IProjectDialog } from './ProjectDialog';
import { camel2Title } from '../../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    card: {
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
      color: theme.palette.primary.contrastText,
    },
    firstLine: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    name: {
      display: 'flex',
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
  sectionStatus: '{0} {1}',
  sections: 'sections',
};

interface IProps {
  project: VProject;
}

export const ProjectCard = (props: IProps) => {
  const classes = useStyles();
  const { project } = props;
  const ctx = React.useContext(TeamContext);
  const {
    selectProject,
    projectSections,
    projectDescription,
    projectLanguage,
    projectUpdate,
    projectDelete,
  } = ctx.state;
  const [open, setOpen] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<VProject>();

  const handleSelect = (project: VProject) => () => {
    selectProject(project);
  };

  const handleProjectAction = (what: string) => {
    console.log(`clicked ${what} for ${project?.attributes?.name}`);
    if (what === 'settings') {
      setOpen(true);
    } else if (what === 'delete') {
      setDeleteItem(project);
    }
  };

  const handleOpen = (open: boolean) => {
    setOpen(open);
  };

  const handleCommit = (values: IProjectDialog) => {
    console.log(`commiting changes: ${values}`);
    const {
      name,
      description,
      type,
      languageName,
      rtl,
      tags,
      organizedBy,
    } = values;
    projectUpdate({
      ...project,
      attributes: {
        ...project.attributes,
        name,
        description,
        type,
        language: values.bcp47,
        languageName,
        defaultFont: values.font,
        defaultFontSize: values.fontSize,
        rtl,
        tags,
        flat: values.layout === 'flat',
        organizedBy,
      },
    });
  };

  const handleDeleteConfirmed = () => {
    if (!deleteItem) return;
    console.log(`deleting: ${deleteItem?.attributes?.name}`);
    projectDelete(deleteItem);
    setDeleteItem(undefined);
  };

  const handleDeleteRefused = () => {
    setDeleteItem(undefined);
  };

  const projectValues = (project: VProject) => {
    const attr = project.attributes;
    const value: IProjectDialog = {
      name: attr.name,
      description: attr.description || '',
      type: attr.type,
      bcp47: attr.language,
      languageName: attr.languageName || '',
      font: attr.defaultFont || '',
      rtl: attr.rtl,
      fontSize: attr.defaultFontSize || '',
      tags: attr.tags || {},
      layout: attr.flat ? 'flat' : 'hierarchical',
      organizedBy: attr.organizedBy || 'sections',
    };
    return value;
  };

  moment.locale(ctx.state.lang);

  return (
    <div className={classes.root}>
      <Card className={classes.card} onClick={handleSelect(project)}>
        <CardContent className={classes.content}>
          <div className={classes.firstLine}>
            <Typography variant="h6" component="h2" className={classes.name}>
              {project?.attributes?.type === 'scripture' ? (
                <ScriptureIcon />
              ) : (
                <BsPencilSquare />
              )}
              {'\u00A0 '}
              {project?.attributes?.name}
            </Typography>
            <ProjectMenu action={handleProjectAction} />
          </div>
          <Typography className={classes.pos}>
            {projectDescription(project)}
          </Typography>
          <Typography variant="body2" component="p">
            {t.language.replace('{0}', projectLanguage(project))}
          </Typography>
          <Typography variant="body2" component="p">
            {t.sectionStatus
              .replace('{0}', projectSections(project))
              .replace(
                '{1}',
                camel2Title(project?.attributes?.organizedBy || t.sections)
              )}
          </Typography>
        </CardContent>
        {project?.attributes?.tags && (
          <CardActions>
            {Object.keys(project?.attributes?.tags)
              .filter((t) => project?.attributes?.tags[t])
              .map((t) => (
                <Chip key={t} size="small" label={camel2Title(t)} />
              ))}
          </CardActions>
        )}
      </Card>
      <ProjectDialog
        mode={DialogMode.edit}
        values={projectValues(project)}
        isOpen={open}
        onOpen={handleOpen}
        onCommit={handleCommit}
      />
      {deleteItem && (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
    </div>
  );
};
