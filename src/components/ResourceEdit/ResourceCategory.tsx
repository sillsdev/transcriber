import React from 'react';
import { IResourceState } from '.';
import SelectArtifactCategory from '../Workflow/SelectArtifactCategory';
import { ArtifactCategoryType } from '../../crud';

export const ResourceCategory = (props: IResourceState) => {
  const { state, setState } = props;
  const { category } = state;

  const handleChange = (category: string) => {
    setState && setState((state) => ({ ...state, category, changed: true }));
  };

  return (
    <SelectArtifactCategory
      disabled={!setState}
      type={ArtifactCategoryType.Resource}
      initCategory={category}
      onCategoryChange={setState ? handleChange : undefined}
      required={false}
      allowNew
    />
  );
};
