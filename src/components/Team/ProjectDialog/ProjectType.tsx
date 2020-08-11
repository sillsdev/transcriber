import React from 'react';
import ScriptureIcon from '@material-ui/icons/MenuBook';
import { BsPencilSquare } from 'react-icons/bs';
import { TeamContext } from '../../../context/TeamContext';
import { Options } from '.';

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
  const { planTypes, vProjectStrings } = ctx.state;
  const t = vProjectStrings;

  return (
    <Options
      required
      label={t.type}
      defaultValue={type}
      options={planTypes.map((t) => t.attributes.name.toLowerCase())}
      onChange={onChange}
      decorations={decorations}
    />
  );
};
