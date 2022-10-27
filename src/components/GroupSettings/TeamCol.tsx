import { useGlobal } from 'reactn';
import { RoleNames } from '../../model';
import { FormGroup, List, IconButton, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { StyledFormLabel } from './GroupSettingsStyles';
import PersonItems from './PersonItems';
import { useRole } from '../../crud';
import { GrowingSpacer } from '../StepEditor';

export interface IPerson {
  canDelete: boolean;
  user: string;
}
interface IProps {
  detail: boolean;
  title: string;
  titledetail: string;
  roledetail?: string;
  people: IPerson[];
  add: () => void;
  del?: (id: string, name: string) => void;
  allUsers?: boolean;
  noDeleteInfo?: string;
  noDeleteAllUsersInfo?: string;
}

function TeamCol(props: IProps) {
  const { detail, people, add, del, allUsers, title, titledetail, roledetail } =
    props;
  const [organization] = useGlobal('organization');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { getInviteProjRole } = useRole();

  const canEdit = () => {
    const projRole = getInviteProjRole(organization);
    return (
      !detail &&
      projRole === RoleNames.Admin &&
      !allUsers &&
      (!offline || offlineOnly)
    );
  };

  return (
    <Grid item xs={12} md={4}>
      <FormGroup sx={{ pb: 3 }}>
        <StyledFormLabel>
          {title} {titledetail}
          <GrowingSpacer />
          {canEdit() && (
            <IconButton
              id={`teamColAdd${title}`}
              size="small"
              sx={{ mr: 2 }}
              onClick={add}
            >
              <AddIcon />
            </IconButton>
          )}
        </StyledFormLabel>
        {roledetail && <StyledFormLabel>{roledetail}</StyledFormLabel>}
        <List dense={true}>
          <PersonItems
            {...props}
            ids={people}
            rev={true}
            del={del}
            allUsers={allUsers}
          />
        </List>
      </FormGroup>
    </Grid>
  );
}

export default TeamCol;
