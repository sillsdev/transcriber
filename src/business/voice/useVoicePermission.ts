import React from 'react';
import { IVoicePerm } from './PersonalizeVoicePermission';
import { Organization } from '../../model';
import { voicePermOpts } from './PersonalizeVoicePermission';

interface IVoicePermission {
  permissionState: IVoicePerm;
  team?: Organization;
}

export const useVoicePermission = ({
  permissionState: permState,
  team,
}: IVoicePermission) => {
  const [permStatement, setPermStatement] = React.useState('');

  React.useEffect(() => {
    const cats = [];

    const teamName = team ? `the ${team?.attributes.name} team` : 'this team';

    const sponsorOrg = permState?.sponsor ?? 'SIL Global';

    if (permState?.gender)
      cats.push(`my gender is ${permState.gender ?? 'not going to be given'}`);
    if (permState?.age) cats.push(`my age is ${permState.age ?? 'not given'}`);
    const catMsg =
      cats.length > 0
        ? `To aid in categorizing my voice for use, ${cats.join(' and ')}.`
        : '';

    const langPl =
      (permState?.languages?.indexOf(' ') ?? -1) >= 0
        ? 'The languages that I speak are'
        : 'The language I speak is';
    const langUse =
      permState?.scope === voicePermOpts[1]
        ? `${catMsg} I understand that ${
            permState?.sponsor ?? sponsorOrg
          } will only use my voice with languages I do not regularly use, to prevent impersonation. ${langPl} ${
            permState?.languages ?? 'English'
          }.`
        : `I understand the my voice can be used by ${teamName} for any or all of its projects on audio files for the vernacular language, navigation language or any back translation languages.`;

    const compensated = permState?.hired
      ? 'Since I am being compendated for this work, my voice can be used by the team without additional compensation.'
      : 'I understand that I will not be compensated for the use of my voice.';

    setPermStatement(
      `I ${permState?.fullName ?? ''} provide consent for ${
        permState?.sponsor ?? sponsorOrg
      } to record and store this file with my voice the cloud and possibly in a voice library for publishing and use in AI applications that require a voice sample, including voice conversion. The recording created by ${
        permState?.sponsor ?? sponsorOrg
      } of me reading this script will become the exclusive property of ${
        permState.sponsor ?? sponsorOrg
      } which shall have the unlimited right to make, have made, use, copy, display in public, reconstruct, repair, modify, reproduce, publish, distribute and sell the Work Product, in whole or in part, or combine the Work Product with other matter, or not use the Work Product at all, as it sees fit. ${
        permState?.sponsor ?? sponsorOrg
      } will use the recording in a variety of ways, including, but not limited to, Audio books, narrating apps, and scripture engagement to further the mission of the organization. ${langUse} I have been provided this script in a language I understand, and have been given the option to request this script in a language of my choice. This recording will act as my signature in place of a written agreement. ${compensated} I sign with my voice, ${
        permState?.fullName ?? 'but choose not to be identified by name'
      }.`
    );
  }, [permState, team]);

  return { permStatement };
};
