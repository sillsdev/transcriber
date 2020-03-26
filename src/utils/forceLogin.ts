export function forceLogin() {
  localStorage.removeItem('user-token');
  localStorage.removeItem('user-id');
}
