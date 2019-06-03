import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { IState, IPlanAddStrings } from '../model';
import localStrings from '../selector/localize';
import { withStyles, WithStyles, Theme, createStyles } from '@material-ui/core/styles';
import {Button, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle } from '@material-ui/core';
import SnackBar from './SnackBar';
const FileDrop = (process.env.NODE_ENV !== 'test')? 
  require('react-file-drop').default: <></>;

const styles = (theme: Theme) => createStyles({
  label: {
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    height: '28px',
    backgroundColor: theme.palette.grey[500],
    border: 'none',
    padding: theme.spacing.unit * 2,
  },
  drop: {
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: theme.palette.secondary.light,
    padding: theme.spacing.unit,
    margin: theme.spacing.unit,
  }
});

interface IStateProps {
    t: IPlanAddStrings;
  };

interface IProps extends IStateProps, WithStyles<typeof styles>{
    visible: boolean;
    uploadMethod?: (files: FileList) => void;
    cancelMethod?: () => void;
};

function  MediaUpload(props: IProps) {
    const { classes, t, visible,
      uploadMethod, cancelMethod } = props;
    const [open, setOpen] = useState(visible);
    const [name, setName] = useState('');
    const [files, setFiles] = useState();
    const [message, setMessage] = useState(<></>);

    const handleAddOrSave = () => {
      if (uploadMethod) {
        uploadMethod(files);
      }
      setOpen(false);
    }
    const handleCancel = () => {
      if (cancelMethod) {
        cancelMethod();
      }
      setOpen(false)
    }
    const handleNameChange = (e: React.FormEvent<HTMLInputElement|HTMLLabelElement>) => {
      const inputEl = (e.target as HTMLInputElement);
      if (inputEl && inputEl.files) {
        setName(inputEl.files.length === 1? inputEl.files[0].name: inputEl.files.length.toString() + " files selected")
        setFiles(inputEl.files);
      }
    };
    const handleMessageReset = () => { setMessage(<></>) };
    const handleDrop = (files: FileList) => {
      setName(files.length === 1? files[0].name: files.length.toString() + " files selected")
      setFiles(files);
    }

    useEffect(() => {
        setOpen(visible)
    }, [visible])

    const dropTarget = process.env.NODE_ENV !== 'test'?
      <FileDrop onDrop={handleDrop}>
        <label
          id="file"
          className={classes.label}
          htmlFor='upload'
          onChange={handleNameChange}
        >{name ===''? 'Select file(s)': name}</label>
        <input
          id='upload'
          style={{display: 'none'}}
          type='file'
          accept='audio/mpeg, audio/wav'
          multiple={true}
          onChange={handleNameChange}
        />
      </FileDrop>:
      <div>
        <label
          id="file"
          className={classes.label}
          htmlFor='upload'
          onChange={handleNameChange}
        >{name ===''? 'Select file(s)': name}</label>
        <input
          id='upload'
          style={{display: 'none'}}
          type='file'
          accept='audio/mpeg, audio/wav'
          multiple={true}
          onChange={handleNameChange}
        />
      </div>


    return (
      <div>
        <Dialog
          open={open}
          onClose={handleCancel}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">{'Upload Media'}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {'Choose .mp3 or .wav file(s) or drop files from your file explorer.'}
            </DialogContentText>
            <div className={classes.drop}>
              {dropTarget}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} variant="outlined" color="primary">
              {t.cancel}
            </Button>
            <Button onClick={handleAddOrSave} variant="contained" color="primary">
              {'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
        <SnackBar {...props} message={message} reset={handleMessageReset} />
      </div>
    );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "planAdd"})
});

export default withStyles(styles, { withTheme: true })(
  connect(mapStateToProps)(MediaUpload) as any
) as any;
