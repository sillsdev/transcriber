/* eslint-disable jsx-a11y/anchor-has-content */
import React from 'react';
import { useGlobal } from 'reactn';
import { isElectron, API_CONFIG } from '../api-variable';
import { launch, launchCmd, execFolder } from '../utils';
import path from 'path-browserify';
const ipc = (window as any)?.electron;

const indexName = '/index.htm';

const helpLanguage = () => {
  // let language = navigator.language.split('-')[0];
  // if (!['fr', 'es'].includes(language)) language = 'en';
  // return language;
  return 'en';
};

interface IHelpLinkProps {
  topic: string | undefined;
  reset: () => void;
}

export function ContextHelp({ topic, reset }: IHelpLinkProps) {
  const [isOffline] = useGlobal('offline');
  const [showTopic, setShowTopic] = React.useState<string>();
  const [helpToggle, setHelpToggle] = React.useState(false);
  const helpRef = React.useRef<any>();

  React.useEffect(() => {
    (async () => {
      if (topic === undefined) return;
      const chmHelp = API_CONFIG.chmHelp;
      const helpUrl = API_CONFIG.help;
      const topicS = topic || '';
      const topicWin = topic && decodeURIComponent(topic.slice(3));
      if (isElectron) {
        const folder = await execFolder();
        // see https://stackoverflow.com/questions/22300244/open-a-chm-file-to-a-specific-topic
        if ((await ipc?.isWindows()) && topicWin && isOffline) {
          const target = `C:\\Windows\\hh.exe ${path.join(
            folder,
            chmHelp
          )}::${topicWin}`;
          launchCmd(target);
        } else if (topic && isOffline) {
          launchCmd(`xchm -c 1 ${path.join(folder, chmHelp)}`);
        } else {
          const target = isOffline
            ? path.join(folder, chmHelp)
            : helpUrl + '/' + helpLanguage() + indexName + topicS;
          launch(target, !isOffline);
        }
      } else if (helpRef.current) {
        setShowTopic(topic || '');
        setHelpToggle(!helpToggle);
      }
      reset();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpToggle, isOffline, topic]);

  React.useEffect(() => {
    if (helpRef.current && showTopic !== undefined) helpRef.current.click();
  }, [showTopic, helpToggle]);

  return (
    <a
      id="context-help"
      ref={helpRef}
      href={
        API_CONFIG.help + '/' + helpLanguage() + indexName + (showTopic ?? '')
      }
      target="_blank"
      rel="noopener noreferrer"
    ></a>
  );
}
