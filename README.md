# web-transcriber-admin
react web app for transcriber administration

To run...

## Installation

Install [nodejs](https://nodejs.org/en/download/)

```
npm install
npm run build
```

## Running Locally

```
npm start
```

Createing a file called: .env.development.local with the contents:
```
REACT_APP_OFFLINE=true
REACT_APP_CALLBACK=localhost:3000/callback
```
allows the program to run offline with the content that was downloaded to your browser the last time you were online.

## Debugging

After using
```
npm start
```
from code you can use the debugger if you set the .vscode/launch.json configurations.url to http://localhost:3000

## Deployment

```
npm run build
npm run deploy
```
