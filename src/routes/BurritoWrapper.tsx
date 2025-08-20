import { useLocation, useParams } from 'react-router-dom';
import React from 'react';
import StickyRedirect from '../components/StickyRedirect';
import { useOrgDefaults } from '../crud/useOrgDefaults';
import { BurritoHeader } from '../components/BurritoHeader';
import { MetadataView } from '../burrito/MetadataView';
import type { BurritoWrapper as BurritoWrapperType } from '../burrito/data/wrapperBuilder';
import { wrapperBuilder } from '../burrito/data/wrapperBuilder';
import { useOrbitData } from '../hoc/useOrbitData';
import { BibleD, OrganizationBibleD, OrganizationD, UserD } from '../model';
import related from '../crud/related';
import { burritoContents, BurritoType } from './BurritoContents';
import { Burrito } from '../burrito/data/wrapperBuilder';
import { AltButton } from '../control/AltButton';
const version = require('../../package.json').version;
const productName = require('../../package.json').build.productName;

export const burritoWrapper = 'burritoWrapper';

export function BurritoWrapper() {
  const { pathname } = useLocation();
  const { teamId } = useParams();
  const users = useOrbitData<UserD[]>('user');
  const teams = useOrbitData<OrganizationD[]>('organization');
  const teamBibles = useOrbitData<OrganizationBibleD[]>('organizationbible');
  const bibles = useOrbitData<BibleD[]>('bible');
  const [view, setView] = React.useState('');
  const [refresh, setRefresh] = React.useState(0);
  const [metaData, setMetaData] = React.useState<BurritoWrapperType>();
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();

  const handleSave = () => {
    setOrgDefault(burritoWrapper, metaData, teamId);
    setView(`/burrito/${teamId}`);
  };

  const handleRefresh = () => {
    setRefresh((prev) => prev + 1);
    setView('');
    setMetaData(undefined);
    setOrgDefault(burritoWrapper, undefined, teamId);
  };

  const burritoRole = (type: BurritoType) =>
    type === BurritoType.Audio
      ? 'source'
      : [
          BurritoType.Text,
          BurritoType.Timing,
          BurritoType.BackTranslation,
          BurritoType.WholeBackTranslation,
        ].includes(type)
      ? 'derived'
      : 'supplemental';

  React.useEffect(() => {
    if (teamId) {
      if (teamId) {
        const curContents = getOrgDefault(burritoWrapper, teamId);
        if (curContents) {
          setMetaData(curContents);
        } else if (users && teams && teamBibles && bibles) {
          const team = teams.find((t) => t.id === teamId);
          if (team) {
            // get Bible Info
            const teamBibleRec = teamBibles.find(
              (t) => related(t, 'organization') === teamId
            );
            const bibleId = related(teamBibleRec, 'bible');
            const bible = bibles.find((b) => b.id === bibleId);
            const abbreviation =
              bible?.attributes?.bibleId || `${bible?.attributes?.iso}New`;

            const curContents = getOrgDefault(burritoContents, teamId) as
              | string[]
              | undefined;
            const burritos =
              curContents?.map(
                (c: string) =>
                  ({
                    id: `${abbreviation}-${c}`,
                    path: c.toLocaleLowerCase(),
                    role: burritoRole(c as BurritoType),
                  } as Burrito)
              ) || [];

            setMetaData(
              wrapperBuilder({
                genName: productName,
                genVersion: version,
                name: `${
                  bible?.attributes?.bibleName || team?.attributes?.name
                } Burrito Wrapper`,
                abbreviation,
                description: `A new burrito wrapper for ${team?.attributes?.name}`,
                comments: '',
                burritos,
                alignments: [],
              })
            );
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, teams, users, teamBibles, bibles, refresh]);

  if (view !== '' && view !== pathname) {
    return <StickyRedirect to={view} />;
  }

  return (
    <BurritoHeader
      burritoType={'Wrapper'}
      setView={setView}
      teamId={teamId}
      onSave={handleSave}
      saveDisabled={!metaData}
      action={
        <AltButton onClick={handleRefresh} disabled={!metaData}>
          Refresh
        </AltButton>
      }
    >
      {metaData ? <MetadataView wrapper={metaData} /> : 'Loading...'}
    </BurritoHeader>
  );
}
