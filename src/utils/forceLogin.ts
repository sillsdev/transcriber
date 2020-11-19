export function forceLogin() {
  localStorage.removeItem('auth-id');
  localStorage.removeItem('user-id');
}
