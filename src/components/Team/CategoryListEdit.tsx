import * as React from 'react';
import {
  List,
  ListItem,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  ArtifactCategoryType,
  IArtifactCategory,
  related,
  useArtifactCategory,
  waitForRemoteId,
} from '../../crud';
import { ActionRow, AltButton, PriButton } from '../StepEditor';
import {
  Discussion,
  ICategoryStrings,
  ISharedStrings,
  MediaFile,
  SharedResource,
} from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { categorySelector, sharedSelector } from '../../selector';
import { useEffect, useGlobal, useMemo, useState } from 'reactn';
import {
  RecordKeyMap,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import { useSnackBar } from '../../hoc/SnackBar';
import { NewArtifactCategory } from '../Sheet/NewArtifactCategory';
import { useBibleMedia } from '../../crud/useBibleMedia';
import CategoryEdit from './CategoryEdit';
import { useOrbitData } from '../../hoc/useOrbitData';

interface IProps {
  type: ArtifactCategoryType;
  teamId: string;
  onClose?: () => void;
}

export default function CategoryListEdit({ type, teamId, onClose }: IProps) {
  const [refresh, setRefresh] = React.useState(0);
  const [offlineOnly] = useGlobal('offlineOnly');
  const [categories, setCategories] = useState<IArtifactCategory[]>([]);
  const [edited, setEdited] = useState<Map<string, IArtifactCategory>>(
    new Map()
  );
  const editRef = React.useRef<Map<string, IArtifactCategory>>(new Map());
  const [deleted, setDeleted] = useState<string[]>([]);
  const [builtIn, setBuiltIn] = useState<IArtifactCategory[]>([]);
  const [inUse, setInUse] = useState<[string, number][]>([]);
  const [memory] = useGlobal('memory');
  const { showMessage } = useSnackBar();
  const [mediaplan, setMediaplan] = useState('');
  const { getBibleMediaPlan } = useBibleMedia();
  const [recording, setRecording] = useState('');
  const media = useOrbitData('mediafile') as MediaFile[];
  const discussions = useOrbitData('discussion') as Discussion[];
  const sharedResources = useOrbitData('sharedresource') as SharedResource[];
  const {
    getArtifactCategorys,
    localizedArtifactCategory,
    addNewArtifactCategory,
    updateArtifactCategory,
  } = useArtifactCategory(teamId);
  const t: ICategoryStrings = useSelector(categorySelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const tc = t;

  useEffect(() => {
    getBibleMediaPlan().then((plan) => {
      setMediaplan(plan.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayValue = (c: IArtifactCategory) => {
    const editMap = new Map<string, IArtifactCategory>(edited);
    return editMap.get(c.id)?.category ?? localizedArtifactCategory(c.category);
  };

  const displayCount = (c: IArtifactCategory) => {
    const value = inUse.find((i) => i[0] === c.id);
    return value ? value[1] : 0;
  };

  //without useCallback edited was always empty
  //even after useCallback edited was always one behind the ref value.
  //so I took it back out and just used the ref
  const handleChange = (c: IArtifactCategory) => {
    editRef.current.set(c.id, { ...c });
    const editMap = new Map<string, IArtifactCategory>(editRef.current);
    setEdited(editMap);
  };

  const handleDelete = (c: IArtifactCategory) => () => {
    setDeleted((deleted) => deleted.concat(c.id));
  };

  const hasDuplicates = async () => {
    const cats = await getArtifactCategorys(type);
    const recs = cats.concat(Array.from(edited.values()));
    const items = new Set<string>(recs.map((r) => r.category));
    if (items.size < recs.length) {
      showMessage(t.duplicate);
      return true;
    }
    return false;
  };

  const canSave = useMemo(
    () => edited.size + deleted.length > 0 && !hasDuplicates(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edited, deleted]
  );

  const handleClose = () => onClose && onClose();

  const handleSave = async () => {
    deleted.forEach((d) => {
      edited.delete(d);
    });
    const recs = Array.from(edited.values());
    if (await hasDuplicates()) return;
    const t = new RecordTransformBuilder();
    const ops: RecordOperation[] = [];
    for (const r of recs) {
      if (!/^\s*$/.test(r.category)) {
        if (r.id === 'newcat') {
          addNewArtifactCategory(r.category, type, r.titleMediaId, r?.color);
        } else {
          updateArtifactCategory(r);
        }
      } else {
        showMessage(tc.ignoreInvalid.replace('{0}', r.category));
      }
    }
    for (const id of deleted) {
      ops.push(t.removeRecord({ type: 'artifactcategory', id }).toOperation());
    }
    await memory.update(ops);
    onClose && onClose();
  };
  const categoryAdded = (newId: string) => {
    if (offlineOnly) setRefresh(refresh + 1);
    else
      waitForRemoteId(
        { type: 'artifactcategory', id: newId },
        memory.keyMap as RecordKeyMap
      ).then(() => {
        setRefresh(refresh + 1);
      });
  };

  React.useEffect(() => {
    getArtifactCategorys(type).then((cats) => {
      setCategories(cats.filter((c) => c.org !== '').sort(sortCats));
      setBuiltIn(cats.filter((c) => c.org === '').sort(sortCats));
      const inUseMap = new Map<string, number>();

      cats.forEach((c) => {
        let count = 0;
        if (type === ArtifactCategoryType.Resource)
          count = media.filter(
            (m) => related(m, 'artifactCategory') === c.id
          ).length;
        else if (type === ArtifactCategoryType.Discussion)
          count = discussions.filter(
            (d) => related(d, 'artifactCategory') === c.id
          ).length;
        else
          count = sharedResources.filter(
            (d) => related(d, 'artifactCategory') === c.id
          ).length;
        inUseMap.set(c.id, count);
      });
      setInUse(Array.from(inUseMap));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, refresh, media, discussions, sharedResources]);

  const sortCats = (i: IArtifactCategory, j: IArtifactCategory) =>
    i.specialuse < j.specialuse
      ? -1
      : i.specialuse > j.specialuse
      ? 1
      : i.category <= j.category
      ? -1
      : 1;

  const onRecording = (c: IArtifactCategory) => (recording: boolean) => {
    //disable all the others
    if (recording) {
      setRecording(c.id);
    } else {
      setRecording('');
    }
  };
  return (
    <>
      <NewArtifactCategory type={type} onAdded={categoryAdded} />
      <List dense={true}>
        {categories
          .filter((c) => !deleted.includes(c.id))
          .map((c) => (
            <ListItem
              key={c.slug}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={handleDelete(c)}
                  disabled={displayCount(c) > 0 || c.specialuse !== ''}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <CategoryEdit
                label={''}
                onChanged={handleChange}
                onDeleted={handleDelete}
                onRecording={onRecording(c)}
                mediaplan={mediaplan}
                teamId={teamId}
                disabled={recording !== '' && c.id !== recording}
                type={type}
                category={editRef.current.get(c.id) ?? c}
              />
            </ListItem>
          ))}
      </List>
      <ActionRow>
        <AltButton id="catCancel" onClick={handleClose}>
          {ts.cancel}
        </AltButton>
        <PriButton id="catSave" onClick={handleSave} disabled={!canSave}>
          {ts.save}
        </PriButton>
      </ActionRow>

      {builtIn.length > 0 && (
        <div>
          <Typography variant="body2">{t.builtIn}</Typography>
          <List dense={true}>
            {builtIn.map((c) => (
              <ListItem key={c.slug}>
                <TextField
                  sx={{ flexGrow: 1 }}
                  variant="outlined"
                  value={displayValue(c)}
                  disabled={true}
                />
              </ListItem>
            ))}
          </List>
        </div>
      )}
    </>
  );
}
