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
  explain: string;
  ButtonBoxProps?: SxProps<Theme>;
  ButtonProps?: SxProps<Theme>;
  handleDelete: () => void;
  inProgress: boolean;
  buttonLabel: string;
}

export function ExtendableDeleteExpansion(props: IProps) {
  const { AllProps, extendsDown, SummaryProps, IconProps, children, 
          DetailsProps, DangerHeaderProps, DangerProps, title, TitleProps, 
          explain, ButtonBoxProps, ButtonProps, handleDelete, inProgress, 
          buttonLabel } = props;
  const t: IDeleteExpansionStrings = useSelector(deleteExpandSelector);

  return (
    <Box sx={AllProps || { width: '100%' }}>
      <Accordion>
        <AccordionSummary
          expandIcon={extendsDown ? <ExpandMoreIcon sx={IconProps} /> : <ExpandLessIcon sx={IconProps} />}
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={SummaryProps}
        >
          <Heading>{t.advanced}</Heading>
        </AccordionSummary>
        
        <AccordionDetails sx={DetailsProps || { display: 'flex', flexDirection: 'column' }}>
          {children}
          
          <FormLabel>
            <Typography variant="h6" sx={DangerHeaderProps || { 
              borderBottom: '1px solid', 
              borderColor: 'secondary.contrastText', 
              textAlign: 'left',
              color: 'secondary.contrastText',
              marginTop: '2em' 
            }}>
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
            <FormLabel sx={TitleProps}>
              <Typography variant="h6">{title}</Typography>
            </FormLabel>
            
            <FormLabel sx={ DangerProps || {
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              marginTop: '3px',
              textAlign: 'left',
              color: 'secondary.contrastText'
            }}>
              {explain || "The following action cannot be undone:"}
            </FormLabel>

            <GrowingSpacer />

            <Box sx={ButtonBoxProps || { alignSelf: 'flex-end' }}>
              <Button
                id="deleteExpand"
                key="delete"
                color="primary"
                aria-label={t.delete}
                variant="contained"
                sx={ButtonProps || { m: 1, textTransform: 'capitalize' }}
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