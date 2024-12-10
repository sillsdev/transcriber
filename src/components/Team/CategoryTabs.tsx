import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import CategoryListEdit from './CategoryListEdit';
import { shallowEqual, useSelector } from 'react-redux';
import { categorySelector } from '../../selector';
import { ICategoryStrings } from '../../model';
import { ArtifactCategoryType } from '../../crud';
import { useGlobal } from '../../context/GlobalContext';

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
  teamId: string;
  flat: boolean;
  onClose?: () => void;
}

export default function CategoryTabs({ teamId, flat, onClose }: IProps) {
  const [value, setValue] = React.useState(0);
  const [offline] = useGlobal('offline');
  const t: ICategoryStrings = useSelector(categorySelector, shallowEqual);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="category tabs">
          <Tab label={t.resource} {...a11yProps(0)} />
          <Tab label={t.discussion} {...a11yProps(1)} />
          {!flat && !offline && <Tab label={t.note} {...a11yProps(2)} />}
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <CategoryListEdit
          type={ArtifactCategoryType.Resource}
          teamId={teamId}
          onClose={onClose}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CategoryListEdit
          type={ArtifactCategoryType.Discussion}
          teamId={teamId}
          onClose={onClose}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <CategoryListEdit
          type={ArtifactCategoryType.Note}
          teamId={teamId}
          onClose={onClose}
        />
      </TabPanel>
    </Box>
  );
}
