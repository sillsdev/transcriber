import { IconButton, alpha } from '@mui/material';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import { PublishIcon } from '../../control/PlanIcons';
import { IPlanSheetStrings, ISheet } from '../../model';
import { ExtraIcon } from './extraIcon';
import { positiveWholeOnly } from '../../utils';
import { shallowEqual, useSelector } from 'react-redux';
import { planSheetSelector } from '../../selector';
import { rowTypes } from './rowTypes';
import { PublishLevelEnum } from '../../crud/usePublishLevel';

interface IProps {
  sectionMap: Map<number, string>;
  rowInfo: ISheet[];
  rowIndex: number;
  organizedBy: string;
  onAction: (rowIndex: number, action: ExtraIcon) => void;
}

export const PublishButton = (props: IProps) => {
  const { sectionMap, rowInfo, rowIndex, organizedBy, onAction } = props;
  const { isMovement } = rowTypes(rowInfo);
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const sectionSequenceNumber =
    sectionMap.get(rowInfo[rowIndex].sectionSeq) ||
    positiveWholeOnly(rowInfo[rowIndex].sectionSeq);
  const description = isMovement(rowIndex) ? t.movement : organizedBy;
  return rowInfo[rowIndex].published !== PublishLevelEnum.None ? (
    <PublishIcon
      sx={{
        color:
          rowInfo[rowIndex].published === PublishLevelEnum.Public
            ? 'green'
            : alpha('#8f9a27', 0.6),
      }}
      id="unpublish"
      onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
      title={t.changepublish
        .replace('{0}', description)
        .replace('{1}', sectionSequenceNumber)}
    />
  ) : (
    <IconButton
      id="publish"
      onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
      title={t.publish
        .replace('{0}', description)
        .replace('{1}', sectionSequenceNumber)}
    >
      <RadioButtonUnchecked color="primary" />
    </IconButton>
  );
};
