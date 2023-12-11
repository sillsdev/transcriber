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
  findRecord,
  related,
  useArtifactCategory,
} from '../../crud';
import { ActionRow, AltButton, PriButton } from '../StepEditor';
import {
  ArtifactCategory,
  ArtifactCategoryD,
  Discussion,
  ICategoryStrings,
  ISharedStrings,
  MediaFile,
  Section,
} from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { categorySelector, sharedSelector } from '../../selector';
import { useGlobal } from 'reactn';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
import { UpdateRecord } from '../../model/baseModel';
import { useSnackBar } from '../../hoc/SnackBar';
import { NewArtifactCategory } from '../Sheet/NewArtifactCategory';

interface IProps {
  type: ArtifactCategoryType;
  teamId: string;
  onClose?: () => void;
}

export default function CategoryList({ type, teamId, onClose }: IProps) {
  const [categories, setCategories] = React.useState<IArtifactCategory[]>([]);
  const [edited, setEdited] = React.useState<[string, IArtifactCategory][]>([]);
  const [deleted, setDeleted] = React.useState<string[]>([]);
  const [builtIn, setBuiltIn] = React.useState<IArtifactCategory[]>([]);
  const [inUse, setInUse] = React.useState<[string, number][]>([]);
  const [refresh, setRefresh] = React.useState(0);
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { showMessage } = useSnackBar();
  const {
    getArtifactCategorys,
    isDuplicateCategory,
    localizedArtifactCategory,
  } = useArtifactCategory(teamId);
  const t: ICategoryStrings = useSelector(categorySelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const tc = t;

  const displayValue = (c: IArtifactCategory) => {
    const editMap = new Map<string, IArtifactCategory>(edited);
    return editMap.get(c.id)?.category ?? localizedArtifactCategory(c.category);
  };

  const displayCount = (c: IArtifactCategory) => {
    const value = inUse.find((i) => i[0] === c.id);
    return value ? value[1] : 0;
  };

  const handleChange =
    (c: IArtifactCategory) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const editMap = new Map<string, IArtifactCategory>(edited);
      editMap.set(c.id, { ...c, category: e.target.value });
      setEdited(Array.from(editMap));
    };

  const handleDelete = (id: string) => () => {
    setDeleted((deleted) => deleted.concat(id));
  };

  const handleClose = () => onClose && onClose();

  const handleSave = async () => {
    const recs = edited.filter((r) => !deleted.includes(r[0])).map((r) => r[1]);
    const t = new RecordTransformBuilder();
    const ops: RecordOperation[] = [];
    for (const r of recs) {
      if (
        !/^\s*$/.test(r.category) &&
        !(await isDuplicateCategory(r.category, type))
      ) {
        const rec = findRecord(
          memory,
          'artifactcategory',
          r.id
        ) as ArtifactCategory;
        if (rec)
          ops.push(
            ...UpdateRecord(
              t,
              {
                ...rec,
                attributes: { ...rec.attributes, categoryname: r.category },
              } as ArtifactCategoryD,
              user
            )
          );
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
  return (
    <>
      <List dense={true}>
        <NewArtifactCategory type={type} onAdded={categoryAdded} />
        {categories
          .filter((c) => !deleted.includes(c.id))
          .map((c) => (
            <ListItem
              key={c.slug}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={handleDelete(c.id)}
                  disabled={displayCount(c) > 0}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <TextField
                sx={{ flexGrow: 1 }}
                variant="outlined"
                value={displayValue(c)}
                onChange={handleChange(c)}
                helperText={
                  displayCount(c) > 0
                    ? t.inUseBy
                        .replace('{0}', `${displayCount(c)}`)
                        .replace(
                          '{1}',
                          type === ArtifactCategoryType.Resource
                            ? t.resources
                            : type === ArtifactCategoryType.Discussion
                            ? t.discussions
                            : t.notes
                        )
                    : undefined
                }
              />
            </ListItem>
          ))}
      </List>
      <ActionRow>
        <AltButton id="catCancel" onClick={handleClose}>
          {ts.cancel}
        </AltButton>
        <PriButton
          id="catSave"
          onClick={handleSave}
          disabled={edited.length + deleted.length === 0}
        >
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
