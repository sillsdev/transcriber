import { ChangeEvent, useEffect, useRef, useState } from 'react';
import path from 'path-browserify';
import { useLocation, useParams } from 'react-router-dom';
import {
  Box,
  FormControl,
  FormLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  TextField,
  Typography,
} from '@mui/material';
import { TextareaAutosize } from '../control/CommentBox';
import AppHead from '../components/App/AppHead';
import { TeamProvider } from '../context/TeamContext';
import StickyRedirect from '../components/StickyRedirect';
import { AltButton, GrowingSpacer, PriButton } from '../control';
import {
  BibleD,
  IState,
  MediaFileD,
  OptionType,
  OrganizationD,
  PassageD,
  PlanD,
  ProjectD,
  SectionD,
  SharedResourceD,
  UserD,
} from '../model';
import { useOrbitData } from '../hoc/useOrbitData';
import related from '../crud/related';
import { BurritoOption } from '../burrito/BurritoOption';
import CodeNum from '../assets/code-num.json';
import audioTranslation from '../assets/audioTranslation.json';
import { useSnackBar } from '../hoc/SnackBar';
import {
  cleanFileName,
  dataPath,
  getSegments,
  getSortedRegions,
  NamedRegions,
  pad2,
  PathType,
  removeExtension,
} from '../utils';
import {
  ArtifactTypeSlug,
  parseRef,
  sectionDescription,
  useArtifactType,
  useFetchUrlNow,
  VernacularTag,
} from '../crud';
import { pad3 } from '../utils/pad3';
import { passageTypeFromRef } from '../control/RefRender';
import { PassageTypeEnum } from '../model/passageType';
import { useGlobal } from '../context/GlobalContext';
import { useSelector } from 'react-redux';
import {
  AlignmentBuilder,
  AlignmentRecord,
} from '../burrito/data/alignmentBuilder';
const ipc = (window as any)?.electron;
const version = require('../../package.json').version;

interface Ingredients {
  [filePath: string]: {
    checksum?: {
      [algorithm: string]: string;
    };
    mimeType: string;
    size: number;
    scope: {
      [book: string]: string[];
    };
    role?: string[];
  };
}

interface Scopes {
  [book: string]: string[];
}

interface BookNames {
  [book: string]: {
    abbr: {
      [lang: string]: string;
    };
    short: {
      [lang: string]: string;
    };
    long: {
      [lang: string]: string;
    };
  };
}

interface Formats {
  [format: string]: {
    compression: string;
    trackConfiguration: string;
    bitRate?: number;
    bitDepth?: number;
    samplingRate?: number;
  };
}

interface MetaData {
  format: string;
  meta: {
    version: string;
    category: string;
    generator: {
      softwareName: string;
      softwareVersion: string;
      userName: string;
    };
    defaultLocale: string;
    dateCreated: string;
    comments: string[];
  };
  idAuthorities: {
    [abbr: string]: {
      id: string; // url
      name: {
        [lang: string]: string;
      };
    };
  };
  identification: {
    primary: {
      // from idAuthorities
      [abbr: string]: {
        // numberic code of publication in database
        [remoteId: string]: {
          revision: string;
          timestamp: string;
        };
      };
    };
    name: {
      [lang: string]: string;
    };
    description: {
      [lang: string]: string;
    };
    abbreviation: {
      [lang: string]: string;
    };
  };
  languages: {
    tag: string;
    name: {
      [lang: string]: string;
    };
  }[];
  type: {
    flavorType: {
      name: string;
      flavor: {
        name: string;
        performance: string[];
        formats: Formats;
      };
      currentScope: Scopes;
    };
  };
  confidential: boolean;
  agencies: {
    id: string;
    roles: string[];
    url: string;
    name: {
      [lang: string]: string;
    };
    abbr: {
      [lang: string]: string;
    };
  }[];
  targetAreas: {
    code: string;
    name: {
      [lang: string]: string;
    };
  }[];
  localizedNames: BookNames;
  ingredients: Ingredients;
  copyright: {
    shortStatements: {
      statement: string;
      mimetype: string;
      lang: string;
    }[];
  };
}

export const BurritoScreen = () => {
  const { pathname } = useLocation();
  const { teamId } = useParams();
  const teams = useOrbitData<OrganizationD[]>('organization');
  const [curTeam, setCurTeam] = useState<OrganizationD>();
  const teamBibles = useOrbitData<OrganizationD[]>('organizationbible');
  const bibles = useOrbitData<BibleD[]>('bible');
  const [curBible, setCurBible] = useState<BibleD>();
  const projects = useOrbitData<ProjectD[]>('project');
  const [teamProjs, setTeamProjs] = useState<ProjectD[]>([]);
  const plans = useOrbitData<PlanD[]>('plan');
  const sections = useOrbitData<SectionD[]>('section');
  const passages = useOrbitData<PassageD[]>('passage');
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const sharedResources = useOrbitData<SharedResourceD[]>('sharedresource');
  const users = useOrbitData<UserD[]>('user');
  const [user] = useGlobal('user');
  const [languages, setLanguages] = useState<string[]>([]);
  const [books, setBooks] = useState<string[]>([]);
  const [bkSecs, setBkSecs] = useState<[string, SectionD[]][]>([]);
  const [view, setView] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [codeNum, setCodeNum] = useState<Map<string, number>>(new Map());
  const [versions, setVersions] = useState<number>(1);
  const [comment, setComment] = useState<string>('');
  const { getArtifactTypes, localizedArtifactTypeFromId } =
    useArtifactType(teamId);
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([]);
  const allBookData = useSelector((state: IState) => state.books.bookData);
  const [bookProgress, setBookProgress] = useState<number>(0);
  const [chapterProgress, setChapterProgress] = useState<number>(0);
  const cancelRef = useRef(false);
  const { showMessage } = useSnackBar();
  const fetchUrl = useFetchUrlNow();

  useEffect(() => {
    setCodeNum(new Map(CodeNum as [string, number][]));
  }, []);

  useEffect(() => {
    if (teamId && teams) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        setCurTeam(team);

        // get Bible Info
        const teamBibleRec = teamBibles.find(
          (t) => related(t, 'organization') === teamId
        );
        const bibleId = related(teamBibleRec, 'bible');
        const bible = bibles.find((b) => b.id === bibleId);
        if (bible) {
          setCurBible(bible);
        }

        // get Project Info
        setTeamProjs(
          projects.filter((p) => related(p, 'organization') === teamId)
        );
      }

      // get Artifact Types
      const limitedTypes = [
        ArtifactTypeSlug.WholeBackTranslation,
        ArtifactTypeSlug.PhraseBackTranslation,
        ArtifactTypeSlug.Retell,
        ArtifactTypeSlug.QandA,
        ArtifactTypeSlug.Comment,
        ArtifactTypeSlug.Resource,
        ArtifactTypeSlug.SharedResource,
        ArtifactTypeSlug.ProjectResource,
        ArtifactTypeSlug.IntellectualProperty,
        ArtifactTypeSlug.KeyTerm,
        ArtifactTypeSlug.Title,
        ArtifactTypeSlug.Graphic,
      ];
      const typeOptions = getArtifactTypes(limitedTypes).map((t) => ({
        value: t.id || '',
        label: localizedArtifactTypeFromId(t.id || ''),
      }));
      setTypeOptions(typeOptions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, teams, teamBibles, bibles, projects]);

  const bookSort = (a: string, b: string) => {
    const aNum = codeNum.get(a);
    const bNum = codeNum.get(b);
    if (aNum && bNum) return aNum - bNum;
    if (aNum) return -1;
    if (bNum) return 1;
    return a.localeCompare(b);
  };

  useEffect(() => {
    const newBooks: Set<string> = new Set();
    const bookSections: Map<string, SectionD[]> = new Map();
    const langs: Set<string> = new Set();
    teamProjs
      .filter((p) => checked.includes(p.id))
      .forEach((proj) => {
        langs.add(
          `${proj.attributes.language}|${proj.attributes.languageName}`
        );
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
        if (book) {
          if (!bookSections.has(book)) {
            bookSections.set(book, [...sectionRecs]);
          } else {
            bookSections.set(
              book,
              (bookSections.get(book) ?? []).concat(sectionRecs)
            );
          }
        }
      });
    setBooks(Array.from(newBooks).sort(bookSort));
    setBkSecs(Array.from(bookSections));
    setLanguages(Array.from(langs).sort());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, plans, sections, passages, teamProjs]);

  const timeFmt = (t: number) => {
    const val = parseFloat(t.toFixed(3));
    const sec = val - Math.floor(val / 60) * 60;
    let min = Math.floor(val / 60);
    min = min - Math.floor(min / 60) * 60;
    let hour = Math.floor(min / 60);
    hour = hour - Math.floor(hour / 24) * 24;
    return `${pad3(hour)}:${pad2(min)}:${('0' + sec.toFixed(3)).slice(-6)}`;
  };

  const myName = (name: string) =>
    path.join(
      PathType.BURRITO,
      curBible?.attributes?.bibleId || teamId || '',
      name
    );

  const sectionSort = (a: SectionD, b: SectionD) =>
    a.attributes.sequencenum - b.attributes.sequencenum;

  const handleCreate = async () => {
    if (books.length <= 0) {
      showMessage('Please select at least one project');
      return;
    }
    cancelRef.current = false;
    const userRec = users.find((u) => u.id === user);

    // create the metadata file
    const metaData = { ...audioTranslation } as MetaData;
    metaData.meta.generator.userName = userRec?.attributes?.name || '';
    metaData.meta.generator.softwareVersion = version;
    metaData.identification.name['en'] =
      curBible?.attributes?.bibleName ||
      curTeam?.attributes?.name ||
      `${curTeam?.keys?.remoteId || curTeam?.id} Burrito`;
    metaData.languages = languages.map((l) => {
      const [lang, name] = l.split('|');
      return { tag: lang, name: { en: name } };
    });
    if (curBible?.attributes?.description) {
      metaData.identification.description['en'] =
        curBible?.attributes?.description;
    }
    if (curBible?.attributes?.bibleId) {
      metaData.identification.abbreviation['en'] =
        curBible?.attributes?.bibleId;
    }
    if (comment) {
      metaData.meta.comments = comment
        .split('\n')
        .map((c) => c.trim())
        .filter((c) => c !== '');
    }
    metaData.meta.dateCreated = new Date().toISOString();

    // setup data structures to capture metadata from content
    const scopes: Scopes = {};
    const compressions = new Set<string>();
    const ingredients: Ingredients = {};

    // create the metadata file
    const metaName = await dataPath(myName('metadata.json'), PathType.BURRITO);
    const preLen = metaName.indexOf('metadata.json');
    await ipc?.createFolder(path.dirname(metaName));
    await ipc?.write(metaName, JSON.stringify(metaData, null, 2));

    // bookSections combines all the projects for a team and sorts the sections by what book they reference
    const bookSections = new Map<string, SectionD[]>(bkSecs);
    for (const book of books) {
      if (cancelRef.current) break;
      if (books.length > 1) {
        const bookn = books.indexOf(book) + 1;
        setBookProgress((bookn * 100) / books.length);
      }

      // create the book folder
      const bookFolder = pad2(codeNum.get(book) ?? 99) + book;
      const bookPath = await dataPath(myName(bookFolder), PathType.BURRITO);
      await ipc?.createFolder(bookPath);
      const sections = bookSections.get(book)?.sort(sectionSort);

      // create the usfm file
      const usfmPath = path.join(bookPath, `${bookFolder}.usfm`);
      const usfm: string[] = [];
      usfm.push(`\\id ${book}`);

      // create alignment file
      const alignment = new AlignmentBuilder()
        .withAlignmentMeta({
          creator: `Audio Project Manager ${version}`,
          date: new Date().toISOString(),
        })
        .withRoles('timecode', 'text-reference');

      let chapter = 0;
      let chapterTag = 0;
      let chapterPath = '';

      // track chapters created for scope in metadata
      const chapters = new Set<string>();
      for (const section of sections || []) {
        if (cancelRef.current) break;
        const chaptern = (sections?.indexOf(section) || 0) + 1;
        setChapterProgress((chaptern * 100) / (sections || []).length);

        // compute the section header for the usfm file
        const secType = passageTypeFromRef(section.attributes.state);
        const secHead =
          secType === PassageTypeEnum.BOOK
            ? `\\mt1 ${section.attributes.name}`
            : secType === PassageTypeEnum.ALTBOOK
            ? `\\mt2 ${section.attributes.name}`
            : secType === PassageTypeEnum.MOVEMENT
            ? `\\ms ${sectionDescription(section).trim()}`
            : `\\s ${sectionDescription(section).trim()}`;
        usfm.push(secHead);

        // notes before passages are introductions
        let noteMarker = `\\is`;

        // get the passages files for the plan sorted by sequence number
        const planMedia = mediafiles.filter(
          (m) => related(section, 'plan') === related(m, 'plan')
        );
        const passageRecs = passages
          .filter((p) => related(p, 'section') === section.id)
          .sort((a, b) => a.attributes.sequencenum - b.attributes.sequencenum);
        for (const p of passageRecs) {
          // get additional passage info
          const passageType = passageTypeFromRef(p.attributes.reference, false);
          let resRec = sharedResources.find(
            (r) => related(r, 'passage') === p.id
          );

          // parse the passage reference
          parseRef(p);
          let { startChapter, startVerse } = p.attributes;
          // content before first passage with a chapter number is in chapter 1
          if (!startChapter && chapter === 0) startChapter = 1;
          if (passageType === PassageTypeEnum.CHAPTERNUMBER) {
            startChapter = parseInt(p.attributes.reference.split(' ')[1]);
          }

          // new chapter number create a new chapter folder and usfm chapter header if necessary
          if (startChapter && startChapter !== chapter) {
            chapter = startChapter;
            chapters.add(chapter.toString());
            chapterPath = path.join(bookPath, pad3(chapter));
            await ipc?.createFolder(chapterPath);
          }

          // create the passage marker for the usfm file
          let passCont = '';
          if (passageType === PassageTypeEnum.CHAPTERNUMBER) {
            const val = parseInt(p.attributes.reference.split(' ')[1]);
            if (val !== chapterTag) passCont = `\\c ${val}`;
            chapterTag = val;
          } else if (chapterTag !== chapter && noteMarker !== '\\is') {
            passCont = `\\c ${chapter}`;
            chapterTag = chapter;
          }
          if (passageType === PassageTypeEnum.NOTE) {
            const newCont = `${noteMarker} ${resRec?.attributes.title || ''}`;
            if (passCont) passCont += ` ${newCont}`;
            else passCont = newCont;
          } else if (passageType === PassageTypeEnum.PASSAGE && startVerse) {
            const newCont = `\\p`;
            if (passCont) passCont += ` ${newCont}`;
            else passCont = newCont;
            // notes after passages are footnotes
            noteMarker = `\\f \\fk`;
          }

          // get the media files for the passage
          const media = planMedia.filter((m) => related(m, 'passage') === p.id);

          // get the vernacular media files for the passage and sort them by descending version number
          const vernMedia = media
            .filter(
              (m) =>
                related(m, 'artifactType') === VernacularTag ||
                !related(m, 'artifactType')
            )
            .sort(
              (a, b) => b.attributes.versionNumber - a.attributes.versionNumber
            );
          for (let i = 0; i < versions; i++) {
            if (i >= vernMedia.length) break;
            const attr = vernMedia[i].attributes;

            // get the "compression" for the metadata file
            const ext = removeExtension(attr.originalFile).ext?.toLowerCase();
            compressions.add(ext);

            // get the transcription for the usfm file
            if (i === 0 && attr?.transcription) {
              if (passageType === PassageTypeEnum.NOTE) {
                if (attr.transcription.indexOf('\\') === -1) {
                  passCont += ` \\ip`;
                }
              } else if (attr.transcription.indexOf('\\v') === -1) {
                passCont += ` \\v ${p.attributes.reference}`;
              }
              passCont += ` ${attr.transcription}`;
            }

            // download the media file if necessary
            const mediaUrl = attr.audioUrl;
            const local = { localname: '' };
            await dataPath(mediaUrl, PathType.MEDIA, local);
            const mediaName = local.localname;
            if (!(await ipc?.exists(mediaName))) {
              const id = vernMedia[i].keys?.remoteId || vernMedia[i].id;
              await fetchUrl({ id, cancelled: () => false });
              if (!(await ipc?.exists(mediaName))) {
                showMessage(`Failed to download ${mediaUrl}`);
                continue;
              }
            }

            // create the destination file name and copy the media file
            const destName = `${
              curBible?.attributes?.bibleId || teamId || ''
            }-${book}-${cleanFileName(p.attributes.reference)}v${
              attr.versionNumber
            }${path.extname(attr.originalFile)}`;
            const destPath = path.join(chapterPath, destName);
            const docid = destPath.substring(preLen);
            await ipc?.copyFile(mediaName, destPath);

            // add the media file to the metadata file
            ingredients[docid] = {
              checksum: { md5: await ipc?.md5File(destPath) },
              mimeType: attr.contentType,
              size: attr.filesize,
              scope: { [book]: [p.attributes.reference] },
            };

            // get the verses for the timing file
            const verses = getSortedRegions(
              getSegments(NamedRegions.Verse, attr.segments)
            );
            const recs: AlignmentRecord[] = [];
            verses.forEach((v) => {
              recs.push({
                references: [
                  [`${timeFmt(v.start)} --> ${timeFmt(v.end)}`],
                  [`${book} ${v.label}`],
                ],
              } as AlignmentRecord);
            });
            if (recs.length > 0) {
              const docs = [
                { scheme: 'vtt-timecode', docid },
                { scheme: 'u23003' },
              ];
              alignment.withGroup(docs, recs);
            }
          }

          // add the passage marker to the usfm file if necessary
          if (passageType === PassageTypeEnum.PASSAGE) {
            if (passCont.indexOf('\\v') === -1)
              passCont += ` \\v ${p.attributes.reference}`;
          } else if (
            passageType === PassageTypeEnum.NOTE &&
            noteMarker !== '\\is'
          ) {
            if (passCont.indexOf('\\ft') === -1) passCont += ` \\ft `;
            passCont += ` \\f*`;
          }
          if (passCont) usfm.push(passCont);
        }
      }

      // write the usfm file
      const usfmContent = usfm.join('\n');
      ipc?.write(usfmPath, usfmContent);

      // add the usfm file to the metadata file
      ingredients[usfmPath.substring(preLen)] = {
        checksum: { md5: await ipc?.md5File(usfmPath) },
        mimeType: 'text/x-usfm',
        size: usfmContent.length,
        scope: { [book]: Array.from(chapters) },
      };

      // create the timing file
      const timingName = removeExtension(usfmPath).name + '-timing.json';
      const timingContent = JSON.stringify(alignment.build(), null, 2);
      await ipc?.write(timingName, timingContent);
      ingredients[timingName.substring(preLen)] = {
        checksum: { md5: await ipc?.md5File(timingName) },
        mimeType: 'application/json',
        size: timingContent.length,
        scope: { [book]: Array.from(chapters) },
        role: ['timing'],
      };

      // update the scope in the metadata file
      if (!scopes.hasOwnProperty(book)) {
        scopes[book] = Array.from(chapters);
      } else {
        const newChapters = scopes[book]?.concat(Array.from(chapters)) || [];
        scopes[book] = newChapters;
      }
    }
    metaData.type.flavorType.currentScope = scopes;

    // add the media files to the metadata file
    metaData.ingredients = ingredients;

    // add the formats to the metadata file
    const formats: Formats = {};
    let formatn = 0;
    Array.from(compressions).forEach((c) => {
      formats[`format${++formatn}`] = {
        compression: c,
        trackConfiguration: 'mono',
      };
    });
    metaData.type.flavorType.flavor.formats = formats;

    // add the localized book names to the metadata file
    const bookNames: BookNames = {};
    for (const book of books) {
      const data = allBookData.find((b) => b.code === book);
      bookNames[`book-${book}`] = {
        abbr: { en: data?.abbr || book },
        short: { en: data?.short || book },
        long: { en: data?.long || book },
      };
    }
    metaData.localizedNames = bookNames;

    // write the metadata file
    await ipc?.write(metaName, JSON.stringify(metaData, null, 2));
  };

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <AppHead />
      <TeamProvider>
        <Box id="BurritoScreen" sx={{ display: 'flex', paddingTop: '80px' }}>
          <Grid container alignItems="center">
            <AltButton onClick={() => setView('/team')}>Teams</AltButton>
            <GrowingSpacer />
            <Typography>{`${curTeam?.attributes?.name} Burrito Screen`}</Typography>
            <GrowingSpacer />
            <Grid container direction="column" alignItems="center">
              {curBible?.attributes?.bibleId && (
                <Grid item>
                  <Typography>{`${curBible?.attributes?.bibleId}: ${curBible?.attributes?.bibleName}`}</Typography>
                </Grid>
              )}
              {curBible?.attributes?.description && (
                <Grid item>
                  <Typography>{`${curBible?.attributes?.description}`}</Typography>
                </Grid>
              )}
              <Grid
                container
                direction="row"
                justifyContent="center"
                spacing={2}
                sx={{ my: 1 }}
              >
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
                  <Typography variant="h5">Books</Typography>
                  <List dense>
                    {books.map((b) => (
                      <ListItem key={b}>{b}</ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item>
                  <Typography variant="h5">Supporting Audio</Typography>
                  <BurritoOption
                    options={typeOptions.sort((a, b) =>
                      a.label.localeCompare(b.label)
                    )}
                    value={types}
                    onChange={(value) => setTypes(value)}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    id="versions"
                    label="Number of Versions"
                    variant="standard"
                    value={versions || 1}
                    onChange={(e) => setVersions(parseInt(e.target.value))}
                  />
                </Grid>
              </Grid>
              <Grid item>
                <FormControl component="fieldset" sx={{ width: 'inherit' }}>
                  <FormLabel component="legend">Comment</FormLabel>
                  <TextareaAutosize
                    id="comment"
                    aria-label="Comment"
                    value={comment}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setComment(e.target.value)
                    }
                  />
                </FormControl>
              </Grid>
              <Grid
                container
                direction="row"
                justifyContent="center"
                spacing={2}
                alignItems={'center'}
              >
                <Grid item md={9}>
                  {bookProgress !== 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={bookProgress}
                      sx={{ m: 1 }}
                    />
                  )}
                  {chapterProgress !== 0 && (
                    <LinearProgress
                      variant="determinate"
                      value={chapterProgress}
                      sx={{ m: 1 }}
                    />
                  )}
                </Grid>
                <Grid
                  item
                  md={3}
                  sx={{ display: 'flex', justifyContent: 'flex-end' }}
                >
                  {chapterProgress + bookProgress !== 0 && (
                    <AltButton
                      onClick={() => {
                        cancelRef.current = true;
                        setBookProgress(0);
                        setChapterProgress(0);
                      }}
                    >
                      Cancel
                    </AltButton>
                  )}
                </Grid>
              </Grid>
              <Grid item>
                <PriButton
                  onClick={handleCreate}
                  disabled={chapterProgress + bookProgress !== 0}
                >
                  Create
                </PriButton>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </TeamProvider>
    </Box>
  );
};

export default BurritoScreen;
