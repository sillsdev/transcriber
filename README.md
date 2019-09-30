# web-transcriber-admin
react web app for transcriber administration

To run...

## Installation

1. Install [nodejs](https://nodejs.org/en/download/)
2. Use `git clone` to get a local copy of the repository.
3. Use Visual Studio to build `updateLocalization.sln` (in the localization folder). This file will process the xliff and xlf files to add the `strings.json` and the localizaiton reducer and model to the source tree. It requires `.net Framework` to execute XSLT 2.0 style sheets.

```
npm install
npm run stamp (creates a file with the date to display in the version).
npm run build
```

## Running Locally

```
npm start
```

Createing a file called: .env.development.local with the contents:
```
REACT_APP_DOMAIN= (url of auth0 domain)
REACT_APP_CLIENTID= (auth0 client id)
REACT_APP_LOGINAPP= (url of login app)
REACT_APP_MYACCOUNTAPP= (url of my account app)
REACT_APP_NEWORGAPP= (url of new org app page)
REACT_APP_IDENTITY= (url of identity api - not yet in use)
REACT_APP_HOST= (url of host api)
REACT_APP_HELP= (url of help online)

REACT_APP_OFFLINE_not=true
BROWSER=none
REACT_APP_CALLBACK=localhost:3000/callback
```
allows the program to run offline with the content that was downloaded to your browser the last time you were online.

For development you will want 2 context files: `.env.dev.development.local` and `.env.dev.local`. The `npm run dev` command causes these two files to write over `.env.development.local` and `.env.local` respectively. This sets up the program to deploy to the dev environment using the `npm run deploy` command. Similarly for qa (quality assuarance) deployment, you will want `.env.qa.development.local` and `.env.qa.local`. The `npm run qa` command will use these two files to over write `.env.development.local` and `.env.local` so the `npm run deploy` command will deploy to the qa environment.

The `npm run dev` also expects there to be a `amplify/dev` folder containing `amplify-meta.json` and `parameters.json`. These files are written into the `amplify` folder structure at the appropriate points to make the `npm run deploy` command work. Similary there is a `amplify/qa` folder with the same two files with contents for the qa environment.

We also have `npm run appdev` and `npm run appqa` that allow you to deploy to the `app-dev.siltranscriber.org` and `app-qa.siltranscriber.org` end points. (You may want to get copies of the .env.*.local files from another team member on the project.)

## Test suite

To execute the tests included with the program, use the standard test suite.

```
npm test
```

## Debugging

After using
```
npm start
```
from code you can use the debugger if you set the .vscode/launch.json configurations.url to http://localhost:3000

## Deployment

You may want to use either `npm run dev` or `npm run qa` to choose the environment before you deploy. See the description of these commands above.

```
npm run deploy
```
