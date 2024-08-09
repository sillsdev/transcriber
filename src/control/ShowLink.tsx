import { Link } from '@mui/material';
import { isElectron } from '../api-variable';
import { launch } from '../utils/launch';
import { useGlobal } from 'reactn';

interface ShowLinkProps {
  link: string;
}

export default function ShowLink(props: ShowLinkProps) {
  const { link } = props;
  const [offline] = useGlobal('offline');

  const handleLink = (site: string) => () => {
    if (!offline) launch(site, true);
  };

  return (
    <>
      {isElectron && (
        <Link sx={{ cursor: 'pointer' }} onClick={handleLink(link)}>
          {link}
        </Link>
      )}
      {!isElectron && (
        <Link href={link} target="_blank" rel="noopener noreferrer">
          {link}
        </Link>
      )}
    </>
  );
}
