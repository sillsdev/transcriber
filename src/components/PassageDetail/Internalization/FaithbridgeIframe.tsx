import React from 'react';
import {
  generateUUID,
  logError,
  Severity,
  useCheckOnline,
} from '../../../utils';
import { ActionRow } from '../../../control/ActionRow';
import { AltButton } from '../../../control/AltButton';
import { PriButton } from '../../../control/PriButton';
import { shallowEqual, useSelector } from 'react-redux';
import { IFaithbridgeStrings, ISharedStrings } from '../../../model';
import { faithbridgeSelector, sharedSelector } from '../../../selector';
import { useGlobal } from '../../../context/GlobalContext';
import { useFaithbridgeResult } from './useFaithbridgeResult';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { GrowingSpacer } from '../../../control/GrowingSpacer';
import { Checkbox, FormControlLabel } from '@mui/material';
import { remoteId, useRole } from '../../../crud';
import { RecordKeyMap } from '@orbit/records';
import { FaithBridge } from '../../../assets/brands';
import { Typography } from '@mui/material';

interface IFaithbridgeIframeProps {
  onMarkdown?: (value: string, audio: boolean) => void;
  onClose?: () => void;
}

export const FaithbridgeIframe = ({
  onMarkdown,
  onClose,
}: IFaithbridgeIframeProps) => {
  const [chat, setChat] = React.useState<string | null>(null);
  const [verseRef, setVerseRef] = React.useState<string | null>(null);
  const [userId] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [errorReporter] = useGlobal('errorReporter');
  const [connected, setConnected] = React.useState(false);
  const { userIsAdmin } = useRole();
  const checkOnline = useCheckOnline(FaithBridge);
  const [audio, setAudio] = React.useState(true);
  const [urlParams, setUrlParams] = React.useState<URLSearchParams | null>(
    null
  );
  const { passage } = usePassageDetailContext();
  const t: IFaithbridgeStrings = useSelector(faithbridgeSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const { data, loading, error, fetchResult } = useFaithbridgeResult();
  const [refresh, setRefresh] = React.useState(0);

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
    checkOnline(setConnected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  React.useEffect(() => {
    if (data) {
      console.log('Faithbridge data received:', data);
      onMarkdown &&
        onMarkdown(
          audio
            ? data?.lastMessage?.audioUrl || ''
            : data?.lastMessage?.content || '',
          audio
        );
      onClose?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, audio]);

  React.useEffect(() => {
    if (error) {
      console.log('Faithbridge error:', error);
      if (refresh < 5) setRefresh(refresh + 1);
      else {
        logError(Severity.error, errorReporter, error);
      }
    } else {
      if (refresh !== 0) setRefresh(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return connected ? (
    <>
      <iframe
        src={`https://faithbridge.multilingualai.com/apm?${
          urlParams ? urlParams.toString() : ''
        }`}
        title={FaithBridge}
        style={{ width: '100%', height: '600px', border: 'none' }}
        allowFullScreen
        allow="microphone"
      />
      {loading && <div>{t.loading}</div>}
      {error && (
        <div>
          {t.error} {error}
        </div>
      )}
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
        {userIsAdmin && (!isOffline || offlineOnly) ? (
          <PriButton onClick={handleAddContent}>{t.addContent}</PriButton>
        ) : (
          <></>
        )}
      </ActionRow>
    </>
  ) : (
    <Typography variant="h6">{ts.mustBeOnline}</Typography>
  );
};

export default FaithbridgeIframe;
