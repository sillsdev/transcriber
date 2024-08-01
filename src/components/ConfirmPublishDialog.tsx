import { useState } from 'react';
import { IAlertStrings, IPublishLevelStrings, ISharedStrings } from '../model';
import {
  Button,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Link,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import { shallowEqual, useSelector } from 'react-redux';
import {
  alertSelector,
  publishLevelSelector,
  sharedSelector,
} from '../selector';
import { PublishLevelEnum } from '../crud';
import { isElectron } from '../api-variable';
import { launch } from '../utils';
import { useGlobal } from 'reactn';

interface IProps {
  title: string;
  description: string;
  current: PublishLevelEnum;
  noResponse: () => void;
  yesResponse: (level: PublishLevelEnum) => void;
}

function ConfirmPublishDialog(props: IProps) {
  const { title, description, yesResponse, noResponse, current } = props;
  const t: IAlertStrings = useSelector(alertSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const l: IPublishLevelStrings = useSelector(
    publishLevelSelector,
    shallowEqual
  );
  const [open, setOpen] = useState(true);
  const [value, setValue] = useState(current);
  const [offline] = useGlobal('offline');

  const handleClose = () => {
    if (noResponse !== null) {
      noResponse();
    }
    setOpen(false);
  };
  const handleNo = () => {
    if (noResponse !== null) {
      noResponse();
    }
    setOpen(false);
  };
  const handleYes = () => {
    if (yesResponse !== null && value !== current) {
      yesResponse(value);
    } else handleNo();
    setOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number((event.target as HTMLInputElement).value));
  };

  const handleLink = (site: string) => () => {
    if (!offline) launch(site, true);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="confirmPublishDlg"
      aria-describedby="confirmPublishDesc"
      disableEnforceFocus
    >
      <DialogTitle id="alertDlg">{title}</DialogTitle>
      <DialogContent>
        <DialogContent id="alertJsx">
          <Typography id="alertDesc">{description}</Typography>
          <FormControl>
            <RadioGroup
              aria-labelledby="Section Publish"
              value={value}
              onChange={handleChange}
              name="radio-buttons-group"
            >
              <FormControlLabel
                value={PublishLevelEnum.Beta}
                control={<Radio />}
                label={l.beta}
              />
              <FormHelperText sx={{ textAlign: 'center' }}>
                {isElectron && (
                  <Link href={l.betalink} onClick={handleLink(l.betalink)}>
                    {l.betalink}
                  </Link>
                )}
                {!isElectron && (
                  <Link
                    href={l.betalink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.betalink}
                  </Link>
                )}
              </FormHelperText>
              <FormControlLabel
                value={PublishLevelEnum.Public}
                control={<Radio />}
                label={l.public}
              />
              <FormControlLabel
                value={PublishLevelEnum.None}
                control={<Radio />}
                label={l.none}
              />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogContentText id="alertDesc">{t.areYouSure}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button id="alertNo" onClick={handleNo} color="primary">
          {value === current ? ts.cancel : t.no}
        </Button>
        <Button
          id="alertYes"
          onClick={handleYes}
          variant="contained"
          color="primary"
          disabled={value === current}
          autoFocus
        >
          {t.yes}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmPublishDialog;
