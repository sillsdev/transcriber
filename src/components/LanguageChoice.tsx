import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { AppState } from "../store";
import { LangTag } from "../store/langPicker/types";
import { IRanked } from "../store/langPicker/types";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@material-ui/core";

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
  })
);

interface StateProps {
  langTags: LangTag[];
}

interface DispatchProps {}

interface IProps extends StateProps, DispatchProps {
  list: IRanked[];
  choose: (tag: LangTag) => void;
  subtag?: boolean;
  secondary?: boolean;
}

export function LanguageChoice(props: IProps) {
  const { list, langTags, secondary, choose, subtag } = props;
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

  const detail = (tag: LangTag) => {
    return (
      <>
        <Typography>A Language of {tag.regionname}</Typography>
        <Typography>{tag.names ? tag.names.join(", ") : ""}</Typography>
      </>
    );
  };

  const langElems = (list: IRanked[], langTags: LangTag[]) => {
    return list.map(r => {
      const tag = langTags[r.index];
      if (!subtag && tag.tag.indexOf("-") !== -1) return <></>;
      return (
        <ListItem
          button
          onClick={handleChoose(tag)}
          onKeyDown={handleKeydown(tag)}
        >
          <ListItemText
            primary={<Typography>{tag.name}</Typography>}
            secondary={secondary ? detail(tag) : null}
          />
          <ListItemSecondaryAction>
            <Typography>{tag.tag}</Typography>
          </ListItemSecondaryAction>
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
});

const mapDispatchToProps = (dispatch: any): DispatchProps => ({
  ...bindActionCreators({}, dispatch),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LanguageChoice);
