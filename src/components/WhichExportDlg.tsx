import React, { useState } from 'react';
import { ITranscriptionTabStrings, Plan, ExportType, VProject } from '../model';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField, //mui 6 has a datepicker...upgrade this when...
} from '@mui/material';
// import CopyIcon from '@mui/icons-material/FileCopy';
import { useSnackBar } from '../hoc/SnackBar';
import { useOfflnProjRead } from '../crud/useOfflnProjRead';
import moment, { Moment } from 'moment';
import { shallowEqual, useSelector } from 'react-redux';
import { transcriptionTabSelector } from '../selector';

interface IWhichExportProps {
  project: Plan | VProject | string;
  openExport: boolean;
  setOpenExport: (open: boolean) => void;
  doProjectExport: (exportType: ExportType, importedDate?: Moment) => void;
}

export const WhichExportDlg = ({
  project,
  openExport,
  setOpenExport,
  doProjectExport,
}: IWhichExportProps) => {
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [sinceDate, setSinceDate] = useState<string>('');
  const [snapshotDate, setSnapshotDate] = useState<Moment | undefined>();
  const getOfflineProject = useOfflnProjRead();
  const t: ITranscriptionTabStrings = useSelector(
    transcriptionTabSelector,
    shallowEqual
  );

  const { showMessage } = useSnackBar();

  const doPTF = () => {
    setOpenExport(false);
    doProjectExport(ExportType.PTF);
  };
  const doITF = (event: React.MouseEvent<HTMLElement>) => {
    if (event.shiftKey) {
      const op = getOfflineProject(project);
      var oldDate = moment(op.attributes.snapshotDate);
      setSnapshotDate(oldDate);
      setSinceDate(
        op.attributes.snapshotDate.substring(
          0,
          op.attributes.snapshotDate.indexOf('T')
        )
      );
      setOpenDatePicker(true);
    } else {
      setOpenExport(false);
      doProjectExport(ExportType.ITF);
    }
  };
  const doITFwDate = () => {
    const doIt = (newDate: Moment | undefined) => {
      setOpenDatePicker(false);
      setOpenExport(false);
      doProjectExport(ExportType.ITF, newDate);
    };
    var newDate = moment.utc(sinceDate);
    if (newDate.isValid()) {
      doIt(newDate !== snapshotDate ? newDate : undefined);
    } else {
      showMessage('invalid date');
    }
  };
  const closeNoChoice = () => {
    setOpenExport(false);
  };
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSinceDate(e.target.value);
  };
  return (
    <Dialog
      open={openExport}
      onClose={closeNoChoice}
      aria-labelledby="transExpDlg"
      aria-describedby="transExpDesc"
    >
      <DialogTitle id="transExpDlg">{t.exportType}</DialogTitle>
      <DialogContent>
        <DialogContentText id="transExpDesc">
          {t.exportExplanation}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button id="expCancel" onClick={closeNoChoice} sx={{ color: 'grey' }}>
          {t.cancel}
        </Button>
        <Button id="expPtf" onClick={doPTF} color="primary">
          {t.exportPTFtype}
        </Button>
        <Button id="expItf" onClick={doITF} color="primary">
          {t.exportITFtype}
        </Button>
        {openDatePicker && (
          <TextField
            id="datesince"
            value={sinceDate}
            onChange={handleTextChange}
            label={t.exportSince}
            sx={{ width: '400px' }}
            autoFocus
          />
        )}
        {openDatePicker && (
          <Button id="expItfGo" onClick={doITFwDate} color="primary">
            {t.exportSinceGo}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WhichExportDlg;
