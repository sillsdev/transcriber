import Auth from '../auth/Auth';

export const lastTimeKey = (auth: Auth) => {
  const profileId = auth.getProfile()?.sub || ''
  return profileId.replace('|','-') + 'lastTime';
}
