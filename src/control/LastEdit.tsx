import { useGlobal } from '../mods/reactn';
import { ISharedStrings } from '../model';
import { dateOrTime } from '../utils';
import { AltButton } from './AltButton';

interface IStateProps {
  t: ISharedStrings;
}

interface IProps extends IStateProps {
  when: string | undefined;
  cb?: () => void;
}

export const LastEdit = (props: IProps) => {
  const { when, cb, t } = props;
  const [lang] = useGlobal('lang');

  const handleHistory = () => {
    cb && cb();
  };

  return when ? (
    <AltButton
      id="editHist"
      key="last-edit"
      aria-label={t.lastEdit}
      variant="text"
      sx={{ justifyContent: 'flex-start' }}
      onClick={handleHistory}
    >
      {t.lastEdit.replace('{0}', dateOrTime(when, lang))}
    </AltButton>
  ) : (
    <></>
  );
};
