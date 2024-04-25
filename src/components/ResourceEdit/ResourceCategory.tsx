import React from 'react';
import { IResourceState } from '.';
import SelectArtifactCategory from '../Sheet/SelectArtifactCategory';
import { ArtifactCategoryType } from '../../crud';

export const ResourceCategory = (props: IResourceState) => {
  const { state, setState } = props;
  const { category, note } = state;

  const handleChange = (category: string) => {
    setState && setState((state) => ({ ...state, category, changed: true }));
  };

  return (
    <SelectArtifactCategory
      disabled={!setState}
      type={!note ? ArtifactCategoryType.Resource : ArtifactCategoryType.Note}
      initCategory={category}
      onCategoryChange={setState ? handleChange : undefined}
      required={false}
      allowNew
    />
  );
};
