import { Grid, List, ListItem, Typography } from '@mui/material';
import { useLocation, useParams } from 'react-router-dom';
import React from 'react';
import StickyRedirect from '../components/StickyRedirect';
import {
  IState,
  OrganizationD,
  PassageD,
  PlanD,
  ProjectD,
  SectionD,
} from '../model';
import { useOrbitData } from '../hoc/useOrbitData';
import related from '../crud/related';
import CodeNum from '../assets/code-num.json';
import { BurritoOption } from '../burrito/BurritoOption';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../store';
import { useOrgDefaults } from '../crud/useOrgDefaults';
import { BurritoHeader } from '../components/BurritoHeader';

export const burritoBooks = 'burritoBooks';
export const burritoProjects = 'burritoProjects';

export function BurritoBooks() {
  const { pathname } = useLocation();
  const { teamId } = useParams();
  const [view, setView] = React.useState('');
  const [teamProjs, setTeamProjs] = React.useState<ProjectD[]>([]);
  const teams = useOrbitData<OrganizationD[]>('organization');
  const projects = useOrbitData<ProjectD[]>('project');
  const plans = useOrbitData<PlanD[]>('plan');
  const sections = useOrbitData<SectionD[]>('section');
  const passages = useOrbitData<PassageD[]>('passage');
  const [codeNum, setCodeNum] = React.useState<Map<string, number>>(new Map());
  const [books, setBooks] = React.useState<string[]>([]);
  const [checked, setChecked] = React.useState<string[]>([]);
  const lang = useSelector((state: IState) => state.strings.lang);
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const booksLoaded = useSelector((state: IState) => state.books.loaded);
  const dispatch = useDispatch();
  const fetchBooks = (lang: string) => dispatch(actions.fetchBooks(lang));
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();

  const handleSave = () => {
    setOrgDefault(burritoBooks, books, teamId);
    setOrgDefault(burritoProjects, checked, teamId);
    setView(`/burrito/${teamId}`);
  };

  const bookSort = (a: string, b: string) => {
    const aNum = codeNum.get(a);
    const bNum = codeNum.get(b);
    if (aNum && bNum) return aNum - bNum;
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b);
  };

  const bookName = (book: string) =>
    allBookData.find((b) => b.code === book)?.short || book;

  React.useEffect(() => {
    setCodeNum(new Map(CodeNum as [string, number][]));
  }, []);

  React.useEffect(() => {
    if (teamId && teams) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        setTeamProjs(
          projects.filter((p) => related(p, 'organization') === teamId)
        );
        const curProjects = getOrgDefault(burritoProjects, teamId);
        if (curProjects) {
          setChecked(curProjects);
        }
        const curBibles = getOrgDefault(burritoProjects, teamId);
        if (curBibles) {
          setBooks(curBibles);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, teams, projects]);

  React.useEffect(() => {
    const newBooks: Set<string> = new Set();
    teamProjs
      .filter((p) => checked.includes(p.id))
      .forEach((proj) => {
        const planRec = plans.find((p) => related(p, 'project') === proj.id);
        const sectionRecs = sections.filter(
          (s) => related(s, 'plan') === planRec?.id
        );
        const passageRecs = sectionRecs.map((s) =>
          passages.find((p) => related(p, 'section') === s.id)
        );
        let book: string | undefined = undefined;
        passageRecs.forEach((p) => {
          if (p?.attributes?.book) {
            if (book && book !== p.attributes.book) {
              console.warn('multiple books in one project');
            }
            book = p.attributes.book;
            newBooks.add(book);
          }
        });
      });
    setBooks(Array.from(newBooks).sort(bookSort));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, plans, sections, passages, teamProjs]);

  React.useEffect(() => {
    if (!booksLoaded) {
      fetchBooks(lang);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [lang, booksLoaded]);

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <BurritoHeader
      burritoType={'Books'}
      teamId={teamId}
      setView={setView}
      onSave={handleSave}
      saveDisabled={checked.length === 0}
    >
      <Grid container spacing={5} justifyContent="center" sx={{ pt: 3 }}>
        <Grid item>
          <Typography variant="h5">Projects</Typography>
          <BurritoOption
            options={teamProjs.map((p) => ({
              label: p.attributes.name,
              value: p.id,
            }))}
            value={checked}
            onChange={(value) => setChecked(value)}
          />
        </Grid>
        <Grid item>
          <Typography variant="h5">Selected Books</Typography>
          <List dense>
            {books.map((b) => (
              <ListItem key={b}>{bookName(b)}</ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
    </BurritoHeader>
  );
}
