# web-transcriber-admin

This project builds a front end web app and an electron app for desktop use. It was bootstrapped with [Create React App](https://github.com/facebook/create-react-app) and [craco](https://github.com/wwlib/cra-craco-electron-example) which enables file access using create-react-app. `Create-react-app` will manage dependency updates and web packaging.

## Installation

Clone the app, go to the project directory, and execute:

1. `npm install`
2. `npm run stamp` _# this creates a file with the date to display in the version_
3. If this is the first time installing, you will want to `amplify init` (see Amplify below)
4. Get a copy of the `env-files-transcriber.zip` from a team member and unzip it into the `env-config` folder (see configuration below)
5. Optionally rebuild the localization `string.json` file (see below)
6. `npm run build`

### Visual Studio for (`strings.json` file)

You can use Visual Studio to build `updateLocalization.sln` (in the localization folder). This file will process the `xliff` and `xlf` files to add the `strings.json` and the localizaiton reducer and model to the source tree. It requires `.NET Framework` to execute XSLT 2.0 stylesheets. When you first load it, you need to make sure the nuget dependencies are up to date.

1. get the latest localization strings from crowdin (see below)
2. `cd localization\bin\Debug` 
3. execute `updateLocalization.exe`

> NB. You may want ot download the strings from the [crowdin site](https://crowdin.com/project/sil-transcriber) and unzip the file in the localization folder before executing this command to get all the latest localization strings included.

## Running Locally

### Amplify

Install _amplify-cli_:

- `npm install -g @aws-amplify/cli`

The deployment configuration commands (e.g., `npm run dev`) require a configured _amplify_ environment. (See also: `npm run deploySetup`.) This will require an _AWS_ keyset and two configuration files:

```
mkdir ~/.aws
touch ~/.aws/credentials
touch ~/.aws/config
```

Add your keyset to the _.aws/credentials_ file as follows:

```
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[transcriber]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Then, paste the following into _~/.aws/config_:

```
[default]
region=us-east-2
output=json

[transcriber]
region=us-east-1
output=json
```

Initialize Amplify:

- `amplify init`

Follow the prompts as appropriate. If the `~/.aws` folder is configured correctly, you'll eventually be presented with these two options:

```
? Do you want to use an AWS profile? [Yes]
? Please choose the profile you want to use [transcriber]
```

>NB: After running `amplify init` it is wise to check out any files it has changed in your repo. It does not need to change the files that are checked in.

### Configuration

Three files are needed to create _dev_ environment configurations:

- _env-config/.env.dev.development.local_
- _env-config/.env.dev.local_
- _env-config/.auth0-variables.dev.json_
  
Example _env-config/.env.dev.development.local_:

```
REACT_APP_ENDPOINT= (url of app)
REACT_APP_HOST= (url of host api)
REACT_APP_HELP= (url of help online)
REACT_APP_COMMUNITY= (url of site for community discussion)
REACT_APP_FLAT= (url of Scripture flat spreadsheet sample)
REACT_APP_HIERARCHICAL= (url of Scripture hierarchical spreadsheet sample)
REACT_APP_GEN_FLAT= (url of general flat spreadsheet sample)
REACT_APP_GEN_HIERARCHICAL= (url of general hierarchical spreadsheet sample)
REACT_APP_SNAGID=(bugsnag client id)

REACT_APP_OFFLINE_not=true
BROWSER=none
REACT_APP_CALLBACK=http://localhost:3000/callback
REACT_APP_SITE_TITLE=SIL Transcriber DEV
```

Example _env-config/.env.dev.local_:

```
REACT_APP_CALLBACK= (url of app followed by /callback)
REACT_APP_ENDPOINT= (url of app)
REACT_APP_HOST= (url of host api)
REACT_APP_HELP= (url of help online)
REACT_APP_COMMUNITY= (url of site for community discussion)
REACT_APP_FLAT= (url of Scripture flat spreadsheet sample)
REACT_APP_HIERARCHICAL= (url of Scripture hierarchical spreadsheet sample)
REACT_APP_GEN_FLAT= (url of general flat spreadsheet sample)
REACT_APP_GEN_HIERARCHICAL= (url of general hierarchical spreadsheet sample)
REACT_APP_SITE_TITLE= (title for browser tab)
REACT_APP_SNAGID=(bugsnag client id)
```
Example _env-config/auth0-variables.dev.json_

```
{
  "apiIdentifier": "(auth0 api audience)",
  "auth0Domain": "(url of auth0 domain)",
  "desktopId": "(auth0 desktop extension -- native client id)",
  "webClientId": "(auth0 spa client id)"
}
```
### Generate dev configuration files

Having created or obtained the _.env.\*_ files listed above, generate the environment-appropriate _.env.development.local_, _.env.local_ and auth0-variables.json files by executing the following:

- `npm run dev`

> NB. You can use _qa_ or _prod_ in place of _dev_ in the command above depending on which environment you want to test with although localhost is only setup by default on the _dev_ environment as a valid source and callback. If you want to add it to the qa channel or the prod channel, you will need to add it in the auth0 console before using it with `npm start`

## Execute app

- `npm start` _# break points can be set in *vscode*_

> NB. From _VsCode_ you can launch the debugger with _F5_. The first time you will need to choose the option.

## Deployment

The `npm run dev`, `npm run qa` and `npm run prod` commands configure the app to deploy to _dev_, _qa_, or _prod_ respectively. There are separate urls and separate _AWS S3_ buckets for each of these deployments. Once configuration files have been generated, execute the following to deploy the app:

`npm run deploy`

As with the _dev_ configuration above (see the example _.env.development.local_), _qa_ (quality assuarance) deployment requires _.env.qa.development.local_ and _.env.qa.local_ in the root project directory. As above, the `npm run qa` command will use these two files to over write _.env.development.local_ and _.env.local_ so the `npm run deploy` command will properly deploy to the _qa_ environment.

# Electron (Desktop) app

The steps above regarding _installation_ and setting up the environments are also applicable to the _Electron (Desktop)_ app.

## Electron Development

Selecting Electron: All from the drop down and clicking the "play" icon in the _Visual Studio Code_ editor will allow you to run the program and stop at breakpoints to check values.

Sometimes it is possible to include Chrome Extensions in the embedded Chrome browser in [Electron](www.electronjs.org/). If this works for you, you will need to include the `chromeExtensions.js` function in the `public` folder. This is the contents of that file:

```javascript
const electronExtension = (BrowserWindow) => {
  const path = require("path");
  const os = require("os");
  BrowserWindow.addDevToolsExtension(
    path.join(
      os.homedir(),
      "/AppData/Local/Google/Chrome/User Data/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/4.10.1_0"
    )
  );
  BrowserWindow.addDevToolsExtension(
    path.join(
      os.homedir(),
      "/AppData/Local/Google/Chrome/User Data/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/3.3_0"
    )
  );
};
module.exports = electronExtension;
```

- `npm run electron-dev` _# launches electron in developer mode_

> NB. This `dev` mode uses two Chrome extensions: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) and [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

## Creating installer

1. `npm run clean` _# remove previous builds_
2. `npm run electron-pack`
3. `npm run dist`

The _dist_ command creates a folder in the dist folder with an executable that can be launched directly by clicking on it. it also creates an installer in the _dist_ folder that can be distributed.

## creating the Linux .deb package

To get setup to do this on you Linux installations you will need:

- `sudo apt-get -a install devscripts debhelper autotools-dev`

The electron-builder program doesn't include the icon as part of the .deb package. It also doesn't install the help file reader. In order to create a more complete .deb package for Linux, use this command:

- `bash src/script/makeDeb.sh 2.0.8.4`

where `2.0.8.4` is replaced with the latest version number corresponding to the version in the package.json file. The version number in this command is used in naming the file and must agree with the version in the `debian/changes` file and in `debian/control`. The .deb created by this command bundles source and binary into the .deb to create a complete package. The package will still need to be signed and deployed to `package.sil.org`.

## Test suite

To execute the tests included with the program, use the standard test suite:

```
npm test
```
