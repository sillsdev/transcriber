import React, { useContext, useMemo, useState } from 'react';
import { useGlobal, useEffect } from 'reactn';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardActions,
  CardContent,
  Typography,
  Chip,
  styled,
  CardProps,
  CardContentProps,
  Box,
  ChipProps,
} from '@mui/material';
import * as actions from '../../store';
import ScriptureIcon from '@mui/icons-material/MenuBook';
import { BsPencilSquare } from 'react-icons/bs';
import moment from 'moment';
import { VProject, DialogMode, IState } from '../../model';
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
  useRole,
  remoteIdNum,
} from '../../crud';
import { localizeProjectTag } from '../../utils/localizeProjectTag';
import OfflineIcon from '@mui/icons-material/OfflinePin';
import { useHome } from '../../utils';
import { copyComplete, CopyProjectProps } from '../../store';
import { TokenContext } from '../../context/TokenProvider';
import { useSnackBar } from '../../hoc/SnackBar';

const ProjectCardRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  '&:hover button': {
    color: 'white',
  },
  '& .MuiTypography-root': {
    cursor: 'default ',
  },
  cursor: 'pointer',
}));

const StyledCard = styled(Card)<CardProps>(({ theme }) => ({
  minWidth: 275,
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.light,
}));

const StyledCardContent = styled(CardContent)<CardContentProps>(
  ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    color: theme.palette.primary.contrastText,
  })
);

const FirstLineDiv = styled('div')(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const StyledChip = styled(Chip)<ChipProps>(({ theme }) => ({
  backgroundColor: theme.palette.grey[400],
}));

interface IProps {
  project: VProject;
}

export const ProjectCard = (props: IProps) => {
  const { project } = props;
  const ctx = React.useContext(TeamContext);
  const {
    loadProject,
    setProjectParams,
    projectSections,
    projectDescription,
    projectLanguage,
    projectUpdate,
    projectDelete,
    cardStrings,
    vProjectStrings,
    projButtonStrings,
    sections,
    doImport,
  } = ctx.state;
  const dispatch = useDispatch();

  const copyProject = (props: CopyProjectProps) =>
    dispatch(actions.copyProject(props));
  const copyStatus = useSelector(
    (state: IState) => state.importexport.importexportStatus
  );
  const { accessToken } = useContext(TokenContext).state;
  const [errorReporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');
  const { showMessage } = useSnackBar();
  const [, setBusy] = useGlobal('importexportBusy');
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
  const [isAdmin, setIsAdmin] = useState(false);
  const t = cardStrings;
  const tpb = projButtonStrings;
  const { userIsOrgAdmin } = useRole();
  const { leaveHome } = useHome();

  const handleSelect = (project: VProject) => () => {
    loadProject(project);
    leaveHome();
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
    setIsAdmin(userIsOrgAdmin(related(project, 'organization')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);
  useEffect(() => {
    if (copyStatus) {
      if (copyStatus.errStatus || copyStatus.complete) {
        copyComplete();
        setBusy(false);
      }
      showMessage(copyStatus.statusMsg);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [copyStatus]);

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
      case 'copysame':
      case 'copynew':
        copyProject({
          projectid: remoteIdNum('project', projectId, memory.keyMap),
          sameorg: what === 'copysame',
          token: accessToken,
          errorReporter: errorReporter,
          pendingmsg: t.copyStatus,
          completemsg: t.copyComplete,
        });
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

  const sectionCount = useMemo(
    () => projectSections(project),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project, sections.length]
  );

  return (
    <ProjectCardRoot>
      <StyledCard id={`card-${project.id}`} onClick={handleSelect(project)}>
        <StyledCardContent>
          <FirstLineDiv>
            <Typography
              variant="h6"
              component="h2"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
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
              project={project}
              inProject={false}
              isAdmin={isAdmin}
            />
          </FirstLineDiv>
          <Typography sx={{ mb: 2 }}>{projectDescription(project)}</Typography>
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
        </StyledCardContent>
        {project?.attributes?.tags && (
          <CardActions>
            <>
              {offlineProjectRead(project).attributes?.offlineAvailable && (
                <Box sx={{ display: 'flex', color: 'primary.contrastText' }}>
                  <OfflineIcon />
                  {'\u00A0'}
                  <Typography>{t.offline}</Typography>
                </Box>
              )}
              {Object.keys(project?.attributes?.tags)
                .filter((t) => project?.attributes?.tags[t])
                .map((t) => (
                  <StyledChip
                    key={t}
                    size="small"
                    label={localizeProjectTag(t, vProjectStrings)}
                  />
                ))}
            </>
          </CardActions>
        )}
      </StyledCard>
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
        <IntegrationTab />
      </BigDialog>
      <BigDialog
        title={tpb.exportTitle.replace('{0}', getPlanName(project.id))}
        isOpen={openExport}
        onOpen={setOpenExport}
      >
        <ExportTab
          {...props}
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
    </ProjectCardRoot>
  );
};
