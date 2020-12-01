import { useGlobal } from 'reactn';
import { Organization, ISharedStrings } from '../model';
import { Online } from '../utils';
import { createOrg, offlineError } from '.';
import * as actions from '../store';
import { useSnackBar } from '../hoc/SnackBar';
import Auth from '../auth/Auth';

interface IDispatchProps {
  doOrbitError: typeof actions.doOrbitError;
}

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps, IDispatchProps {
  auth: Auth;
}

export const useTeamCreate = (props: IProps) => {
  const { doOrbitError } = props;
  const [coordinator] = useGlobal('coordinator');
  const [user] = useGlobal('user');
  const [, setOrganization] = useGlobal('organization');
  const [, setProject] = useGlobal('project');
  const { showMessage } = useSnackBar();
  return (organization: Organization) => {
    const {
      name,
      description,
      websiteUrl,
      logoUrl,
      publicByDefault,
    } = organization?.attributes;

    let orgRec = {
      type: 'organization',
      attributes: {
        name,
        description,
        websiteUrl,
        logoUrl,
        publicByDefault,
      },
    } as Organization;

    Online((online) => {
      createOrg({
        orgRec,
        user,
        coordinator,
        online,
        setOrganization,
        setProject,
        doOrbitError,
      }).catch((err) => offlineError({ ...props, online, showMessage, err }));
    }, props.auth);
  };
};
