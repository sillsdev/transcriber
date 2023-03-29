import { useEffect, useState, useContext, useRef } from 'react';
import {
  Resource,
  ISharedStrings,
  IPassageDetailArtifactsStrings,
} from '../../../model';
import {
  ListItemSecondaryAction,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import Checked from '@mui/icons-material/CheckBoxOutlined';
import UnChecked from '@mui/icons-material/CheckBoxOutlineBlank';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import SelectCategory, {
  ScriptureEnum,
} from '../../Workflow/SelectArtifactCategory';
import {
  passageDetailArtifactsSelector,
  sharedSelector,
} from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { ActionRow, PriButton, AltButton } from '../../../control';

interface SecondaryProps {
  id: string;
  idx: number;
  fileName?: string;
  onCategory: (resId: string, catId: string, idx: number) => void;
}
const Secondary = ({ id, idx, fileName, onCategory }: SecondaryProps) => {
  const handleCategory = (catId: string) => {
    onCategory(id, catId, idx);
  };

  return (
    <div>
      {fileName}
      <SelectCategory
        allowNew
        initCategory={''}
        onCategoryChange={handleCategory}
        required={false}
        scripture={ScriptureEnum.highlight}
        resource={true}
      />
    </div>
  );
};

export interface CatMap {
  [resId: string]: string; //map resource id to category id
}

interface IProps {
  onSelect?: (resources: Resource[], catMap: CatMap) => Promise<void>;
  onOpen?: (open: boolean) => void;
}

export const SelectResource = (props: IProps) => {
  const { onSelect, onOpen } = props;
  const [resource, setResouce] = useState<Resource[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [catMap] = useState<CatMap>({});
  const ctx = useContext(PassageDetailContext);
  const { getSharedResources } = ctx.state;
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const selecting = useRef(false);

  const select = (i: number, noToggle?: boolean) => {
    let newSelected = [...selected];
    const idx = selected.indexOf(i);
    if (idx !== -1) {
      if (!noToggle) newSelected.splice(idx, 1);
    } else {
      newSelected.push(i);
    }
    setSelected(newSelected);
  };

  const handleClick = (i: number) => () => {
    select(i);
  };

  const handleSelect = async () => {
    if (!selecting.current) {
      selecting.current = true;
      onSelect &&
        onSelect(
          resource.filter((r, i) => selected.indexOf(i) !== -1),
          catMap
        ).finally(() => {
          selecting.current = false;
          onOpen && onOpen(false);
        });
    }
  };

  const handleCancel = () => {
    onOpen && onOpen(false);
  };

  const handleCategory = (resId: string, catId: string, idx: number) => {
    catMap[resId] = catId;
    select(idx, true);
  };

  useEffect(() => {
    getSharedResources().then((res) => {
      const latest = res.filter((r) => r.attributes?.latest);
      setResouce(latest);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="selectResource">
      <List component="div">
        {resource.map((r, i) => (
          <ListItem key={i} onClick={handleClick(i)} sx={{ m: 4 }}>
            <ListItemIcon>
              {selected.indexOf(i) !== -1 ? (
                <Checked id={`res-${i}-yes`} />
              ) : (
                <UnChecked id={`res-${i}-no`} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={r.attributes?.reference}
              secondary={r.attributes?.originalFile}
            />
            <ListItemSecondaryAction>
              <Secondary id={r.id} idx={i} onCategory={handleCategory} />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <ActionRow>
        <PriButton
          id="res-selected"
          onClick={handleSelect}
          disabled={selected.length === 0 || selecting.current}
        >
          {t.link}
        </PriButton>
        <AltButton id="res-select-cancel" onClick={handleCancel}>
          {ts.cancel}
        </AltButton>
      </ActionRow>
    </div>
  );
};

export default SelectResource;
