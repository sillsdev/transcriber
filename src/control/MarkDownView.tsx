import React from 'react';
import MarkDown from 'react-markdown';
import remarkGfm from 'remark-gfm';
const ipc = (window as any)?.electron;

interface MarkDownProps {
  value: string;
}

export function MarkDownView({ value }: MarkDownProps) {

  // adapted from https://stackoverflow.com/questions/31749625/make-a-link-from-electron-open-in-browser (zrbecker's)
  const handleClick = (event: any) => {
    if (event.target.tagName.toLowerCase() === 'a') {
      event.preventDefault();
      ipc?.openExternal(event.target.href);
    }
  };

  React.useEffect(() => {
    if (ipc) document.addEventListener('click', handleClick);

    return () => {
      if (ipc) document.removeEventListener('click', handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <MarkDown remarkPlugins={[remarkGfm]}>{value}</MarkDown>;
}
