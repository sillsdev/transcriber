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
} from '../../crud';
import { ActionRow, AltButton, PriButton } from '../StepEditor';
import {
  Discussion,
  ICategoryStrings,
  ISharedStrings,
  MediaFile,
  Section,
} from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { categorySelector, sharedSelector } from '../../selector';
import { useEffect, useGlobal, useMemo, useState } from 'reactn';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
import { useSnackBar } from '../../hoc/SnackBar';
import { NewArtifactCategory } from '../Sheet/NewArtifactCategory';
import { useBibleMedia } from '../../crud/useBibleMedia';
import CategoryEdit from './CategoryEdit';

interface IProps {
  type: ArtifactCategoryType;
  teamId: string;
  onClose?: () => void;
}

export default function CategoryListEdit({ type, teamId, onClose }: IProps) {
  const [refresh, setRefresh] = React.useState(0);
  const [categories, setCategories] = useState<IArtifactCategory[]>([]);
  const [edited, setEdited] = useState<[string, IArtifactCategory][]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [builtIn, setBuiltIn] = useState<IArtifactCategory[]>([]);
  const [inUse, setInUse] = useState<[string, number][]>([]);
  const [memory] = useGlobal('memory');
  const { showMessage } = useSnackBar();
  const [mediaplan, setMediaplan] = useState('');
  const { getBibleMediaPlan } = useBibleMedia();
  const [recording, setRecording] = useState('');
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

  const handleChange = (c: IArtifactCategory) => {
    const editMap = new Map<string, IArtifactCategory>(edited);
    editMap.set(c.id, { ...c });
    setEdited(Array.from(editMap));
  };

  const handleDelete = (c: IArtifactCategory) => () => {
    setDeleted((deleted) => deleted.concat(c.id));
  };
  const canSave = useMemo(
    () => edited.length + deleted.length > 0,
    [edited, deleted]
  );

  const handleClose = () => onClose && onClose();

  const handleSave = async () => {
    const recs = edited.filter((r) => !deleted.includes(r[0])).map((r) => r[1]);
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
    setRefresh(refresh + 1);
  };

  React.useEffect(() => {
    getArtifactCategorys(type).then((cats) => {
      setCategories(cats.filter((c) => c.org !== '').sort(sortCats));
      setBuiltIn(cats.filter((c) => c.org === '').sort(sortCats));
      const inUseMap = new Map<string, number>();
      const media = memory.cache.query((q) =>
        q.findRecords('mediafile')
      ) as MediaFile[];
      const discussions = memory.cache.query((q) =>
        q.findRecords('discussion')
      ) as Discussion[];
      const sections = (
        memory.cache.query((q) => q.findRecords('section')) as Section[]
      ).filter((s) => Boolean(related(s, 'category')));
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
          count = sections.filter(
            (d) => related(d, 'artifactCategory') === c.id
          ).length;
        inUseMap.set(c.id, count);
      });
      setInUse(Array.from(inUseMap));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, refresh]);

  const sortCats = (i: IArtifactCategory, j: IArtifactCategory) =>
    i.category <= j.category ? -1 : 1;

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
                  disabled={displayCount(c) > 0}
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
                category={c}
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
