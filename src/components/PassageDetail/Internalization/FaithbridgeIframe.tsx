import React, { useContext, useState } from 'react';
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
import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import { remoteId } from '../../../crud';
import { RecordKeyMap } from '@orbit/records';
import { FaithBridge } from '../../../assets/brands';
import { Typography } from '@mui/material';
import { useStepPermissions } from '../../../utils/useStepPermission';
import { AlertSeverity, useSnackBar } from '../../../hoc/SnackBar';
import { axiosGet } from '../../../utils/axios';
import { TokenContext } from '../../../context/TokenProvider';
import { AquiferContent } from './FindAquifer';

interface IFaithbridgeIframeProps {
  onMarkdown: (query: string, audioUrl: string, transcript: string) => void;
  onClose?: () => void;
}

export const FaithbridgeIframe = ({
  onMarkdown,
  onClose,
}: IFaithbridgeIframeProps) => {
  const [chat, setChat] = useState<string | null>(null);
  const [verseRef, setVerseRef] = useState<string | null>(null);
  const [userId] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [errorReporter] = useGlobal('errorReporter');
  const [connected, setConnected] = useState(false);
  const checkOnline = useCheckOnline(FaithBridge);
  const [audio, setAudio] = useState(!offlineOnly && !isOffline);
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);
  const { passage, currentstep, section } = usePassageDetailContext();
  const t: IFaithbridgeStrings = useSelector(faithbridgeSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [apiReset, setApiReset] = useState(0);
  const { data, loading, error, fetchResult } = useFaithbridgeResult(apiReset);
  const [fetching, setFetching] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [onlineMsg, setOnlineMsg] = useState<string | null>(null);
  const { canDoSectionStep } = useStepPermissions();
  const hasPermission = canDoSectionStep(currentstep, section);
  const { showMessage } = useSnackBar();
  const onlineTimer = React.useRef<NodeJS.Timeout | null>(null);
  const token = useContext(TokenContext).state.accessToken ?? '';

  const getNewChat = () => {
    const newChatId = generateUUID();
    setChat(newChatId);
    setApiReset((prev) => prev + 1);
  };

  const userRemoteId = React.useMemo(
    () => remoteId('user', userId, memory.keyMap as RecordKeyMap),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  const handleAddContent = () => {
    if (chat && verseRef && userId) {
      setFetching(true);
      fetchResult(chat, userRemoteId || userId, audio);
    }
  };

  React.useEffect(() => {
    getNewChat();
    checkOnline((result) => {
      setConnected(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (onlineTimer.current) {
      clearTimeout(onlineTimer.current);
      onlineTimer.current = null;
    }
    if (!connected) {
      onlineTimer.current = setTimeout(
        () => setOnlineMsg(ts.mustBeOnline),
        1000
      );
    } else {
      setOnlineMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  React.useEffect(() => {
    setVerseRef(
      `${passage?.attributes?.book || 'MAT'} ${
        passage?.attributes?.reference || '1:1'
      }`
    );
  }, [passage]);

  React.useEffect(() => {
    if (chat && verseRef && userId) {
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
      showMessage(t.updating, AlertSeverity.Info);
      const contentIds = (data?.messages?.[1]?.sources || []).map(
        (s) => s.source_origin?.service_id || ''
      );

      const contentPromises = contentIds.map((contentId) => {
        return axiosGet(
          `aquifer/content/${contentId}`,
          new URLSearchParams({
            contentId,
          }),
          token
        );
      });
      const query = (data?.messages?.[0]?.content || '').split('(')[0].trim();
      let responseContent = data?.messages?.[1]?.content || '';
      responseContent = responseContent
        .replace(
          /<img\b[^>]*\b(src|alt)="([^"]*)"[^>]*\b(alt|src)="([^"]*)"[^>]*>/g,
          (_match, attr1, val1, _attr2, val2) =>
            attr1 === 'alt' ? `![${val1}](${val2})` : `![${val2}](${val1})`
        )
        // fallback for images without alt attribute
        .replace(/<img[^>]*src="([^"]*)"[^>]*>/g, '![image]($1)')
        .replace(
          /<video.*\n?.* src="([^"]*)".*\n?.*\n?.*<\/video>/g,
          '[video]($1)'
        );
      Promise.all(contentPromises)
        .then((responses: AquiferContent[]) => {
          const contents = responses.map((response) => {
            return `- ${response.name} (${response.grouping.name})`;
          });
          let allContents = contents.join('\n');
          if (allContents) allContents = `\n\n**Sources**:\n\n${allContents}`;
          onMarkdown(
            query,
            data?.messages?.[1]?.audioUrl || '',
            responseContent + allContents
          );
          setFetching(false);
          onClose?.();
        })
        .catch((reason) => {
          console.log('content failed', reason);
          onMarkdown(
            query,
            data?.messages?.[1]?.audioUrl || '',
            responseContent
          );
          setFetching(false);
          onClose?.();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, audio, token]);

  React.useEffect(() => {
    if (error) {
      console.log('Faithbridge error:', error);
      if (/404/.test(error || '')) showMessage(t.noInfo, AlertSeverity.Warning);
      if (refresh < 5) setRefresh(refresh + 1);
      else {
        logError(Severity.error, errorReporter, error);
      }
    } else {
      if (refresh !== 0) setRefresh(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  React.useEffect(() => {
    if ((offlineOnly || isOffline) && audio) {
      setAudio(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly, isOffline, audio]);

  return connected ? (
    <>
      <iframe
        src={`https://faithbridge.multilingualai.com/apm?${
          urlParams ? urlParams.toString() : ''
        }`}
        title={FaithBridge}
        style={{ width: '100%', height: '600px', border: 'none' }}
        allowFullScreen
        allow="microphone; clipboard-write"
      />
      {loading && <div>{t.loading}</div>}
      <ActionRow>
        {!offlineOnly && !isOffline && (
          <FormControlLabel
            control={
              <Checkbox
                checked={audio}
                onChange={(_ev, checked) => setAudio(checked)}
              />
            }
            label={t.audioResources}
          />
        )}
        <GrowingSpacer />
        <AltButton
          disabled={fetching}
          onClick={getNewChat}
          sx={{ height: 'fit-content', alignSelf: 'center' }}
        >
          {t.newChat}
        </AltButton>
        {hasPermission && (!isOffline || offlineOnly) ? (
          <Stack sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <PriButton disabled={fetching} onClick={handleAddContent}>
              {t.addContent.replace('{0}', audio ? t.audio : t.text)}
            </PriButton>
            {!/404/.test(error || '') ? (
              error && (
                <div>
                  {t.error} {error}
                </div>
              )
            ) : (
              <></>
            )}
          </Stack>
        ) : (
          <></>
        )}
      </ActionRow>
    </>
  ) : (
    <Typography variant="h6">{onlineMsg}</Typography>
  );
};

export default FaithbridgeIframe;
