import { IconButton } from '@mui/material';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import { PublishIcon } from '../../control/PlanIcons';
import { IPlanSheetStrings, ISheet } from '../../model';
import { ExtraIcon } from './extraIcon';
import { positiveWholeOnly } from '../../utils';
import { shallowEqual, useSelector } from 'react-redux';
import { planSheetSelector } from '../../selector';

interface IProps {
  sectionMap: Map<number, string>;
  rowInfo: ISheet[];
  rowIndex: number;
  organizedBy: string;
  onAction: (rowIndex: number, action: ExtraIcon) => void;
}

export const PublishButton = (props: IProps) => {
  const { sectionMap, rowInfo, rowIndex, organizedBy, onAction } = props;
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);

  const sectionSequenceNumber =
    sectionMap.get(rowInfo[rowIndex].sectionSeq) ||
    positiveWholeOnly(rowInfo[rowIndex].sectionSeq);
  return rowInfo[rowIndex].published ? (
    <PublishIcon
      id="unpublish"
      onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
      title={t.unpublish
        .replace('{0}', organizedBy)
        .replace('{1}', sectionSequenceNumber)}
    />
  ) : (
    <IconButton
      id="publish"
      onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
      title={t.publish
        .replace('{0}', organizedBy)
        .replace('{1}', sectionSequenceNumber)}
    >
      <RadioButtonUnchecked color="primary" />
    </IconButton>
  );
};
