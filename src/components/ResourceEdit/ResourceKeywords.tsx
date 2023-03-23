import React from 'react';
import { useGlobal } from 'reactn';
import { IResourceState } from '.';
import Tags, { filteredOptions } from '../../control/Tags';
import { useOrgDefaults } from '../../crud';
import { ITag } from '../../model';

const ResKw = 'ResKw';

export const ResourceKeywords = (props: IResourceState) => {
  const { state, setState } = props;
  const { keywords } = state;
  const [org] = useGlobal('organization');
  const [allKeywords, setAllKeywords] = React.useState('');
  const { getOrgDefault } = useOrgDefaults();

  React.useEffect(() => {
    const resKw = getOrgDefault(ResKw, org);
    if (resKw) {
      setAllKeywords(resKw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const getTags = (keywords: string, allKeywords: string) => {
    const kwList = keywords.split('|');
    const kwSet = new Set(kwList);
    const allKw = Array.from(new Set(allKeywords.split('|').concat(kwList)));
    const tags: ITag = {};
    allKw.forEach((kw) => {
      tags[kw] = kwSet.has(kw);
    });
    return tags;
  };

  const handleChange = (tags: ITag) => {
    setState((state) => ({
      ...state,
      keywords: filteredOptions(tags).join('|'),
    }));
  };

  return (
    <Tags
      label={'t.keywords'}
      tags={getTags(keywords, allKeywords)}
      onChange={handleChange}
    />
  );
};
