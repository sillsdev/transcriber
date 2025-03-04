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
  DetailsProps?: SxProps<Theme>;
  DeleteButtonProps?: ButtonProps;
  DeleteButtonLabel?: string;
  children?: any;
}

export function DeleteExpansion(props: IProps) {
  const { handleDelete, title, explain, inProgress, icon, SummaryProps, DetailsProps, DeleteButtonProps, DeleteButtonLabel, children } = props;
  const t: IDeleteExpansionStrings = useSelector(deleteExpandSelector);

  return (
    <Box sx={{ width: '100%' }}>
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
            <Typography variant="h5" sx={{ pb: '10px' }}>
              {t.dangerZone}
            </Typography>
          </FormLabel>
          <FormGroup
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexGrow: 1,
              padding: '20px',
              border: '1px solid',
              borderColor: 'secondary.main',
            }}
          >
            <div>
              <FormLabel>
                <Typography variant="h6">{title}</Typography>
              </FormLabel>
              <FormLabel>
                <div>{explain}</div>
              </FormLabel>
            </div>
            <GrowingSpacer />
            <Box sx={{ alignSelf: 'center' }}>
              <Button
                id="deleteExpand"
                key="delete"
                color="secondary"
                aria-label={t.delete}
                variant="contained"
                sx={{ m: 1 }}
                onClick={handleDelete}
                disabled={inProgress}
                {...DeleteButtonProps}
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
