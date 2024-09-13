import { useState } from 'react';
import {
  IAlertStrings,
  IPublishLevelStrings,
  IPublishToStrings,
  ISharedStrings,
} from '../model';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import DialogActions from '@mui/material/DialogActions';
import { shallowEqual, useSelector } from 'react-redux';
import {
  alertSelector,
  publishLevelSelector,
  publishToSelector,
  sharedSelector,
} from '../selector';
import { PublishLevelEnum, usePublishDestination } from '../crud';
import ShowLink from '../control/ShowLink';
import { PublishDestinationEnum } from '../crud';

interface IProps {
  title: string;
  description: string;
  current: PublishDestinationEnum[];
  sharedProject: boolean;
  hasPublishing: boolean;
  noDefaults?: boolean;
  noResponse: () => void;
  yesResponse: (destinations: PublishDestinationEnum[]) => void;
}

function ConfirmPublishDialog(props: IProps) {
  const {
    title,
    description,
    sharedProject,
    hasPublishing,
    yesResponse,
    noResponse,
    current,
    noDefaults,
  } = props;

  const t: IAlertStrings = useSelector(alertSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const l: IPublishLevelStrings = useSelector(
    publishLevelSelector,
    shallowEqual
  );
  const { getDefaults } = usePublishDestination();
  const p: IPublishToStrings = useSelector(publishToSelector, shallowEqual);
  const [open, setOpen] = useState(true);
  const [value, setValuex] = useState(
    current.length === 0 && !noDefaults
      ? getDefaults(hasPublishing, sharedProject)
      : current
  );

  const calcAkuoValue = (val: PublishDestinationEnum[]) => {
    if (val.includes(PublishDestinationEnum.AkuoBeta)) {
      return PublishLevelEnum.Beta;
    } else if (val.includes(PublishDestinationEnum.AkuoPublic)) {
      return PublishLevelEnum.Public;
    } else {
      return PublishLevelEnum.None;
    }
  };
  const [akuoValue, setAkuoValue] = useState<PublishLevelEnum>(
    calcAkuoValue(value)
  );
  const setValue = (val: PublishDestinationEnum[]) => {
    setValuex(val);
    setAkuoValue(calcAkuoValue(val));
  };

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
      value.push(PublishDestinationEnum.PublishDestinationSetByUser);
      yesResponse(value);
    } else handleNo();
    setOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    var akuo = Number((event.target as HTMLInputElement).value);
    if (akuo === PublishLevelEnum.Beta) {
      setValue([
        ...value.filter((v) => v !== PublishDestinationEnum.AkuoPublic),
        PublishDestinationEnum.AkuoBeta,
      ]);
    } else if (akuo === PublishLevelEnum.Public) {
      setValue([
        ...value.filter((v) => v !== PublishDestinationEnum.AkuoBeta),
        PublishDestinationEnum.AkuoPublic,
      ]);
    } else {
      setValue([
        ...value.filter(
          (v) =>
            v !== PublishDestinationEnum.AkuoBeta &&
            v !== PublishDestinationEnum.AkuoPublic
        ),
      ]);
    }
  };

  const handleCheckboxChange =
    (which: PublishDestinationEnum) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;
      if (checked) {
        setValue([...value, which]);
      } else {
        setValue(value.filter((v) => v !== which));
      }
    };
  const handleAkuoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      setValue([...value, PublishDestinationEnum.AkuoPublic]);
    } else {
      setValue(
        value.filter(
          (v) =>
            v !== PublishDestinationEnum.AkuoPublic &&
            v !== PublishDestinationEnum.AkuoBeta
        )
      );
    }
  };
  const AkuoRadioGroup = (showNotPublished: boolean) => (
    <Box sx={{ p: 2, marginLeft: '30px', border: '2px grey' }}>
      <RadioGroup
        aria-labelledby="Section Publish"
        value={akuoValue}
        onChange={handleChange}
        name="radio-buttons-group"
      >
        <FormControlLabel
          value={PublishLevelEnum.Beta}
          control={<Radio />}
          label={l.beta}
        />
        <FormHelperText sx={{ textAlign: 'center' }}>
          <ShowLink link="https://akuobible.org/?beta=true" />
        </FormHelperText>
        <FormControlLabel
          value={PublishLevelEnum.Public}
          control={<Radio />}
          label={l.public}
        />
        {showNotPublished && (
          <FormControlLabel
            value={PublishLevelEnum.None}
            control={<Radio />}
            label={l.none}
          />
        )}
      </RadioGroup>
    </Box>
  );

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
          {hasPublishing && (
            <Typography id="alertDesc">{description}</Typography>
          )}
          <FormControl>
            {hasPublishing && sharedProject && (
              <>
                <FormControlLabel
                  sx={{ m: 1 }}
                  control={
                    <Checkbox
                      checked={akuoValue !== PublishLevelEnum.None}
                      onChange={handleAkuoChange}
                      value="Akuo"
                    />
                  }
                  label="Akuo"
                />
                {akuoValue !== PublishLevelEnum.None && AkuoRadioGroup(false)}
              </>
            )}
            {!sharedProject && AkuoRadioGroup(true)}
            {sharedProject && (
              <>
                <FormControlLabel
                  sx={{ m: 1 }}
                  control={
                    <Checkbox
                      checked={value.includes(PublishDestinationEnum.Aquifer)}
                      onChange={handleCheckboxChange(
                        PublishDestinationEnum.Aquifer
                      )}
                      value="Aquifer"
                    />
                  }
                  label="Aquifer"
                />
                <FormControlLabel
                  sx={{ m: 1 }}
                  control={
                    <Checkbox
                      checked={value.includes(
                        PublishDestinationEnum.Internalization
                      )}
                      onChange={handleCheckboxChange(
                        PublishDestinationEnum.Internalization
                      )}
                      value="Internalization"
                    />
                  }
                  label={p.Internalization}
                />
                <FormControlLabel
                  sx={{ m: 1 }}
                  control={
                    <Checkbox
                      checked={value.includes(PublishDestinationEnum.OBTHelps)}
                      onChange={handleCheckboxChange(
                        PublishDestinationEnum.OBTHelps
                      )}
                      value="OBTHelps"
                    />
                  }
                  label="obthelps.org"
                />
              </>
            )}
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
