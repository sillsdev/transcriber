import { useState, useRef, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { isElectron } from '../api-variable';
import { launch } from '../utils';

export type LaunchFn = (target: string) => void;

interface IProps {
  register: (fn?: LaunchFn) => void;
  finish: () => void;
}
export function ExternalLink(props: IProps) {
  const { register, finish } = props;
  const [isOffline] = useGlobal('offline');
  const externalRef = useRef<any>();
  const [externalUrl, setExternalUrl] = useState<string>('#');

  const handleLaunch = (target: string) => {
    if (isElectron) {
      launch(target, !isOffline);
    } else {
      setExternalUrl(target);
    }
  };

  useEffect(() => {
    register(handleLaunch);
    return () => {
      register(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (externalRef.current && externalUrl !== '#') {
      externalRef.current.click();
      setExternalUrl('#');
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalUrl]);

  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      ref={externalRef}
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
    ></a>
  );
}
