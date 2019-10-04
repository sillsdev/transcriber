web-transcriber-admin
=====================

A `react` web app for Transcriber administration

## Installation

Clone the app, go to the project directory, and execute:

```
npm install
npm run stamp # this creates a file with the date to display in the version
```

Building the project will determine if all dependencies have been met: 

```
npm run build
```

### Visual Studio

You can use Visual Studio to build `updateLocalization.sln` (in the localization folder). This file will process the `xliff` and `xlf` files to add the `strings.json` and the localizaiton reducer and model to the source tree. It requires `.NET Framework` to execute XSLT 2.0 stylesheets.

## Running Locally

Create a file called `.env.development.local` in the root project directory:

```
REACT_APP_DOMAIN= (url of auth0 domain)
REACT_APP_CLIENTID= (auth0 client id)
REACT_APP_LOGINAPP= (url of login app)
REACT_APP_MYACCOUNTAPP= (url of my account app)
REACT_APP_NEWORGAPP= (url of new org app page)
REACT_APP_IDENTITY= (url of identity api - not yet in use)
REACT_APP_HOST= (url of host api)
REACT_APP_HELP= (url of help online)
REACT_APP_COMMUNITY= (url of site for community discussion)

REACT_APP_OFFLINE_not=true
BROWSER=none
REACT_APP_CALLBACK=localhost:3000/callback
REACT_APP_APPMODE=true
REACT_APP_SITE_TITLE=SIL Transcriber Admin
```

### Amplify 

Install `amplify-cli`:

```
npm install -g @aws-amplify/cli
```

The `npm run dev` command (see below) expects there to be an `amplify/dev` folder containing `amplify-meta.json` and `parameters.json`. These files are written into the `amplify` folder structure at the appropriate points to make the `npm run deploy` command work. Similary there is a `amplify/qa` folder with the same two files with contents for the qa environment.

### .env 

For development you will need 2 context files: `.env.dev.development.local` and `.env.dev.local` (cf., above). With these files, you will create the environment-appropriate `.env.development.local` and `.env.local` files by executing the following:

```
npm run dev
```

Execute app:

```
npm start
```

## Deployment

The `npm run dev` and `npm run qa` commands configure the app to deploy to `dev` or `qa`, respectively. Once configuration files have been generated, execute the following to deploy the app:

```
npm run deploy
```

As with the _dev_ configuration above (see the example `.env.development.local`), _qa_ (quality assuarance) deployment requires `.env.qa.development.local` and `.env.qa.local` in the root project directory. As above, the `npm run qa` command will use these two files to over write `.env.development.local` and `.env.local` so the `npm run deploy` command will properly deploy to the _qa_ environment.

## Test suite

To execute the tests included with the program, use the standard test suite:

```
npm test
```

## Debugging

After using

```
npm start
```

from code you can use the debugger if you set the `.vscode/launch.json configurations.url` to `http://localhost:3000`.

