import { BibleResource } from '../model/bible-resource';
import {
  Aquifer,
  FaithBridge,
  Logos,
  ObtHelper,
  TranslatorsNotes,
  UbsResources,
} from './brands';

const resource: BibleResource[] = [
  {
    name: FaithBridge,
    href: 'https://faithbridge.multilingualai.com/',
    ai: true,
  },
  {
    name: ObtHelper,
    href: 'https://www.shemaywam.com/bthelper',
    ai: true,
  },
  {
    name: TranslatorsNotes,
    href: 'https://opentn.bible/',
  },
  {
    name: UbsResources,
    href: 'https://translation.bible/tools-resources/',
  },
  {
    name: Logos,
    href: 'https://app.logos.com/',
  },
  {
    name: 'Open Content',
    href: 'https://www.unfoldingword.org/for-translators/content',
  },
  {
    name: Aquifer,
    href: 'https://app.well.bible/view-content/-/{0}{1}{2}-{3}{4}',
    featured: true,
  },
];
export default resource;
