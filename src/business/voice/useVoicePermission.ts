import React from 'react';
import { IVoicePerm } from './PersonalizeVoicePermission';
import { IVoiceStrings, Organization } from '../../model';
import { voicePermOpts } from './PersonalizeVoicePermission';
import { ILanguage } from '../../control';
import { shallowEqual, useSelector } from 'react-redux';
import { voiceSelector } from '../../selector';
const owner = require('../../../package.json').author.name;

interface IVoicePermission {
  permissionState: IVoicePerm;
  team?: Organization;
}

export const useVoicePermission = ({
  permissionState: permState,
  team,
}: IVoicePermission) => {
  const [permStatement, setPermStatement] = React.useState('');
  const t: IVoiceStrings = useSelector(voiceSelector, shallowEqual);

  React.useEffect(() => {
    const cats = [];

    const teamName = team
      ? t.stTeam.replace('{0}', team?.attributes.name)
      : t.stThisTeam;

    const sponsorOrg = permState?.sponsor ?? owner;

    if (permState?.gender)
      cats.push(t.stGender.replace('{0}', permState.gender ?? t.stNotGiven));
    if (permState?.age)
      cats.push(t.stAge.replace('{0}', permState.gender ?? t.stNotGiven));
    const catMsg =
      cats.length > 0
        ? t.stCategories.replace('{0}', cats.join(` ${t.stJoin} `)) + ' '
        : '';

    const langCnt = JSON.parse(permState?.languages ?? '[]')?.length;
    const langList = JSON.parse(permState?.languages ?? '[]').map(
      (l: ILanguage) => `${l.languageName} (${l.bcp47})`
    );
    const langStr =
      langCnt > 1
        ? langList.slice(0, -1).join(', ') +
          ` ${t.stJoin} ${langList.slice(-1)}`
        : langCnt > 0
        ? langList[0]
        : 'English';
    const langUse =
      permState?.scope === voicePermOpts[1]
        ? langCnt > 0
          ? t.stLangClause
              .replace('{0}', sponsorOrg)
              .replace(
                '{1}',
                `${langCnt > 1 ? t.stMyLangs : t.stMyLang} ${langStr}`
              )
          : ''
        : t.stTeamClause.replace('{0}', teamName);

    const compensated = permState?.hired ? t.stHired : t.stVolunteer;

    setPermStatement(
      t.stStatement
        .replace('{0}', permState?.fullName ?? '')
        .replace(/\{1}/g, sponsorOrg)
        .replace('{2}', catMsg)
        .replace('{3}', langUse)
        .replace('{4}', compensated)
        .replace('{4}', permState?.fullName ?? t.stNotIdentified)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permState, team]);

  return { permStatement };
};
