const isElectron = process.env.REACT_APP_MODE === 'electron';
export const appPath = () => (isElectron ? '.' : '');
export default appPath;
