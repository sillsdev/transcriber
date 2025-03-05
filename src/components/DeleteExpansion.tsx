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
  ButtonProps,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { GrowingSpacer } from '../control';
import { useSelector } from 'react-redux';
import { deleteExpandSelector } from '../selector';
import { Variant } from '@mui/material/styles/createTypography';

const Heading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  fontWeight: theme.typography.fontWeightRegular,
}));

interface IProps {
  title: string;
  explain: string;
  handleDelete: () => void;
  inProgress: boolean;
  icon?: React.ReactNode;
  SummaryProps?: SxProps<Theme>;
  DangerHeader?: Variant;
  DangerHeaderProps?: SxProps<Theme>
  DangerProps?: SxProps<Theme>;
  DetailsProps?: SxProps<Theme>;
  DeleteButtonProps?: SxProps<Theme>;
  ButtonBoxProps?: SxProps<Theme>;
  BoxProps?: SxProps<Theme>;
  DeleteButtonLabel?: string;
  children?: any;
}

export function DeleteExpansion(props: IProps) {
  const { handleDelete, title, explain, inProgress, icon, SummaryProps, 
          DangerHeader, DangerHeaderProps, DangerProps, DetailsProps, 
          DeleteButtonProps, ButtonBoxProps, BoxProps,
          DeleteButtonLabel, children } = props;
  const t: IDeleteExpansionStrings = useSelector(deleteExpandSelector);

  return (
    <Box sx={BoxProps || { width: '100%' }}>
      <Accordion>
        <AccordionSummary
          expandIcon={ icon || <ExpandMoreIcon/>}
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={SummaryProps}
        >
          <Heading>{t.advanced}</Heading>
        </AccordionSummary>
        <AccordionDetails sx={DetailsProps || { display: 'flex', flexDirection: 'column' }}>
          {children}
          <FormLabel>
            <Typography variant={DangerHeader || "h5"} sx={DangerHeaderProps || { pb: '10px' }}>
              {t.dangerZone}
            </Typography>
          </FormLabel>
          <FormGroup
            sx={DangerProps || {
              display: 'flex',
              flexDirection: 'row',
              flexGrow: 1,
              padding: '20px',
              border: '1px solid',
              borderColor: 'secondary.main'
            }}
          >
            <div>
              <FormLabel>
                <Typography variant="h6">{title}</Typography>
              </FormLabel>
              <FormLabel sx={ DangerProps }>
                <div>{explain}</div>
              </FormLabel>
            </div>
            <GrowingSpacer />
            <Box sx={ButtonBoxProps || { alignSelf: 'center' }}>
              <Button
                id="deleteExpand"
                key="delete"
                color="secondary"
                aria-label={t.delete}
                variant="contained"
                sx={DeleteButtonProps || { m: 1 }}
                onClick={handleDelete}
                disabled={inProgress}
              >
                {DeleteButtonLabel || t.delete}
              </Button>
            </Box>
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

export default DeleteExpansion;
