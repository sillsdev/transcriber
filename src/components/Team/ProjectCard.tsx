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
import ScriptureIcon from '@mui/icons-material/MenuBook';
import { BsPencilSquare } from 'react-icons/bs';
import moment from 'moment';
import { VProject, DialogMode } from '../../model';
import { TeamContext } from '../../context/TeamContext';
import ProjectMenu from './ProjectMenu';
import BigDialog from '../../hoc/BigDialog';
import IntegrationTab from '../Integration';
import ExportTab from '../TranscriptionTab';
import Visualize from '../Visualize';
import Confirm from '../AlertDialog';
import { ProjectDialog, IProjectDialog } from './ProjectDialog';
import {
  usePlan,
  useProjectPlans,
  useOrganizedBy,
  useOfflnProjRead,
  useOfflineAvailToggle,
  related,
} from '../../crud';
import { localizeProjectTag } from '../../utils/localizeProjectTag';
import OfflineIcon from '@mui/icons-material/OfflinePin';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      '&:hover button': {
        color: 'white',
      },
      '& .MuiTypography-root': {
        cursor: 'default ',
      },
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
    offline: {
      display: 'flex',
      color: theme.palette.primary.contrastText,
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
    loadProject,
    selectProject,
    setProjectParams,
    projectSections,
    projectDescription,
    projectLanguage,
    projectUpdate,
    projectDelete,
    isOwner,
    cardStrings,
    vProjectStrings,
    projButtonStrings,
    doImport,
  } = ctx.state;
  const { getPlanName } = usePlan();
  const { localizedOrganizedBy } = useOrganizedBy();
  const [organizedBySing, setOrganizedBySing] = useState('');
  const [organizedByPlural, setOrganizedByPlural] = useState('');
  const [projectId] = useGlobal('project');
  const projectPlans = useProjectPlans();
  const offlineProjectRead = useOfflnProjRead();
  const offlineAvailToggle = useOfflineAvailToggle();
  const [openProject, setOpenProject] = useState(false);
  const [openIntegration, setOpenIntegration] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openReports, setOpenReports] = useState(false);
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

  useEffect(() => {
    setOrganizedBySing(
      localizedOrganizedBy(project.attributes.organizedBy, true)
    );
    setOrganizedByPlural(
      localizedOrganizedBy(project.attributes.organizedBy, false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  const LoadAndGo = async (what: string) => {
    loadProject(project, () => {
      switch (what) {
        case 'import':
          doImport(project);
          break;
        case 'export':
          setOpenExport(true);
          break;
        case 'reports':
          setOpenReports(true);
          break;
        case 'offlineAvail':
          offlineAvailToggle(related(project, 'project'));
          break;
      }
    });
  };

  const doOpen = (what: string) => {
    switch (what) {
      case 'settings':
        setOpenProject(true);
        break;
      case 'integration':
        setOpenIntegration(true);
        break;
      case 'delete':
        setDeleteItem(project);
        break;
      case 'import':
      case 'export':
      case 'reports':
      case 'offlineAvail':
        LoadAndGo(what);
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
      isPublic,
      spellCheck,
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
        isPublic,
        spellCheck,
        defaultFont: values.font,
        defaultFontSize: values.fontSize,
        rtl,
        tags,
        flat: values.flat,
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
      book: '',
      bcp47: attr.language,
      languageName: attr.languageName || '',
      isPublic: attr.isPublic,
      spellCheck: attr.spellCheck || false,
      font: attr.defaultFont || '',
      rtl: attr.rtl,
      fontSize: attr.defaultFontSize || '',
      tags: attr.tags || {},
      flat: attr.flat,
      organizedBy: attr.organizedBy || vProjectStrings.sections,
      vProjectStrings: vProjectStrings,
    };
    return value;
  };

  moment.locale(ctx.state.lang);

  const sectionCount = projectSections(project);

  return (
    <div className={classes.root}>
      <Card
        id={`card-${project.id}`}
        className={classes.card}
        onClick={handleSelect(project)}
      >
        <CardContent className={classes.content}>
          <div className={classes.firstLine}>
            <Typography variant="h6" component="h2" className={classes.name}>
              {(project?.attributes?.type || '').toLowerCase() ===
              'scripture' ? (
                <ScriptureIcon />
              ) : (
                <BsPencilSquare />
              )}
              {'\u00A0 '}
              {project?.attributes?.name}
            </Typography>
            <ProjectMenu
              action={handleProjectAction}
              isOwner={isOwner(project)}
              project={project}
              inProject={false}
            />
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
                  Number(sectionCount) === 1
                    ? organizedBySing
                    : organizedByPlural
                )}
          </Typography>
        </CardContent>
        {project?.attributes?.tags && (
          <CardActions>
            <>
              {offlineProjectRead(project).attributes?.offlineAvailable && (
                <div className={classes.offline}>
                  <OfflineIcon />
                  {'\u00A0'}
                  <Typography>{t.offline}</Typography>
                </div>
              )}
              {Object.keys(project?.attributes?.tags)
                .filter((t) => project?.attributes?.tags[t])
                .map((t) => (
                  <Chip
                    key={t}
                    size="small"
                    label={localizeProjectTag(t, vProjectStrings)}
                  />
                ))}
            </>
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
        title={tpb.reportsTitle.replace('{0}', getPlanName(project.id))}
        isOpen={openReports}
        onOpen={setOpenReports}
      >
        <Visualize selectedPlan={project.id} />
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
