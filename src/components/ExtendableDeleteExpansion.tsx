import React from 'react';
import { IDeleteExpansionStrings } from '../model';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TypographyProps,
  FormGroup,
  FormLabel,
  Button,
  Box,
  styled,
  SxProps,
  Theme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandMore';
import { GrowingSpacer } from '../control';
import { useSelector } from 'react-redux';
import { deleteExpandSelector } from '../selector';
import { useGlobal } from '../context/GlobalContext';

const Heading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  fontWeight: theme.typography.fontWeightRegular,
}));

interface IProps {
  AllProps?: SxProps<Theme>;
  extendsDown: boolean;
  SummaryProps?: SxProps<Theme>;
  IconProps: SxProps<Theme>;
  children?: any;
  DetailsProps?: SxProps<Theme>;
  DangerHeaderProps?: SxProps<Theme>;
  DangerProps?: SxProps<Theme>;
  title?: string;
  TitleProps?: SxProps<Theme>;
  warning: string;
  ButtonBoxProps?: SxProps<Theme>;
  ButtonProps?: SxProps<Theme>;
  handleDelete: () => void;
  inProgress: boolean;
  buttonLabel: string;
}

export function ExtendableDeleteExpansion(props: IProps) {
  const {
    AllProps,
    extendsDown,
    SummaryProps,
    IconProps,
    children,
    DetailsProps,
    DangerHeaderProps,
    DangerProps,
    title,
    TitleProps,
    warning,
    ButtonBoxProps,
    ButtonProps,
    handleDelete,
    inProgress,
    buttonLabel,
  } = props;
  const [offlineOnly] = useGlobal('offlineOnly');
  const t: IDeleteExpansionStrings = useSelector(deleteExpandSelector);

  return (
    <Box sx={{ width: '100%', ...AllProps }}>
      <Accordion>
        <AccordionSummary
          expandIcon={
            extendsDown ? (
              <ExpandMoreIcon sx={IconProps} />
            ) : (
              <ExpandLessIcon sx={IconProps} />
            )
          }
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={{
            display: 'flex',
            width: '100%',
            zIndex: '2',
            ...SummaryProps,
          }}
        >
          <Heading>{t.advanced}</Heading>
        </AccordionSummary>

        <AccordionDetails
          sx={{ display: 'flex', flexDirection: 'column', ...DetailsProps }}
        >
          {!offlineOnly && children}

          <FormLabel>
            <Typography
              variant="h6"
              sx={{
                borderBottom: '1px solid',
                textAlign: 'left',
                marginTop: !offlineOnly ? '2em' : '0em',
                ...DangerHeaderProps,
              }}
            >
              {t.dangerZone}
            </Typography>
          </FormLabel>

          <FormGroup
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              marginTop: '3px',
              textAlign: 'left',
              ...DangerProps,
            }}
          >
            <FormLabel sx={TitleProps}>
              <Typography variant="h6">{title}</Typography>
            </FormLabel>

            <FormLabel
              sx={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                marginTop: '3px',
                textAlign: 'left',
                ...DangerProps,
              }}
            >
              {warning || 'The following action cannot be undone:'}
            </FormLabel>

            <GrowingSpacer />

            <Box sx={{ alignSelf: 'flex-end', ...ButtonBoxProps }}>
              <Button
                id="deleteExpand"
                key="delete"
                color="primary"
                aria-label={t.delete}
                variant="contained"
                sx={{ m: 1, ...ButtonProps }}
                onClick={handleDelete}
                disabled={inProgress}
              >
                {buttonLabel || t.delete}
              </Button>
            </Box>
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default ExtendableDeleteExpansion;
