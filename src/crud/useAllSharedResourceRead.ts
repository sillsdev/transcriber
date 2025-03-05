import JSONAPISource from '@orbit/jsonapi';
import { Resource } from '../model';
import { useGlobal } from '../context/GlobalContext';
import { PassageTypeEnum } from '../model/passageType';

export const useAllSharedResourceRead = () => {
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;

  return async () => {
    if (remote)
      return (
        (await remote.query((q) => q.findRecords('resource'))) as Resource[]
      ).filter(
        (r) =>
          !r?.attributes.passageDesc.includes(PassageTypeEnum.CHAPTERNUMBER)
      );
    else return [] as Resource[];
  };
};
