import { BigDialog } from '../hoc/BigDialog';
import { HTMLPage } from './HTMLPage';
import { termsContent } from '../routes/TermsContent';
import { privacyContent } from '../routes/privacyContent';

interface PolicyDialogProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
}

export const PolicyDialog = (props: PolicyDialogProps) => {
  const { isOpen, content, onClose } = props;

  return (
    <BigDialog title="" isOpen={isOpen} onOpen={onClose}>
      <HTMLPage text={/terms/i.test(content) ? termsContent : privacyContent} />
    </BigDialog>
  );
};

export default PolicyDialog;
