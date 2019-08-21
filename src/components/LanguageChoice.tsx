import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { IState, ILanguagePickerStrings } from '../model';
import localStrings from '../selector/localize';
import { LangTag, ScriptName } from '../store/langPicker/types';
import { IRanked } from '../store/langPicker/types';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { debounce } from 'lodash';

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

interface StateProps {
  t: ILanguagePickerStrings;
  langTags: LangTag[];
  scriptName: ScriptName;
}

interface DispatchProps {}

interface IProps extends StateProps, DispatchProps {
  list: IRanked[];
  choose: (tag: LangTag) => void;
  subtag?: boolean;
  secondary?: boolean;
}

export function LanguageChoice(props: IProps) {
  const { t, list, langTags, scriptName, secondary, choose, subtag } = props;
  const classes = useStyles();
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

  const langElems = (list: IRanked[], langTags: LangTag[]) => {
    return list.map(r => {
      const tag = langTags[r.index];
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

const mapStateToProps = (state: IState): StateProps => ({
  t: localStrings(state, { layout: 'languagePicker' }),
  langTags: state.langTag.langTags,
  scriptName: state.langTag.scriptNames,
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LanguageChoice);
