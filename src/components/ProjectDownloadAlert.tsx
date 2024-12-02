import React, { useContext, useMemo } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { useSelector } from 'react-redux';
import {
  MediaFileD,
  IProjectDownloadStrings,
  OfflineProject,
  ProjectD,
  OrganizationD,
  SectionD,
  PassageD,
  ISharedStrings,
} from '../model';
import ProjectDownload from './ProjectDownload';
import { dataPath, LocalKey, PathType } from '../utils';
import {
  related,
  useProjectPlans,
  getDownloadableMediaInPlans,
  useOrganizedBy,
  findRecord,
  useArtifactType,
  ArtifactTypeSlug,
  useFetchUrlNow,
} from '../crud';
import { isElectron } from '../api-variable';
import { useOrbitData } from '../hoc/useOrbitData';
import { projectDownloadSelector, sharedSelector } from '../selector';
import { useGlobal } from 'reactn';
import FilterIcon from '@mui/icons-material/FilterList';
import BigDialog, { BigDialogBp } from '../hoc/BigDialog';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { AltButton, formatTime, PriButton } from '../control';
import { DataGrid } from '@mui/x-data-grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  useProjectDefaults,
  projDefFilterParam,
  projDefSectionMap,
} from '../crud/useProjectDefaults';
import { ISTFilterState } from './Sheet/filterMenu';
import stringReplace from 'react-string-replace';

interface PlanProject {
  [planId: string]: string;
}

interface Limits {
  minSec: string;
  maxSec: string;
  filtered: number;
  missing: number;
  total: number;
}

interface IProps {
  cb: (cancel?: boolean) => void;
}

export const ProjectDownloadAlert = (props: IProps) => {
  const { cb } = props;
  const t: IProjectDownloadStrings = useSelector(projectDownloadSelector);
  const ts: ISharedStrings = useSelector(sharedSelector);
  const offlineProjects = useOrbitData<OfflineProject[]>('offlineproject');
  const organizations = useOrbitData<OrganizationD[]>('organization');
  const projects = useOrbitData<ProjectD[]>('project');
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const { slugFromId } = useArtifactType();
  const tokenCtx = useContext(TokenContext);
  const [hasSectionFilter, setHasSectionFilter] = React.useState(false);
  const [alert, setAlert] = React.useState(false);
  const [downloadSize, setDownloadSize] = React.useState(0);
  const downloadingRef = React.useRef(false);
  const [downloading, setDownloadingx] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const cancelRef = React.useRef(false);
  const [needyIds, setNeedyIds] = React.useState<string[]>([]);
  const [missingIds, setMissingIds] = React.useState<string[]>([]);
  const [filteredIds, setFilteredIds] = React.useState<string[]>([]);
  const [limits] = React.useState<Map<string, Limits>>(
    new Map<string, Limits>()
  );
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const [memory] = useGlobal('memory');
  const { getLocalDefault, getProjectDefault } = useProjectDefaults();
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy, setOrganizedBy] = React.useState('');
  const [organizedByPl, setOrganizedByPl] = React.useState('');
  const [downAmt, setDownAmt] = React.useState('project');
  const projectPlans = useProjectPlans();
  const fetchUrl = useFetchUrlNow();

  const setDownloading = (val: boolean) => {
    setDownloadingx(val);
    downloadingRef.current = val;
  };

  const getFilterState = (proj?: ProjectD): ISTFilterState =>
    proj
      ? getLocalDefault(projDefFilterParam, proj.id) ??
        getProjectDefault(projDefFilterParam, proj) ??
        {}
      : {};

  const getSectionArr = (project: string) => {
    let projRec = findRecord(memory, 'project', project) as ProjectD;
    let projSectionArr: undefined | [number, string][] = [];
    if (projRec) {
      projSectionArr = getProjectDefault(projDefSectionMap, projRec);
    }
    return projSectionArr ?? [];
  };

  const getSectNum = (sectionId: number, arr: [number, string][]) => {
    const sectionMap = new Map(arr);
    return sectionMap?.get(sectionId) || sectionId.toString();
  };

  const getNeedyRemoteIds = async () => {
    if (downloadingRef.current) return [];
    const ops = offlineProjects.filter(
      (op) => op?.attributes?.offlineAvailable
    );
    let planIds = Array<string>();
    const planProject: PlanProject = {};
    const selectedPlan = localStorage.getItem(LocalKey.plan);
    ops.forEach((offlineProjRec) => {
      var projectId = related(offlineProjRec, 'project') as string;
      const project = projects.find((pr) => pr.id === projectId);
      if (project?.keys?.remoteId) {
        projectPlans(projectId).forEach((pl) => {
          if (!selectedPlan || pl.id === selectedPlan) {
            planIds.push(pl.id as string);
            planProject[pl.id as string] = projectId;
          }
        });
      }
    });
    const mediaInfo = getDownloadableMediaInPlans(planIds, memory);
    const needyProject = new Set<string>();
    const fileNames = new Set<string>();
    limits.clear();
    let newMissingIds = [];
    let newFilteredIds = [];
    let missingSize = 0;
    for (const m of mediaInfo) {
      if (related(m.media, 'artifactType') || related(m.media, 'passage')) {
        var local = { localname: '' };
        var path = await dataPath(
          m.media.attributes?.audioUrl ||
            m.media.attributes?.s3file ||
            m.media.attributes?.originalFile ||
            '',
          PathType.MEDIA,
          local
        );
        const fileName = local.localname;
        if (fileNames.has(fileName)) continue;
        fileNames.add(fileName);
        const fileSize = m.media.attributes?.filesize || 0;
        const proj = planProject[m.plan];
        const projRec = projects.find((p) => p.id === proj);
        const filterState = getFilterState(projRec);
        const newHasSectionFilter =
          (filterState.minSection || filterState.maxSection) !== undefined;
        if (hasSectionFilter !== newHasSectionFilter) {
          setHasSectionFilter(newHasSectionFilter);
        }
        const arr = getSectionArr(proj);
        if (!limits.has(proj)) {
          limits.set(proj, {
            minSec: getSectNum(filterState.minSection || 0, arr),
            maxSec: getSectNum(filterState.maxSection || -1, arr),
            filtered: 0,
            missing: 0,
            total: 0,
          });
        }
        const limit = limits.get(proj);
        if (limit) limit.total += fileSize;
        if (path !== local.localname) {
          console.log('Needing download:', path, local.localname);
          needyProject.add(proj);
          missingSize += fileSize;
          if (limit) limit.missing += fileSize;
          newMissingIds.push(m.media?.keys?.remoteId || m.media.id);
          if (!organizedBy) setOrganizedBy(getOrganizedBy(true, m.plan));
          if (!organizedByPl) setOrganizedByPl(getOrganizedBy(false, m.plan));
          const artSlug = slugFromId(
            related(m.media, 'artifactType')
          ) as ArtifactTypeSlug;
          const incSlug = [
            ArtifactTypeSlug.IntellectualProperty,
            ArtifactTypeSlug.SharedResource,
            ArtifactTypeSlug.ProjectResource,
          ].includes(artSlug);
          if (incSlug) {
            if (limit) limit.filtered += fileSize;
            newFilteredIds.push(m.media?.keys?.remoteId || m.media.id);
          } else {
            const passId = related(m.media, 'passage') as string;
            const passRec = findRecord(memory, 'passage', passId) as
              | PassageD
              | undefined;
            const secId = related(passRec, 'section') as string;
            const section = findRecord(memory, 'section', secId) as
              | SectionD
              | undefined;
            const seq = section?.attributes?.sequencenum || 0;
            if (
              seq >= filterState.minSection &&
              (filterState.maxSection === -1 || seq <= filterState.maxSection)
            ) {
              if (limit) limit.filtered += fileSize;
              newFilteredIds.push(m.media?.keys?.remoteId || m.media.id);
            }
          }
        }
        if (limit) limits.set(proj, limit);
      }
    }
    setMissingIds(newMissingIds);
    setFilteredIds(newFilteredIds);
    if (downloadSize !== missingSize) {
      const newSize = Array.from(needyProject).reduce(
        (p, c) => p + (limits.get(c)?.total || 0),
        0
      );
      setDownloadSize(newSize);
    }

    return Array.from(needyProject);
  };

  const handleClose = (cancel?: boolean) => () => {
    setAlert(false);
    setDownloading(false);
    setProgress(0);
    cb(cancel);
  };

  const handleCancel = () => {
    cancelRef.current = true;
    handleClose(true)();
  };

  const handleDownload = async () => {
    setDownloading(true);
    if (downAmt === 'project') {
      setDownloadOpen(true);
    } else if (downAmt === 'filtered') {
      let n = 0;
      for (let id of filteredIds) {
        if (cancelRef.current) break;
        await fetchUrl({ id, cancelled: () => false });
        n++;
        setProgress((n / filteredIds.length) * 100);
      }
      handleClose()();
    } else if (downAmt === 'missing') {
      let n = 0;
      for (let id of missingIds) {
        if (cancelRef.current) break;
        await fetchUrl({ id, cancelled: () => false });
        n++;
        setProgress((n / missingIds.length) * 100);
      }
      handleClose()();
    }
  };

  React.useEffect(() => {
    if (isElectron && tokenCtx.state.accessToken && !downloadingRef.current) {
      getNeedyRemoteIds().then((projRemIds) => {
        if (projRemIds.length > 0) {
          setNeedyIds(projRemIds);
          setAlert(true);
        } else cb();
      });
    } else cb();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [offlineProjects, projects, mediafiles]);

  const mb = (bytes: number) =>
    bytes > 0 ? Math.ceil(bytes / 1024 / 1024 + 0.5) : 0;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sizeMb = useMemo(() => mb(downloadSize), [downloadSize]);

  const szOfVal = (proj: string, value: string) => {
    if (value === 'filtered' || value === 'missing')
      return limits.get(proj)?.[value] || 0;
    const total = limits.get(proj)?.total || 0;
    return total > 0 ? total + 580000 : 0;
  };

  const handleChangeAmt = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (downloadingRef.current) return;
    const value = e.target.value;
    setDownAmt(value);
    const size = needyIds.reduce((p, c) => p + szOfVal(c, value), 0);
    setDownloadSize(size);
  };

  return (
    <div>
      {alert && (
        <BigDialog
          title={t.download}
          isOpen={alert}
          onOpen={handleClose(true)}
          bp={BigDialogBp.sm}
          description={
            <Typography sx={{ fontSize: 'small' }}>
              {stringReplace(
                t.downloadDescription
                  .replace(/\{1}/g, organizedBy)
                  .replace(/\{2}/g, organizedByPl)
                  .replace(/\{3}/g, ts.save.toUpperCase())
                  .replace(/\{4}/g, organizedByPl.toUpperCase()),
                '{0}',
                () => (
                  <FilterIcon
                    key={'filterIcon1'}
                    sx={{ color: 'secondary.light', fontSize: 'medium' }}
                  />
                )
              )}
            </Typography>
          }
        >
          <Box>
            <DialogContent>
              {progress > 0 && (
                <Stack
                  sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                  direction="row"
                >
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ flexGrow: 1 }}
                  />
                  <AltButton onClick={handleCancel} sx={{ ml: 1, p: 0 }}>
                    {ts.cancel}
                  </AltButton>
                </Stack>
              )}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{t.projectDetails}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <DataGrid
                    rows={Array.from(needyIds).map((id) => {
                      const project = projects.find((p) => p.id === id);
                      const teamId = related(project, 'organization') as string;
                      const team = organizations.find((o) => o.id === teamId);
                      const { minSec, maxSec, filtered, missing, total } =
                        limits.get(id) || {};
                      return {
                        id: id,
                        team: team?.attributes?.name,
                        name: project?.attributes?.name,
                        minSec: minSec || 0,
                        maxSec: maxSec !== '-1' ? maxSec || 0 : '∞',
                        filtered: mb(filtered || 0),
                        missing: mb(missing || 0),
                        total: mb(total || 0),
                      };
                    })}
                    columns={[
                      { field: 'team', headerName: t.team, width: 150 },
                      { field: 'name', headerName: t.project, width: 150 },
                      {
                        field: 'minSec',
                        headerName: t.min.replace('{0}', organizedBy),
                        width: 110,
                        align: 'center',
                      },
                      {
                        field: 'maxSec',
                        headerName: t.max.replace('{0}', organizedBy),
                        width: 110,
                        align: 'center',
                      },
                      {
                        field: 'filtered',
                        headerName: t.filtered,
                        width: 100,
                        align: 'center',
                      },
                      {
                        field: 'missing',
                        headerName: t.missing,
                        width: 100,
                        align: 'center',
                      },
                      {
                        field: 'total',
                        headerName: t.total,
                        width: 90,
                        align: 'center',
                      },
                    ]}
                  />
                </AccordionDetails>
              </Accordion>
              <Grid container sx={{ pt: 2 }}>
                <Grid
                  item
                  md={6}
                  sx={{ display: 'flex', justifyContent: 'center' }}
                >
                  <FormControl>
                    <FormLabel id="down-radio-buttons-group-label">
                      {t.amount}
                    </FormLabel>
                    <RadioGroup
                      aria-labelledby="down-radio-buttons-group-label"
                      name="radio-buttons-group"
                      value={downAmt}
                      onChange={handleChangeAmt}
                    >
                      <FormControlLabel
                        value="filtered"
                        control={<Radio />}
                        label={t.filteredFiles}
                        disabled={!hasSectionFilter}
                      />
                      <FormControlLabel
                        value="missing"
                        control={<Radio />}
                        label={t.missingFiles}
                      />
                      <FormControlLabel
                        value="project"
                        control={<Radio />}
                        label={t.projects}
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
                <Grid item md={6}>
                  {t.downloadMb
                    .replace('{0}', sizeMb > 0 ? `~${sizeMb}` : '0')
                    .replace(
                      '{1}',
                      sizeMb > 0
                        ? `~${formatTime(sizeMb * 0.367 + 20)}`
                        : '0:00'
                    )
                    .replace(
                      '{2}',
                      sizeMb > 0
                        ? `~${formatTime(sizeMb * 0.42 + 65.3)}`
                        : `0:00`
                    )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <AltButton
                onClick={() => handleClose(true)()}
                disabled={downloading}
              >
                {t.downloadLater}
              </AltButton>
              <PriButton onClick={handleDownload} disabled={downloading}>
                {t.confirm}
              </PriButton>
            </DialogActions>
          </Box>
        </BigDialog>
      )}
      <ProjectDownload open={downloadOpen} projectIds={needyIds} finish={cb} />
    </div>
  );
};

export default ProjectDownloadAlert;
