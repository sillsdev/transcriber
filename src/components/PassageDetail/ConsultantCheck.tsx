import React, { useEffect, useRef, useState } from 'react';
import { useGetGlobal, useGlobal } from '../../context/GlobalContext';
import {
  Tabs,
  Tab,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  TableBody,
} from '@mui/material';
import { OrgWorkflowStep, Passage, PassageD } from '../../model';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  ToolSlug,
  findRecord,
  ArtifactTypeSlug,
  useArtifactType,
  useOrgDefaults,
  useUpdateRecord,
  orgDefaultConsCheckComp,
} from '../../crud';
import ConsultantCheckReview from './ConsultantCheckReview';
import { ActionRow, AltButton, GrowingDiv, PriButton } from '../../control';
import { shallowEqual, useSelector } from 'react-redux';
import { consultantSelector, sharedSelector } from '../../selector';
import BigDialog from '../../hoc/BigDialog';
import ConsultantCheckCompare from './ConsultantCheckCompare';
import MediaPlayer from '../MediaPlayer';
import { useSnackBar } from '../../hoc/SnackBar';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`category-tabpanel-${index}`}
      aria-labelledby={`category-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `category-tab-${index}`,
    'aria-controls': `category-tabpanel-${index}`,
  };
}

interface IProps {
  width: number;
}

export function ConsultantCheck({ width }: IProps) {
  const {
    workflow,
    setStepComplete,
    gotoNextStep,
    stepComplete,
    currentstep,
    passage,
  } = usePassageDetailContext();
  const [memory] = useGlobal('memory');
  const [checkItems, setCheckItems] = useState<ArtifactTypeSlug[]>([]);
  const [approved, setApproved] = useState<ArtifactTypeSlug[]>([]);
  const [compare, setCompare] = useState<ArtifactTypeSlug[]>([]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = React.useState(0);
  const [mediaId, setMediaId] = useState<string>('');
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  const updateRecord = useUpdateRecord();
  const [, setBusy] = useGlobal('remoteBusy');
  const commitBusy = useRef(false);
  const { showMessage } = useSnackBar();
  const { localizedArtifactType } = useArtifactType();
  const t = useSelector(consultantSelector, shallowEqual);
  const ts = useSelector(sharedSelector, shallowEqual);
  const getGlobal = useGetGlobal();
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleCompareOpen = (val?: boolean) => {
    setOpen(val ?? !open);
  };

  const handleSetCompare = (newCompare: string[]) => {
    setCompare(newCompare as ArtifactTypeSlug[]);
    setOrgDefault(orgDefaultConsCheckComp, newCompare);
    setOpen(false);
  };

  const handlePlayer = (item: string) => {
    setMediaId(item);
  };

  const handleEnded = () => {
    setMediaId('');
  };

  const handleChecked = (item: ArtifactTypeSlug) => async () => {
    if (getGlobal('remoteBusy') || commitBusy.current) {
      showMessage(ts.wait);
      return;
    }
    setBusy(true);
    commitBusy.current = true;
    let newApproved: ArtifactTypeSlug[] = [];
    if (compare.length <= 1) {
      if (approved.includes(item)) {
        newApproved = approved.filter((a) => a !== item);
      } else {
        newApproved = [...approved, item];
        if (value + 1 < checkItems.length) {
          setValue(value + 1);
        }
      }
    } else {
      if (approved.includes(item)) {
        newApproved = approved.filter((a) => !compare.includes(a));
      } else {
        const approvedSet = new Set([...approved, ...compare]);
        newApproved = Array.from(approvedSet);
      }
    }
    setApproved(newApproved);
    try {
      const pasRec = findRecord(memory, 'passage', passage?.id) as
        | PassageD
        | undefined;
      const stepComplete = pasRec?.attributes?.stepComplete
        ? JSON.parse(pasRec?.attributes?.stepComplete)
        : {
            completed: [],
            approved: [],
          };
      const newStepComplete = JSON.stringify({
        ...stepComplete,
        approved: newApproved,
      });
      if (pasRec && newStepComplete !== pasRec?.attributes?.stepComplete) {
        await updateRecord({
          ...pasRec,
          attributes: {
            ...pasRec.attributes,
            stepComplete: newStepComplete,
          },
        });
      }
    } catch (err) {}
    if (newApproved.length >= checkItems.length && !stepComplete(currentstep)) {
      await setStepComplete(currentstep, true);
      gotoNextStep();
    }
    setBusy(false);
    commitBusy.current = false;
  };

  useEffect(() => {
    if (workflow) {
      let newApproved: ArtifactTypeSlug[] = [];
      try {
        const pasRec = findRecord(memory, 'passage', passage?.id) as
          | Passage
          | undefined;
        const result =
          pasRec?.attributes?.stepComplete &&
          JSON.parse(pasRec?.attributes?.stepComplete).approved;
        if (result && Array.isArray(result)) {
          newApproved = result;
        }
      } catch (err) {}
      setApproved(newApproved);
      const newCompare = getOrgDefault(orgDefaultConsCheckComp);
      if (newCompare) {
        setCompare(newCompare as ArtifactTypeSlug[]);
      }
      let newItems: ArtifactTypeSlug[] = [];
      workflow.forEach((wf) => {
        const wfRec = findRecord(memory, 'orgworkflowstep', wf.id) as
          | OrgWorkflowStep
          | undefined;
        let tool = undefined;
        try {
          const toolData = wfRec?.attributes.tool;
          const toolJson = toolData ? JSON.parse(toolData) : {};
          tool = toolJson.tool;
        } catch (err) {}
        if (
          tool === ToolSlug.Record &&
          !newItems.includes(ArtifactTypeSlug.Vernacular)
        ) {
          newItems = [ArtifactTypeSlug.Vernacular, ...newItems];
        } else if (
          tool === ToolSlug.PhraseBackTranslate &&
          !newItems.includes(ArtifactTypeSlug.PhraseBackTranslation)
        ) {
          newItems = [ArtifactTypeSlug.PhraseBackTranslation, ...newItems];
        } else if (
          tool === ToolSlug.WholeBackTranslate &&
          !newItems.includes(ArtifactTypeSlug.WholeBackTranslation)
        ) {
          newItems = [ArtifactTypeSlug.WholeBackTranslation, ...newItems];
        } else if (
          tool === ToolSlug.Community &&
          !newItems.includes(ArtifactTypeSlug.QandA)
        ) {
          newItems = [ArtifactTypeSlug.QandA, ...newItems];
          newItems = [ArtifactTypeSlug.Retell, ...newItems];
        }
      });
      setCheckItems(newItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflow]);

  return (
    <Box sx={{ width: width }}>
      {compare.length <= 1 && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            variant="scrollable"
            value={value}
            onChange={handleChange}
            aria-label="category tabs"
            sx={{ mt: 2 }}
          >
            {checkItems.map((item, index) => (
              <Tab
                key={item}
                label={localizedArtifactType(item)}
                {...a11yProps(index)}
                sx={{
                  py: 0,
                  backgroundColor: approved.includes(item)
                    ? 'grey.A400'
                    : undefined,
                }}
              />
            ))}
          </Tabs>
        </Box>
      )}
      <MediaPlayer
        controls
        srcMediaId={mediaId}
        onEnded={handleEnded}
        requestPlay={true}
        sx={{ pt: 2 }}
      />
      {checkItems.map((item, index) => (
        <TabPanel key={item} value={value} index={index}>
          {compare.length <= 1 ? (
            <ConsultantCheckReview
              item={item}
              onPlayer={handlePlayer}
              playId={mediaId}
            />
          ) : (
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: approved.includes(compare[0])
                      ? 'grey.A400'
                      : undefined,
                  }}
                >
                  {compare.map((item) => (
                    <TableCell key={item}>
                      <Typography>{localizedArtifactType(item)}</Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {compare.map((item) => (
                    <TableCell key={item}>
                      <ConsultantCheckReview
                        item={item}
                        onPlayer={handlePlayer}
                        playId={mediaId}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          )}
          <ActionRow data-testid="action-row">
            {checkItems.length > 1 && (
              <>
                <AltButton
                  data-testid="compare-button"
                  onClick={() => handleCompareOpen(true)}
                >
                  {t.compare}
                </AltButton>
                <GrowingDiv />
              </>
            )}
            {approved.includes(item) ? (
              <AltButton data-testid="alt-button" onClick={handleChecked(item)}>
                {t.furtherReview}
              </AltButton>
            ) : (
              <PriButton data-testid="pri-button" onClick={handleChecked(item)}>
                {t.checked}
              </PriButton>
            )}
          </ActionRow>
        </TabPanel>
      ))}
      <BigDialog
        title={t.compareItems}
        isOpen={open}
        onOpen={() => handleCompareOpen(false)}
      >
        <ConsultantCheckCompare
          compare={compare}
          onChange={handleSetCompare}
          allItems={checkItems}
        />
      </BigDialog>
    </Box>
  );
}

export default ConsultantCheck;
