import React from 'react';
import ScriptureIcon from '@mui/icons-material/MenuBook';
import { BsPencilSquare } from 'react-icons/bs';
import { TeamContext } from '../../../context/TeamContext';
import { Options } from '.';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';

const decorations = {
  scripture: <ScriptureIcon />,
  other: <BsPencilSquare />,
};

interface IProps {
  type: string;
  onChange: (type: string) => void;
}

export const ProjectType = (props: IProps) => {
  const { type, onChange } = props;
  const ctx = React.useContext(TeamContext);
  const { planTypes } = ctx.state;
  const t = useSelector(vProjectSelector, shallowEqual);

  return (
    <Options
      label={t.type}
      defaultValue={type}
      options={planTypes
        .sort((i, j) => (i.attributes.name <= j.attributes.name ? -1 : 1))
        .map((t) => t.attributes.name.toLowerCase())}
      onChange={onChange}
      decorations={decorations}
    />
  );
};
