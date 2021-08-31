export function forceLogin() {
  localStorage.removeItem('auth-id');
  localStorage.removeItem('user-id');
  localStorage.removeItem('online-user-id');
}
