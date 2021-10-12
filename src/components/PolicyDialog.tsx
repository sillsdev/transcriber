import { ISharedStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { BigDialog } from '../hoc/BigDialog';
import { HTMLPage } from './HTMLPage';
import { termsContent } from '../routes/TermsContent';
import { privacyContent } from '../routes/privacyContent';

interface IStateProps {
  ts: ISharedStrings;
}

interface PolicyDialogProps extends IStateProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
}

export const PolicyDialog = (props: PolicyDialogProps) => {
  const { isOpen, content, onClose, ts } = props;

  return (
    <BigDialog title="" isOpen={isOpen} onOpen={onClose} ts={ts}>
      <HTMLPage text={/terms/i.test(content) ? termsContent : privacyContent} />
    </BigDialog>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(PolicyDialog);
