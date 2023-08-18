require('dotenv').config();
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  // Notarizing worked for a previous version but doesn't work now.
  if (electronPlatformName !== 'darwin' || true) {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  console.log(`  \u2022 notarizing ${appName}`)

  return await notarize({
    appBundleId: 'sil.lsdev.audio-project-manager',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: `${process.env.APPLEID}`,
    appleIdPassword: `${process.env.APPLEIDPASS}`,
  });
};
