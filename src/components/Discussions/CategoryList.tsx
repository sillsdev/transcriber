import { useEffect } from 'react';
import { useGlobal } from 'reactn';
import {
  ArtifactCategory,
  Discussion,
  IArtifactCategoryStrings,
  IState,
} from '../../model';
import localStrings from '../../selector/localize';
import QueryBuilder from '@orbit/data/dist/types/query-builder';
import { connect } from 'react-redux';
import { withData } from '../../mods/react-orbitjs';
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import SelectedIcon from '@mui/icons-material/CheckBoxOutlined';
import NotSelectedIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { related, useDiscussionOrg } from '../../crud';

export interface CatData {
  id: string;
  category: string;
  selected: boolean;
  count: number;
}

interface IStateProps {
  t: IArtifactCategoryStrings;
}
interface IRecordProps {
  discussions: Discussion[];
  artifactCategory: ArtifactCategory[];
}
interface IProps extends IStateProps, IRecordProps {
  catFilter: CatData[];
  onCatFilter: (catData: CatData[]) => void;
}

export function CategoryList(props: IProps) {
  const { catFilter, onCatFilter, discussions, artifactCategory, t } = props;
  const [organization] = useGlobal('organization');
  const discussionOrg = useDiscussionOrg();

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

const mapStateToProps = (catFilter: IState): IStateProps => ({
  t: localStrings(catFilter, { layout: 'artifactCategory' }),
});
const mapRecordsToProps = {
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
  artifactCategory: (q: QueryBuilder) => q.findRecords('artifactcategory'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(CategoryList) as any as any
) as any;
