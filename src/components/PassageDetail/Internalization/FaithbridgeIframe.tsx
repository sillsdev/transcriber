import React from 'react';
import { ActionRow, PriButton } from '../../StepEditor';

export const FaithbridgeIframe: React.FC = () => {
  return (
    <>
      <iframe
        src="https://faithbridge.multilingualai.com/apm"
        title="Faithbridge"
        style={{ width: '100%', height: '600px', border: 'none' }}
        allowFullScreen
      />
      <ActionRow>
        <PriButton>Add Content as Resource</PriButton>
      </ActionRow>
    </>
  );
};

export default FaithbridgeIframe;
