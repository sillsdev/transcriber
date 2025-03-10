import { useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import {
  ArtifactCategory,
  Discussion,
  IArtifactCategoryStrings,
} from '../../model';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import SelectedIcon from '@mui/icons-material/CheckBoxOutlined';
import NotSelectedIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { related, useDiscussionOrg } from '../../crud';
import { useOrbitData } from '../../hoc/useOrbitData';
import { shallowEqual, useSelector } from 'react-redux';
import { artifactCategorySelector } from '../../selector';

export interface CatData {
  id: string;
  category: string;
  selected: boolean;
  count: number;
}

interface IProps {
  catFilter: CatData[];
  onCatFilter: (catData: CatData[]) => void;
}

export function CategoryList(props: IProps) {
  const { catFilter, onCatFilter } = props;
  const discussions = useOrbitData<Discussion[]>('discussion');
  const artifactCategory = useOrbitData<ArtifactCategory[]>('artifactcategory');
  const [organization] = useGlobal('organization');
  const discussionOrg = useDiscussionOrg();
  const t: IArtifactCategoryStrings = useSelector(
    artifactCategorySelector,
    shallowEqual
  );

  const handleToggle = (id: string) => () => {
    onCatFilter(
      catFilter.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d))
    );
  };

  const getCatName = (slug: string) => {
    return t.getString(slug) || slug;
  };

  interface CatCount {
    [key: string]: number;
  }

  useEffect(() => {
    if (artifactCategory.length !== 0) {
      const catCount: CatCount = {};
      discussions
        .filter((d) => discussionOrg(d) === organization)
        .forEach((d) => {
          const cat = related(d, 'artifactCategory');
          if (catCount.hasOwnProperty(cat)) {
            catCount[cat] = catCount[cat] + 1;
          } else {
            catCount[cat] = 1;
          }
        });
      const catData: CatData[] = Object.keys(catCount).map((id) => {
        const category =
          artifactCategory.find((c) => c.id === id)?.attributes?.categoryname ||
          t.uncategorized;
        return {
          id: id === 'null' ? null : id,
          category,
          selected: false,
          count: catCount[id],
        } as CatData;
      });
      onCatFilter(catData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussions, artifactCategory, organization]);

  return (
    <List>
      {catFilter
        .sort((i, j) => (i.category <= j.category ? -1 : 1))
        .sort((i, j) => (!i.id ? 1 : 0) - (!j.id ? 1 : 0))
        .map((d) => {
          return (
            <ListItem button onClick={handleToggle(d.id)}>
              <ListItemIcon>
                {d.selected ? <SelectedIcon /> : <NotSelectedIcon />}
              </ListItemIcon>
              <ListItemText
                primary={`${getCatName(d.category)} (${d.count})`}
              />
            </ListItem>
          );
        })}
    </List>
  );
}

export default CategoryList;
