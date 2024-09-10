import { useState } from 'react';
import { useGlobal } from 'reactn';
import { BibleResource } from '../../../model/bible-resource';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { useSnackBar } from '../../../hoc/SnackBar';
import { IFindResourceStrings } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { Badge, Grid } from '@mui/material';
import { AltButton } from '../../../control';
import { parseRef } from '../../../crud/passage';
import { pad3 } from '../../../utils/pad3';
import { isElectron } from '../../../api-variable';
import launch from '../../../utils/launch';

export default function ResourceItem({
  resource,
  onLink,
}: {
  resource: BibleResource;
  onLink?: (link: string) => void;
}) {
  const { passage } = usePassageDetailContext();
  const { showMessage } = useSnackBar();
  const [open, setOpen] = useState(false);
  const [isOffline] = useGlobal('offline');
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );

  const handleClick = (_kind: string, hrefTpl: string) => () => {
    const book = passage?.attributes?.book;
    parseRef(passage);
    const href = hrefTpl
      .replace('{0}', book ?? 'MAT')
      .replace('{1}', pad3(passage?.attributes?.startChapter ?? 1))
      .replace('{2}', pad3(passage?.attributes?.startVerse ?? 1))
      .replace('{3}', pad3(passage?.attributes?.endChapter ?? 1))
      .replace('{4}', pad3(passage?.attributes?.endVerse ?? 1));
    if (isElectron) launch(href, !isOffline);
    else onLink?.(href);
  };

  const handleHelp = (resource?: BibleResource) => () => {
    showMessage(resource?.help && !open ? t.getString(resource.help) : '');
    setOpen(!open);
  };

  return (
    <Grid item>
      {resource?.href ? (
        <AltButton
          onClick={handleClick(resource.name, resource.href)}
          title={resource.help ? t.getString(resource.help) : undefined}
          variant="outlined"
          sx={{ m: 1 }}
        >
          {resource.ai ? (
            <Badge badgeContent="AI">{resource.name}</Badge>
          ) : (
            resource.name
          )}
        </AltButton>
      ) : (
        <AltButton
          title={resource.help ? t.getString(resource.help) : undefined}
          variant="outlined"
          sx={{ m: 1 }}
          onClick={handleHelp(resource)}
        >
          {resource.ai ? (
            <Badge badgeContent="AI">{resource.name}</Badge>
          ) : (
            resource.name
          )}
        </AltButton>
      )}
    </Grid>
  );
}
