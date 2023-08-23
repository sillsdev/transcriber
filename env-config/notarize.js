require('dotenv').config();
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  // Notarizing worked for a previous version but doesn't work now.
  if (
    electronPlatformName !== 'darwin' ||
    process.env.CSC_IDENTITY_AUTO_DISCOVERY === 'false'
  ) {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  console.log(`  \u2022 notarizing ${appName}`);

  return await notarize({
    tool: 'notarytool',
    appBundleId: 'sil.lsdev.audio-project-manager',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: `${process.env.APPLEID}`,
    appleIdPassword: `${process.env.APPLEIDPASS}`,
    teamId: `${process.env.APPLEIDTEAM}`,
  });
};
