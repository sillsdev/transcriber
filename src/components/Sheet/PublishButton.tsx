import { IconButton, alpha } from '@mui/material';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import { PublishIcon } from '../../control/PlanIcons';
import { IPlanSheetStrings, ISheet } from '../../model';
import { ExtraIcon } from './extraIcon';
import { positiveWholeOnly } from '../../utils';
import { shallowEqual, useSelector } from 'react-redux';
import { planSheetSelector } from '../../selector';
import { rowTypes } from './rowTypes';
import { PublishDestinationEnum, usePublishDestination } from '../../crud';

interface IProps {
  canPublish: boolean;
  sectionMap: Map<number, string>;
  rowInfo: ISheet[];
  rowIndex: number;
  organizedBy: string;
  onAction: (rowIndex: number, action: ExtraIcon) => void;
}

export const PublishButton = (props: IProps) => {
  const { canPublish, sectionMap, rowInfo, rowIndex, organizedBy, onAction } =
    props;
  const { isMovement } = rowTypes(rowInfo);
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const sectionSequenceNumber =
    sectionMap.get(rowInfo[rowIndex].sectionSeq) ||
    positiveWholeOnly(rowInfo[rowIndex].sectionSeq);
  const description = isMovement(rowIndex) ? t.movement : organizedBy;
  const { isPublished } = usePublishDestination();

  return isPublished(rowInfo[rowIndex].published) ? (
    <PublishIcon
      sx={{
        color: rowInfo[rowIndex].published.includes(
          PublishDestinationEnum.AkuoPublic
        )
          ? 'green'
          : alpha('#8f9a27', 0.6), // lime green
      }}
      id="unpublish"
      onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
      title={t.changepublish
        .replace('{0}', description)
        .replace('{1}', sectionSequenceNumber)}
      disabled={!canPublish}
    />
  ) : (
    <IconButton
      id="publish"
      onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
      title={t.publish
        .replace('{0}', description)
        .replace('{1}', sectionSequenceNumber)}
      sx={{ p: '2px' }}
      disabled={!canPublish}
    >
      <RadioButtonUnchecked color="primary" />
    </IconButton>
  );
};
