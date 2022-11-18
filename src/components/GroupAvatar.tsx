import { useGlobal } from 'reactn';
import { ISharedStrings, IState, Group } from '../model';
import { connect } from 'react-redux';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { Avatar, AvatarProps, styled } from '@mui/material';
import { makeAbbr } from '../utils';
import { dataPath, PathType } from '../utils/dataPath';
import { remoteId } from '../crud';
import { isElectron } from '../api-variable';
import localStrings from '../selector/localize';
const os = require('os');
const fs = require('fs');

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
  const [memory] = useGlobal('memory');

  var src = dataPath(groupRec.attributes.name, PathType.AVATARS, {
    localname:
      remoteId('group', groupRec.id, memory.keyMap) +
      groupRec.attributes.name +
      '.png',
  });
  if (src && isElectron && !src.startsWith('http')) {
    if (fs.existsSync(src)) {
      const url =
        os.platform() === 'win32' ? new URL(src).toString().slice(8) : src;
      src = `transcribe-safe://${url}`;
    } else src = '';
  }
  return src ? (
    <StyledAvatar alt={groupRec.attributes.name} src={src} small={small} />
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
