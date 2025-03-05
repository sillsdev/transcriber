import { Link } from '@mui/material';
import { isElectron } from '../api-variable';
import { launch } from '../utils/launch';
import { useGetGlobal } from '../context/GlobalContext';

interface ShowLinkProps {
  link: string;
}

export default function ShowLink(props: ShowLinkProps) {
  const { link } = props;
  const getGlobal = useGetGlobal();

  const handleLink = (site: string) => () => {
    if (!getGlobal('offline')) launch(site, true);
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
