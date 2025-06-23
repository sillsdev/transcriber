import React from 'react';
import { generateUUID } from '../../../utils';
import { ActionRow } from '../../../control/ActionRow';
import { AltButton } from '../../../control/AltButton';
import { PriButton } from '../../../control/PriButton';
import { shallowEqual, useSelector } from 'react-redux';
import { IFaithbridgeStrings } from '../../../model';
import { faithbridgeSelector } from '../../../selector';
import { useGlobal } from '../../../context/GlobalContext';
import { useFaithbridgeResult } from './useFaithbridgeResult';

interface FaithbridgeIframeProps {
  book: string;
  reference: string;
}

export const FaithbridgeIframe = ({
  book,
  reference,
}: FaithbridgeIframeProps) => {
  const [chat, setChat] = React.useState<string | null>(null);
  const [verseRef, setVerseRef] = React.useState<string | null>(null);
  const [userId] = useGlobal('user');
  const t: IFaithbridgeStrings = useSelector(faithbridgeSelector, shallowEqual);
  const { data, loading, error, fetchResult } = useFaithbridgeResult();

  const getNewChat = () => {
    const newChatId = generateUUID();
    setChat(newChatId);
  };

  const handleAddContent = () => {
    if (chat && verseRef && userId) {
      fetchResult(chat, verseRef, userId);
    }
  };

  React.useEffect(() => {
    getNewChat();
  }, []);

  React.useEffect(() => {
    setVerseRef(`${book} ${reference}`);
  }, [book, reference]);

  return (
    <>
      <iframe
        src={`https://faithbridge.multilingualai.com/apm?chatSessionId=${chat}`}
        title="Faithbridge"
        style={{ width: '100%', height: '600px', border: 'none' }}
        allowFullScreen
      />
      {loading && <div>Loading result...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>Result: {JSON.stringify(data)}</div>}
      <ActionRow>
        <AltButton onClick={getNewChat}>{t.newChat}</AltButton>
        <PriButton onClick={handleAddContent}>{t.addContent}</PriButton>
      </ActionRow>
    </>
  );
};

export default FaithbridgeIframe;
