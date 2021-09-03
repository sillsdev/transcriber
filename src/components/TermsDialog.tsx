import { ISharedStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { BigDialog } from '../hoc/BigDialog';
import { Terms } from './Terms';

interface IStateProps {
  ts: ISharedStrings;
}

interface TermsDialogProps extends IStateProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsDialog = (props: TermsDialogProps) => {
  const { isOpen, onClose, ts } = props;
  return (
    <BigDialog title="" isOpen={isOpen} onOpen={onClose} ts={ts}>
      <Terms />
    </BigDialog>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(TermsDialog);
