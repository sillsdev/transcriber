import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useGetGlobal, useGlobal } from '../../context/GlobalContext';
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
import StoryIcon from '@mui/icons-material/RecordVoiceOver';
import { BsPencilSquare } from 'react-icons/bs';
import ShareIcon from '@mui/icons-material/OfflineShare';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import EditNoteIcon from '@mui/icons-material/EditNote';
import moment from 'moment';
import {
  DialogMode,
  IState,
  ProjectD,
  Section,
  SectionD,
  VProjectD,
} from '../../model';
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
import { useHome, useJsonParams } from '../../utils';
import { copyComplete, CopyProjectProps } from '../../store';
import { TokenContext } from '../../context/TokenProvider';
import { useSnackBar } from '../../hoc/SnackBar';
import CategoryTabs from './CategoryTabs';
import { RecordKeyMap } from '@orbit/records';
import {
  projDefBook,
  projDefSectionMap,
  projDefStory,
  useProjectDefaults,
} from '../../crud/useProjectDefaults';
import { useOrbitData } from '../../hoc/useOrbitData';
import { UpdateRecord } from '../../model/baseModel';
import { useProjectPermissions } from '../../utils/useProjectPermissions';

const ProjectCardRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  '&:hover button': {
    color: 'white',
  },
  '& .MuiTypography-root': {
    cursor: 'default ',
  },
  '& .MuiCardContent-root': {
    maxWidth: '243px',
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
  project: VProjectD;
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
    personalProjects,
    doImport,
  } = ctx.state;
  const dispatch = useDispatch();

  const copyProject = (props: CopyProjectProps) =>
    dispatch(actions.copyProject(props));
  const copyStatus = useSelector(
    (state: IState) => state.importexport.importexportStatus
  );
  const [copying, setCopying] = useState(false);
  const { accessToken } = useContext(TokenContext).state;
  const [errorReporter] = useGlobal('errorReporter');
  const [memory] = useGlobal('memory');
  const { showMessage } = useSnackBar();
  const [, setBusy] = useGlobal('importexportBusy');
  const { getPlanName } = usePlan();
  const { localizedOrganizedBy } = useOrganizedBy();
  const [, setOrganizedBySing] = useState('');
  const [, setOrganizedByPlural] = useState('');
  const [projectId] = useGlobal('project'); //verified this is not used in a function 2/18/25
  const [user] = useGlobal('user');
  const projectPlans = useProjectPlans();
  const offlineProjectRead = useOfflnProjRead();
  const offlineAvailToggle = useOfflineAvailToggle();
  const [openProject, setOpenProject] = useState(false);
  const [openIntegration, setOpenIntegration] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openReports, setOpenReports] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [deleteItem, setDeleteItem] = useState<VProjectD>();
  const [open, setOpen] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { getProjectDefault } = useProjectDefaults();
  const t = cardStrings;
  const tpb = projButtonStrings;
  const { userIsOrgAdmin } = useRole();
  const { leaveHome } = useHome();
  const { getParam, setParam } = useJsonParams();
  const sections = useOrbitData<Section[]>('section');
  const getGlobal = useGetGlobal();
  const handleSelect = (project: VProjectD) => () => {
    loadProject(project);
    leaveHome();
  };

  const { canPublish, canEditSheet } = useProjectPermissions(
    related(project, 'organization'),
    related(project, 'project')
  );

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
    if (copying && copyStatus) {
      if (copyStatus.errStatus || copyStatus.complete) {
        copyComplete();
        setCopying(false);
        setBusy(false);
        showMessage(copyStatus.errMsg ?? copyStatus.statusMsg);
      } else showMessage(copyStatus.statusMsg);
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
      case 'category':
        setOpenCategory(true);
        break;
      case 'copysame':
      case 'copynew':
        setCopying(true);
        copyProject({
          projectid: remoteIdNum(
            'project',
            getGlobal('project'),
            memory?.keyMap as RecordKeyMap
          ),
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

  const handleCloseCategory = () => {
    setOpenCategory(false);
  };

  const handleProjectAction = (what: string) => {
    const [projectid] = setProjectParams(project);
    //otherwise it will be done in the useEffect for projectId
    if (projectid === getGlobal('project')) doOpen(what);
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
      book,
      story,
      sheetGroup,
      sheetUser,
      publishGroup,
      publishUser,
    } = values;
    var oldBook = getParam(projDefBook, project?.attributes?.defaultParams);
    var defaultParams = setParam(
      projDefBook,
      book,
      project?.attributes?.defaultParams
    );
    defaultParams = setParam(projDefStory, story, defaultParams);
    projectUpdate({
      ...project,
      attributes: {
        ...project.attributes,
        name,
        description,
        type,
        language: values?.bcp47 ?? 'und',
        languageName,
        isPublic,
        spellCheck,
        defaultFont: values.font,
        defaultFontSize: values.fontSize,
        rtl,
        tags,
        flat: values.flat,
        organizedBy,
        defaultParams,
        sheetUser,
        sheetGroup,
        publishUser,
        publishGroup,
      },
    });
    if (oldBook !== book) UpdatePublishingBookRows(oldBook, book);
  };
  const UpdatePublishingBookRows = (oldbook: string, book: string) => {
    var rows = sections.filter((s) => related(s, 'plan') === project.id);
    const labels = ['BOOK', 'ALTBK'];
    labels.forEach((label) => {
      var books = rows.filter((s) =>
        s.attributes?.state?.startsWith(label)
      ) as SectionD[];
      books.forEach((row) => {
        if (book) {
          row.attributes.state = row.attributes.state = `${label} ${book}`;
          row.attributes.name = row.attributes.name.replace(oldbook, book);
          memory.update((t) => UpdateRecord(t, row, user));
        } else memory.update((t) => t.removeRecord(row));
      });
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

  const isStory = useMemo(
    () => getProjectDefault(projDefStory, project as any as ProjectD) ?? true,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project]
  );

  const projectValues = (project: VProjectD) => {
    const attr = project.attributes;
    const value: IProjectDialog = {
      name: attr.name,
      description: attr.description || '',
      type: attr?.type,
      book: getProjectDefault(projDefBook, project as any as ProjectD) || '',
      story: isStory,
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
      isPersonal: personalProjects.includes(project),
      vProjectStrings: vProjectStrings,
      sheetUser: related(project, 'editsheetuser'),
      sheetGroup: related(project, 'editsheetgroup'),
      publishUser: related(project, 'publishuser'),
      publishGroup: related(project, 'publishgroup'),
    };
    return value;
  };

  moment.locale(ctx.state.lang);

  const sectionCount = useMemo(
    () => projectSections(project),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project]
  );

  return (
    <ProjectCardRoot>
      <StyledCard id={`card-${project.id}`} onClick={handleSelect(project)}>
        <StyledCardContent>
          <FirstLineDiv>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {(project?.attributes?.type || '').toLowerCase() ===
              'scripture' ? (
                <ScriptureIcon />
              ) : isStory ? (
                <StoryIcon />
              ) : (
                <BsPencilSquare />
              )}
              {project.attributes.isPublic && <ShareIcon />}
              {'\u00A0 '}
              {project?.attributes?.name}
            </Typography>
            <ProjectMenu
              action={handleProjectAction}
              project={project}
              inProject={false}
              isAdmin={isAdmin}
              isPersonal={personalProjects.includes(project)}
              canPublish={canPublish}
            />
          </FirstLineDiv>
          <Typography sx={{ mb: 2 }}>{projectDescription(project)}</Typography>
          <Typography variant="body2" component="p">
            {t.language.replace('{0}', projectLanguage(project))}
          </Typography>
          <Typography variant="body2" component="p">
            {sectionCount !== '<na>' && sectionCount}
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
              {canEditSheet && !isAdmin && (
                <EditNoteIcon
                  sx={{ display: 'flex', color: 'primary.contrastText' }}
                />
              )}
              {canPublish && !isAdmin && (
                <PublishedWithChangesIcon
                  sx={{ display: 'flex', color: 'primary.contrastText' }}
                />
              )}
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
        <IntegrationTab
          isPermitted={true}
          projectId={related(project, 'project')}
          planId={project.id}
        />
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
          sectionArr={getProjectDefault(projDefSectionMap) ?? []}
        />
      </BigDialog>
      <BigDialog
        title={tpb.reportsTitle.replace('{0}', getPlanName(project.id))}
        isOpen={openReports}
        onOpen={setOpenReports}
      >
        <Visualize selectedPlan={project.id} />
      </BigDialog>
      <BigDialog
        title={
          !personalProjects.includes(project)
            ? t.editCategory
            : t.editPersonalCategory
        }
        isOpen={openCategory}
        onOpen={setOpenCategory}
      >
        <CategoryTabs
          teamId={related(project, 'organization') as string}
          flat={project.attributes.flat ?? false}
          onClose={handleCloseCategory}
        />
      </BigDialog>
      {deleteItem && (
        <Confirm
          text={''}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
    </ProjectCardRoot>
  );
};
