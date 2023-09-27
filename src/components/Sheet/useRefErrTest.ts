import { useContext } from 'react';
import { passageTypeFromRef } from '../../control/RefRender';
import { PassageTypeEnum } from '../../model/passageType';
import { refMatch } from '../../utils';
import { PlanContext } from '../../context/PlanContext';

export const useRefErrTest = () => {
  const ctx = useContext(PlanContext);
  const { flat } = ctx.state;

  return (ref: any) =>
    typeof ref !== 'string' ||
    (!refMatch(ref) &&
      passageTypeFromRef(ref, flat) === PassageTypeEnum.PASSAGE);
};
