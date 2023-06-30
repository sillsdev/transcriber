import React, { useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import { Tabs, Tab, Box } from '@mui/material';
import { OrgWorkflowStep } from '../../model';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  ToolSlug,
  findRecord,
  ArtifactTypeSlug,
  useArtifactType,
} from '../../crud';
import ConsultantCheckReview from './ConsultantCheckReview';
import { ActionRow, AltButton, PriButton } from '../StepEditor';

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
  const { workflow, stepComplete, currentstep } = usePassageDetailContext();
  const [memory] = useGlobal('memory');
  const [checkItems, setCheckItems] = useState<ArtifactTypeSlug[]>([]);
  const [approved, setApproved] = useState<ArtifactTypeSlug[]>([]);
  const [value, setValue] = React.useState(0);
  const { localizedArtifactType } = useArtifactType();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleApproved = (item: ArtifactTypeSlug) => () => {
    if (approved.includes(item)) {
      setApproved(approved.filter((a) => a !== item));
    } else {
      setApproved([...approved, item]);
    }
    if (value + 1 < checkItems.length) {
      setValue(value + 1);
    } else {
      stepComplete(currentstep);
    }
  };

  useEffect(() => {
    if (workflow) {
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
        if (tool === ToolSlug.Record) {
          newItems = [ArtifactTypeSlug.Vernacular, ...newItems];
        } else if (tool === ToolSlug.PhraseBackTranslate) {
          newItems = [ArtifactTypeSlug.PhraseBackTranslation, ...newItems];
        } else if (tool === ToolSlug.WholeBackTranslate) {
          newItems = [ArtifactTypeSlug.WholeBackTranslation, ...newItems];
        } else if (tool === ToolSlug.Community) {
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
      {checkItems.map((item, index) => (
        <TabPanel key={item} value={value} index={index}>
          <ConsultantCheckReview item={item} />
          <ActionRow>
            {approved.includes(item) ? (
              <AltButton onClick={handleApproved(item)}>
                't.furtherReview'
              </AltButton>
            ) : (
              <PriButton onClick={handleApproved(item)}>t.approved</PriButton>
            )}
          </ActionRow>
        </TabPanel>
      ))}
    </Box>
  );
}

export default ConsultantCheck;
