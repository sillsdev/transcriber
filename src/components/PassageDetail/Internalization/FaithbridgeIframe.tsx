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
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { GrowingSpacer } from '../../../control/GrowingSpacer';
import { Checkbox, FormControlLabel } from '@mui/material';
import { remoteId } from '../../../crud';
import { RecordKeyMap } from '@orbit/records';
import { FaithBridge } from '../../../assets/brands';

export const FaithbridgeIframe = () => {
  const [chat, setChat] = React.useState<string | null>(null);
  const [verseRef, setVerseRef] = React.useState<string | null>(null);
  const [userId] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [audio, setAudio] = React.useState(true);
  const [urlParams, setUrlParams] = React.useState<URLSearchParams | null>(
    null
  );
  const { passage } = usePassageDetailContext();
  const t: IFaithbridgeStrings = useSelector(faithbridgeSelector, shallowEqual);
  const { data, loading, error, fetchResult } = useFaithbridgeResult();

  const getNewChat = () => {
    const newChatId = generateUUID();
    setChat(newChatId);
  };

  const handleAddContent = () => {
    if (chat && verseRef && userId) {
      fetchResult(chat, userId, audio);
    }
  };

  React.useEffect(() => {
    getNewChat();
  }, []);

  React.useEffect(() => {
    setVerseRef(
      `${passage?.attributes?.book || 'MAT'} ${
        passage?.attributes?.reference || '1:1'
      }`
    );
  }, [passage]);

  React.useEffect(() => {
    if (chat && verseRef && userId) {
      const userRemoteId = remoteId(
        'user',
        userId,
        memory.keyMap as RecordKeyMap
      );
      const params = new URLSearchParams({
        chatSessionId: chat,
        verseRef: verseRef ?? '',
        userId: userRemoteId ?? '',
      });
      setUrlParams(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, verseRef, userId]);

  return (
    <>
      <iframe
        src={`https://faithbridge.multilingualai.com/apm?${
          urlParams ? urlParams.toString() : ''
        }`}
        title={FaithBridge}
        style={{ width: '100%', height: '600px', border: 'none' }}
        allowFullScreen
      />
      {loading && <div>Loading result...</div>}
      {error && <div>Error: {error}</div>}
      {data && <div>Result: {JSON.stringify(data)}</div>}
      <ActionRow>
        <FormControlLabel
          control={
            <Checkbox
              defaultChecked
              value={audio}
              onChange={(_ev, checked) => setAudio(checked)}
            />
          }
          label={t.audioResources}
        />
        <GrowingSpacer />
        <AltButton onClick={getNewChat}>{t.newChat}</AltButton>
        <PriButton onClick={handleAddContent}>{t.addContent}</PriButton>
      </ActionRow>
    </>
  );
};

export default FaithbridgeIframe;
