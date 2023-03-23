import React from 'react';
import { IResourceState } from '.';
import { SelectArtifactCategory } from '../Workflow';

export const ResourceCategory = (props: IResourceState) => {
  const { state, setState } = props;
  const { category } = state;

  const handleChange = (category: string) => {
    setState((state) => ({ ...state, category }));
  };

  return (
    <SelectArtifactCategory
      initCategory={category}
      onCategoryChange={handleChange}
      required={false}
      artifactCategories={[]}
    />
  );
};
