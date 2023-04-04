import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { useGlobal } from 'reactn';
import { IResourceState } from '.';
import Tags, { filteredOptions } from '../../control/Tags';
import { useOrgDefaults } from '../../crud';
import { IResourceStrings, ITag } from '../../model';
import { sharedResourceSelector } from '../../selector';

export const ResKw = 'ResKw';

export const ResourceKeywords = (props: IResourceState) => {
  const { state, setState } = props;
  const { keywords } = state;
  const [org] = useGlobal('organization');
  const [allKeywords, setAllKeywords] = React.useState('');
  const { getOrgDefault } = useOrgDefaults();
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);

  React.useEffect(() => {
    const resKw = getOrgDefault(ResKw, org);
    if (resKw) {
      setAllKeywords(resKw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const tags = React.useMemo(() => {
    const kwList = keywords.split('|');
    const kwSet = new Set(kwList);
    const allKw = Array.from(new Set(allKeywords.split('|').concat(kwList)));
    const tags: ITag = {};
    allKw
      .filter((k) => k) // don't include empty string
      .forEach((kw) => {
        tags[kw] = kwSet.has(kw);
      });
    return tags;
  }, [keywords, allKeywords]);

  const handleChange = (tags: ITag) => {
    setState &&
      setState((state) => ({
        ...state,
        keywords: filteredOptions(tags).join('|'),
      }));
  };

  return (
    <Tags
      label={t.keywords}
      tags={tags}
      onChange={setState ? handleChange : undefined}
    />
  );
};
