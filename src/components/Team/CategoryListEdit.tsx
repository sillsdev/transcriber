import * as React from 'react';
import { List, ListItem, IconButton, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  IArtifactCategory,
  findRecord,
  related,
  useArtifactCategory,
} from '../../crud';
import { ActionRow, AltButton, PriButton } from '../StepEditor';
import {
  ArtifactCategory,
  Discussion,
  ICategoryStrings,
  ISharedStrings,
  MediaFile,
} from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { categorySelector, sharedSelector } from '../../selector';
import { useGlobal } from 'reactn';
import { Operation, TransformBuilder } from '@orbit/data';
import { UpdateRecord } from '../../model/baseModel';
import { useSnackBar } from '../../hoc/SnackBar';

interface IProps {
  resource?: boolean;
  discussion?: boolean;
  teamId: string;
  onClose?: () => void;
}

export default function CategoryList({
  resource,
  discussion,
  teamId,
  onClose,
}: IProps) {
  const [categories, setCategories] = React.useState<IArtifactCategory[]>([]);
  const [edited, setEdited] = React.useState<[string, IArtifactCategory][]>([]);
  const [deleted, setDeleted] = React.useState<string[]>([]);
  const [builtIn, setBuiltIn] = React.useState<string[]>([]);
  const [inUse, setInUse] = React.useState<[string, number][]>([]);
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
    const t = new TransformBuilder();
    const ops: Operation[] = [];
    for (const r of recs) {
      if (
        r.category &&
        !(await isDuplicateCategory(
          r.category,
          Boolean(resource),
          Boolean(discussion)
        ))
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
              } as ArtifactCategory,
              user
            )
          );
      } else {
        showMessage(tc.ignoreInvalid.replace('{0}', r.category));
      }
    }
    for (const id of deleted) {
      ops.push(t.removeRecord({ type: 'artifactcategory', id }));
    }
    await memory.update(ops);
    onClose && onClose();
  };

  React.useEffect(() => {
    getArtifactCategorys(Boolean(resource), Boolean(discussion)).then(
      (cats) => {
        setCategories(cats);
        const builtIn: string[] = [];
        cats.forEach((c) => {
          const rec = findRecord(
            memory,
            'artifactcategory',
            c.id
          ) as ArtifactCategory;
          if (!related(rec, 'organization')) builtIn.push(c.id);
        });
        setBuiltIn(builtIn);
        const inUseMap = new Map<string, number>();
        const media = memory.cache.query((q) =>
          q.findRecords('mediafile')
        ) as MediaFile[];
        const discussions = memory.cache.query((q) =>
          q.findRecords('discussion')
        ) as Discussion[];
        cats
          .filter((c) => !builtIn.includes(c.id))
          .forEach((c) => {
            let count = 0;
            if (resource)
              count = media.filter(
                (m) => related(m, 'artifactCategory') === c.id
              ).length;
            if (discussion)
              count = discussions.filter(
                (d) => related(d, 'artifactCategory') === c.id
              ).length;
            inUseMap.set(c.id, count);
          });
        setInUse(Array.from(inUseMap));
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, discussion]);

  const sortCats = (i: IArtifactCategory, j: IArtifactCategory) =>
    i.category <= j.category ? -1 : 1;

  return (
    <>
      <List dense={true}>
        {categories
          .filter((c) => !deleted.includes(c.id))
          .sort(sortCats)
          .map((c) => (
            <ListItem
              key={c.slug}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={handleDelete(c.id)}
                  disabled={builtIn.includes(c.id) || displayCount(c) > 0}
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
                disabled={builtIn.includes(c.id)}
                helperText={
                  builtIn.includes(c.id)
                    ? t.builtIn
                    : displayCount(c) > 0
                    ? t.inUseBy
                        .replace('{0}', `${displayCount(c)}`)
                        .replace('{1}', resource ? t.resources : t.discussions)
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
        <PriButton id="catSave" onClick={handleSave}>
          {ts.save}
        </PriButton>
      </ActionRow>
    </>
  );
}
