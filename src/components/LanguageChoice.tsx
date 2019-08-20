import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { AppState } from '../store';
import { LangTag, ScriptName } from '../store/langPicker/types';
import { IRanked } from '../store/langPicker/types';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import { List, ListItem, ListItemText, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      maxWidth: 752,
    },
    demo: {
      backgroundColor: theme.palette.background.paper,
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
  const { list, langTags, scriptName, secondary, choose, subtag } = props;
  const classes = useStyles();
  const [dense] = React.useState(true);

  const handleChoose = (tag: LangTag) => () => {
    choose(tag);
  };

  const handleKeydown = (tag: LangTag) => (e: any) => {
    if (e.keyCode === 32 || e.keyCode === 13) {
      choose(tag);
    }
  };

  const scriptDetail = (tag: LangTag) => {
    const tagParts = tag.tag.split('-');
    return tagParts.length > 1 && tagParts[1].length === 4
      ? '\u00A0in the\u00A0' + scriptName[tagParts[1]] + '\u00A0script'
      : '';
  };

  const detail = (tag: LangTag) => {
    return (
      <>
        <Typography>
          A Language of {tag.regionname}
          {scriptDetail(tag)}.
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
        <List dense={dense}>{langElems(list, langTags)}</List>
      </div>
    </div>
  );
}

const mapStateToProps = (state: AppState): StateProps => ({
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
