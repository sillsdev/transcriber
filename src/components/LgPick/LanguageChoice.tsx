import React from 'react';
import { ILanguagePickerStrings } from './model';
import { LangTag, ScriptName } from './langPicker/types';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { debounce } from 'lodash';
import { LgPickI18nClean } from './localization/reducers';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      maxWidth: 752,
    },
    demo: {
      backgroundColor: theme.palette.background.paper,
    },
    list: {
      overflowY: 'scroll',
    },
    title: {
      margin: theme.spacing(4, 0, 2),
    },
    firstLine: {
      display: 'flex',
    },
    grow: {
      flexGrow: 1,
    },
  })
);

interface IProps {
  list: number[];
  choose: (tag: LangTag) => void;
  subtag?: boolean;
  secondary?: boolean;
  langTags: LangTag[];
  scriptName: ScriptName;
}

export function LanguageChoice(props: IProps) {
  const { list, langTags, scriptName, secondary, choose, subtag } = props;
  const classes = useStyles();
  const t: ILanguagePickerStrings = LgPickI18nClean.languagePicker;
  const [dense] = React.useState(true);
  const [height, setHeight] = React.useState(window.innerHeight);

  const handleChoose = (tag: LangTag) => () => {
    choose(tag);
  };

  const handleKeydown = (tag: LangTag) => (e: any) => {
    if (e.keyCode === 32 || e.keyCode === 13) {
      choose(tag);
    }
  };

  React.useEffect(() => {
    const handleResize = debounce(() => setHeight(window.innerWidth), 100);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scriptDetail = (tag: LangTag) => {
    const tagParts = tag.tag.split('-');
    return tagParts.length > 1 && tagParts[1].length === 4
      ? t.inScript.replace('$1', scriptName[tagParts[1]])
      : '';
  };

  const detail = (tag: LangTag) => {
    return (
      <>
        <Typography>
          {t.languageOf
            .replace('$1', tag.regionname ? tag.regionname : '')
            .replace('$2', scriptDetail(tag))}
        </Typography>
        <Typography>{tag.names ? tag.names.join(', ') : ''}</Typography>
      </>
    );
  };

  const langElems = (list: number[], langTags: LangTag[]) => {
    return list.map(r => {
      const tag = langTags[r];
      const tagParts = tag.tag.split('-');
      if (!subtag && tagParts.length > 1) {
        if (tagParts[1].length !== 4 || tagParts.length > 2) return <></>;
      }
      return (
        <ListItem
          button
          onClick={handleChoose(tag)}
          onKeyDown={handleKeydown(tag)}
        >
          <ListItemText
            primary={
              <div className={classes.firstLine}>
                <Typography>{tag.name}</Typography>
                <div className={classes.grow}>{'\u00A0'}</div>
                <Typography>{tag.tag}</Typography>
              </div>
            }
            secondary={secondary ? detail(tag) : null}
          />
        </ListItem>
      );
    });
  };

  return (
    <div className={classes.root}>
      <div className={classes.demo}>
        <List
          dense={dense}
          className={classes.list}
          style={{ maxHeight: height - 450 }}
        >
          {langElems(list, langTags)}
        </List>
      </div>
    </div>
  );
}

export default LanguageChoice;
