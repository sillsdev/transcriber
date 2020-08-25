import React, { useState } from 'react';
import { useGlobal, useEffect } from 'reactn';
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
import ProjectMenu from './ProjectMenu';
import { BigDialog } from '../../hoc/BigDialog';
import IntegrationTab from '../Integration';
import ExportTab from '../TranscriptionTab';
import ImportTab from '../ImportTab';
import Confirm from '../AlertDialog';
import { ProjectDialog, IProjectDialog } from './ProjectDialog';
import { usePlan, useProjectPlans } from '../../crud';
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

interface IProps {
  project: VProject;
}

export const ProjectCard = (props: IProps) => {
  const classes = useStyles();
  const { project } = props;
  const ctx = React.useContext(TeamContext);
  const {
    auth,
    selectProject,
    setProjectParams,
    projectSections,
    projectDescription,
    projectLanguage,
    projectUpdate,
    projectDelete,
    cardStrings,
    projButtonStrings,
  } = ctx.state;
  const { getPlanName } = usePlan();
  const [projectId] = useGlobal('project');
  const projectPlans = useProjectPlans();
  const [openProject, setOpenProject] = useState(false);
  const [openIntegration, setOpenIntegration] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [deleteItem, setDeleteItem] = useState<VProject>();
  const [open, setOpen] = useState('');
  const t = cardStrings;
  const tpb = projButtonStrings;

  const handleSelect = (project: VProject) => () => {
    selectProject(project);
  };

  useEffect(() => {
    if (open !== '') doOpen(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, open]);

  const doOpen = (what: string) => {
    if (what === 'settings') {
      setOpenProject(true);
    } else if (what === 'sync') {
      console.log('sync');
    } else if (what === 'integration') {
      console.log('integration');
      setOpenIntegration(true);
    } else if (what === 'import') {
      console.log('import');
      setOpenImport(true);
    } else if (what === 'export') {
      console.log('export');
      setOpenExport(true);
    } else if (what === 'delete') {
      setDeleteItem(project);
    }
    setOpen('');
  };
  const handleProjectAction = (what: string) => {
    const [projectid] = setProjectParams(project);
    //otherwise it will be done in the useEffect for projectId
    if (projectid === projectId) doOpen(what);
    else setOpen(what);
  };

  const handleOpen = (open: boolean) => {
    setOpenProject(open);
  };

  const handleCommit = (values: IProjectDialog) => {
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

  const sectionCount = projectSections(project);

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
            {sectionCount !== '<na>' &&
              t.sectionStatus
                .replace('{0}', sectionCount)
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
        isOpen={openProject}
        onOpen={handleOpen}
        onCommit={handleCommit}
      />
      <BigDialog
        title={tpb.integrationsTitle.replace('{0}', getPlanName(project.id))}
        isOpen={openIntegration}
        onOpen={setOpenIntegration}
      >
        <IntegrationTab {...props} auth={auth} />
      </BigDialog>
      <BigDialog
        title={tpb.exportTitle.replace('{0}', getPlanName(project.id))}
        isOpen={openExport}
        onOpen={setOpenExport}
      >
        <ExportTab
          {...props}
          auth={auth}
          projectPlans={projectPlans(projectId)}
          planColumn={true}
        />
      </BigDialog>
      <BigDialog
        title={tpb.importTitle.replace('{0}', getPlanName(project.id))}
        isOpen={openImport}
        onOpen={setOpenImport}
      >
        <ImportTab {...props} auth={auth} />
      </BigDialog>

      {deleteItem && (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
    </div>
  );
};
