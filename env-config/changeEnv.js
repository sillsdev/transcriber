const fs = require('fs');

var argEnv = process.argv.length > 2 ? process.argv[2] : 'dev';

// destination.txt will be created or overwritten by default.
fs.copyFile(`env-config/.env.${argEnv}.local`, '.env.local', (err) => {
  if (err) throw err;
  console.log(`env-config/.env.${argEnv}.local was copied to .env.local`);
});

// destination.txt will be created or overwritten by default.
fs.copyFile(
  `env-config/.env.${argEnv}.development.local`,
  '.env.development.local',
  (err) => {
    if (err) throw err;
    console.log(
      `env-config/.env.${argEnv}.development.local was copied to .env.development.local`
    );
  }
);

// destination.txt will be created or overwritten by default.
fs.copyFile(
  'amplify/' + argEnv + '/amplify-meta.json',
  'amplify/backend/amplify-meta.json',
  (err) => {
    if (err) throw err;
    console.log(
      'amplify/' +
        argEnv +
        '/amplify-meta.json was copied to amplify/backend/amplify-meta.json'
    );
  }
);

// destination.txt will be created or overwritten by default.
fs.copyFile(
  'amplify/' + argEnv + '/parameters.json',
  'amplify/backend/hosting/S3AndCloudFront/parameters.json',
  (err) => {
    if (err) throw err;
    console.log(
      'amplify/' +
        argEnv +
        '/parameters.json was copied to amplify/backend/hosting/S3AndCloudFront/parameters.json'
    );
  }
);

// destination.txt will be created or overwritten by default.
fs.copyFile(
  'amplify/' + argEnv + '/amplify-meta.json',
  'amplify/#current-cloud-backend/amplify-meta.json',
  (err) => {
    if (err) throw err;
    console.log(
      'amplify/' +
        argEnv +
        '/amplify-meta.json was copied to amplify/#current-cloud-backend/amplify-meta.json'
    );
  }
);

// destination.txt will be created or overwritten by default.
fs.copyFile(
  'amplify/' + argEnv + '/parameters.json',
  'amplify/#current-cloud-backend/hosting/S3AndCloudFront/parameters.json',
  (err) => {
    if (err) throw err;
    console.log(
      'amplify/' +
        argEnv +
        '/parameters.json was copied to amplify/#current-cloud-backend/hosting/S3AndCloudFront/parameters.json'
    );
  }
);
