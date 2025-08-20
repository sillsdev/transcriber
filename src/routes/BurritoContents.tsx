import { useLocation, useParams } from 'react-router-dom';
import React from 'react';
import StickyRedirect from '../components/StickyRedirect';
import { BurritoOption } from '../burrito/BurritoOption';
import { pad2 } from '../utils';
import { useOrgDefaults } from '../crud/useOrgDefaults';
import { BurritoHeader } from '../components/BurritoHeader';

export const burritoContents = 'burritoContents';

export enum BurritoType {
  Audio = 'Audio',
  Timing = 'Timing',
  Text = 'Text',
  BackTranslation = 'Back translation',
  WholeBackTranslation = 'Whole Back Translation',
  CommunityQuestions = 'Community Questions',
  CommunityRetelling = 'Community Retelling',
  Navigation = 'Navigation',
  Discussions = 'Discussions',
  IntellectualProperty = 'Intellectual Property',
  Terms = 'Terms',
  Resources = 'Resources',
  SharedResources = 'Shared Resources',
  Notes = 'Notes',
  Status = 'Status',
}

const contents = Object.values(BurritoType);

export function BurritoContents() {
  const { pathname } = useLocation();
  const { teamId } = useParams();
  const [view, setView] = React.useState('');
  const [checked, setChecked] = React.useState<string[]>([]);
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();

  const handleSave = () => {
    setOrgDefault(burritoContents, checked, teamId);
    setView(`/burrito/${teamId}`);
  };

  React.useEffect(() => {
    if (teamId) {
      if (teamId) {
        const curContents = getOrgDefault(burritoContents, teamId);
        if (curContents) {
          setChecked(curContents);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <BurritoHeader
      burritoType={'Contents'}
      setView={setView}
      teamId={teamId}
      onSave={handleSave}
      saveDisabled={checked.length === 0}
    >
      <BurritoOption
        options={contents.map((content, index) => ({
          label: `${pad2(index + 1)} - ${content}`,
          value: content,
        }))}
        value={checked}
        onChange={(value) => setChecked(value)}
      />
    </BurritoHeader>
  );
}
