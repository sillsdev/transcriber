import React from 'react';
import { Redirect } from 'react-router-dom';

interface IProps {
  to: string;
}

export const StickyRedirect = ({ to }: IProps) => {
  localStorage.setItem('fromUrl', to);
  return <Redirect to={to} />;
};
