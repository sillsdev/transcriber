import React, { useState, useEffect } from "react";
import { connect } from 'react-redux';
import { IState, ISnackbarStrings } from '../model';
import localStrings from '../selector/localize';
import { createStyles, withStyles, WithStyles, Theme } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Snackbar from "@material-ui/core/Snackbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

const styles = (theme: Theme) => createStyles({
  close: {
    padding: theme.spacing.unit / 2
  }
});

interface IStateProps {
  t: ISnackbarStrings;
};

interface IProps extends IStateProps, WithStyles<typeof styles>{
  message: JSX.Element;
  reset: () => {};
};

function SimpleSnackbar(props: IProps) {
  const { classes, message, reset = null, t } = props;
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    if (reset !== null) {
      reset();
   }
   setOpen(false)
  };

  useEffect(() => {
    setOpen(message.type === 'span' || (message.type === 'string' && message.toString() !== ''));
  }, [message])

  return (message.type === 'span' || (message.type === 'string' && message.toString() !== '')? (
    <Snackbar
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left"
      }}
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      ContentProps={{
        "aria-describedby": "message-id"
      }}
      message={<span id="message-id" >{message}</span>}
      action={[
        <Button
          key="undo"
          color="secondary"
          size="small"
          onClick={handleClose}
        >
          {t.undo}
        </Button>,
        <IconButton
          key="close"
          aria-label="Close"
          color="inherit"
          className={classes.close}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
      ]}
    />): <></>)
  
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "snackbar"})
});

export default withStyles(styles, { withTheme: true })(
      connect(mapStateToProps)(SimpleSnackbar) as any
  ) as any;
