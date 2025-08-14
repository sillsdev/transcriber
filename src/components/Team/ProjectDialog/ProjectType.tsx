import React from 'react';
import { TeamContext } from '../../../context/TeamContext';
import { Options } from '.';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';
import { IVProjectStrings } from '../../../model';

interface IProps {
  type: string;
  onChange: (type: string) => void;
}

export const ProjectType = (props: IProps) => {
  const { type, onChange } = props;
  const ctx = React.useContext(TeamContext);
  const { planTypes } = ctx.state;
  const t: IVProjectStrings = useSelector(vProjectSelector, shallowEqual);

  return (
    <Options
      label={t.type}
      defaultValue={type}
      options={planTypes
        .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
        .map((t) => t.attributes.name.toLowerCase())}
      onChange={onChange}
      pt={1}
    />
  );
};
