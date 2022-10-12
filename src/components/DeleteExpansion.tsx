import React from 'react';
import { IState, IDeleteExpansionStrings } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { GrowingSpacer } from '../control';

const Heading = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  fontWeight: theme.typography.fontWeightRegular,
}));

interface IStateProps {
  t: IDeleteExpansionStrings;
}

interface IProps extends IStateProps {
  title: string;
  explain: string;
  handleDelete: () => void;
  inProgress: boolean;
}

export function DeleteExpansion(props: IProps) {
  const { t, handleDelete, title, explain, inProgress } = props;

  return (
    <Box sx={{ width: '100%' }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Heading>{t.advanced}</Heading>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column' }}>
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
              >
                {t.delete}
              </Button>
            </Box>
          </FormGroup>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'deleteExpansion' }),
});

export default connect(mapStateToProps)(DeleteExpansion) as any;
