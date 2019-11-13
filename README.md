web-transcriber-admin
=====================

A `react` web app for Transcriber administration

## Installation

Clone the app, go to the project directory, and execute:

```
npm install
npm run stamp # this creates a file with the date to display in the version
node src\components\LgPick\langPicker\makeIndexes.js # builds language indexes
```

Building the project to determine if all dependencies have been met:

```
npm run build
```

### Visual Studio

You can use Visual Studio to build `updateLocalization.sln` (in the localization folder). This file will process the `xliff` and `xlf` files to add the `strings.json` and the localizaiton reducer and model to the source tree. It requires `.NET Framework` to execute XSLT 2.0 stylesheets.

## Running Locally

### Amplify

Install `amplify-cli`:

```
npm install -g @aws-amplify/cli
```

The deployment configuration commands (e.g., `npm run dev`) require a configured `amplify` environment. This will require an AWS keyset and two configuration files:

```
mkdir ~/.aws
touch ~/.aws/credentials
touch ~/.aws/config
```

Add your keyset to the `.aws/credentials` file as follows:

```
[default]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[transcriber]
aws_access_key_id=AKIAIOSFODNN7EXAMPLE
aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

Then, paste the following into `~/.aws/config`:

```
[default]
region=us-east-2
output=json

[transcriber]
region=us-east-1
output=json
```

Initialize Amplify:

```
amplify init
```

Follow the prompts as appropriate. If the `~/.aws` folder is configured correctly, you'll eventually be presented with these two options:

```
? Do you want to use an AWS profile? [Yes]
? Please choose the profile you want to use [transcriber]
```

### Configuration

Two files are needed to create `dev` environment configurations:

- `.env.dev.development.local`
- `.env.dev.local`

Example `.env.appdev.development.local`:

```
REACT_APP_DOMAIN= (url of auth0 domain)
REACT_APP_CLIENTID= (auth0 client id)
REACT_APP_ADMIN_ENDPOINT= (url of admin app)
REACT_APP_APP_ENDPOINT= (url of app)
REACT_APP_HOST= (url of host api)
REACT_APP_HELP= (url of help online)
REACT_APP_COMMUNITY= (url of site for community discussion)

REACT_APP_OFFLINE_not=true
BROWSER=none
REACT_APP_CALLBACK=localhost:3000/callback
REACT_APP_APPMODE=true
REACT_APP_SITE_TITLE=SIL Transcriber Admin
```

Example `.env.dev.local`:

```
REACT_APP_DOMAIN= (url of auth0 domain)
REACT_APP_CLIENTID= (auth0 client id)
REACT_APP_ADMIN_ENDPOINT= (url of admin app)
REACT_APP_APP_ENDPOINT= (url of app)
REACT_APP_CALLBACK=localhost:3000/callback
REACT_APP_HOST= (url of host api)
REACT_APP_HELP= (url of help online)
REACT_APP_COMMUNITY= (url of site for community discussion)
REACT_APP_SITE_TITLE= (title for browser tab)
```

### Generate dev configuration files

Having created or obtained the `.env.*` files listed above, generate the environment-appropriate `.env.development.local` and `.env.local` files by executing the following:

```
npm run dev
```

## Execute app

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

