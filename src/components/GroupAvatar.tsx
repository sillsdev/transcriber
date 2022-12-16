import { ISharedStrings, IState, Group } from '../model';
import { connect } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { Avatar, AvatarProps, styled } from '@mui/material';
import { makeAbbr } from '../utils';
import localStrings from '../selector/localize';
import { useAvatarSource } from '../crud';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledAvatarProps extends AvatarProps {
  small?: boolean;
}
const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'small',
})<StyledAvatarProps>(({ small, theme }) => ({
  ...(small
    ? {
        width: theme.spacing(3),
        height: theme.spacing(3),
      }
    : {
        width: theme.spacing(5),
        height: theme.spacing(5),
      }),
}));

interface IStateProps {
  ts: ISharedStrings;
}

interface IRecordProps {
  groups: Array<Group>;
}

interface IProps extends IStateProps, IRecordProps {
  groupRec: Group;
  small?: boolean;
}

export function GroupAvatar(props: IProps) {
  const { groupRec, small } = props;
  const source = useAvatarSource(groupRec.attributes.name, groupRec);

  return source ? (
    <StyledAvatar alt={groupRec.attributes.name} src={source} small={small} />
  ) : groupRec.attributes && groupRec.attributes.name !== '' ? (
    <StyledAvatar small={small}>
      {makeAbbr(groupRec.attributes.name)}
    </StyledAvatar>
  ) : (
    <></>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});
const mapRecordsToProps = {
  groups: (q: QueryBuilder) => q.findRecords('group'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(GroupAvatar) as any
) as any;
