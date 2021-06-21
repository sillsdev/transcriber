var fs = require('fs-extra');
const { join } = require('path');
const md5File = require('md5-file');

var dist = process.argv.length > 2 ? process.argv[2] : 'dist';

var content = fs.readFileSync(join(__dirname, '/package.json'), 'utf-8');
var json = JSON.parse(content);

async function makeInfo(path) {
  const dir = await fs.promises.opendir(path);
  for await (const dirent of dir) {
    if (!dirent.isFile()) continue;
    const ext = dirent.name.split('.').pop();
    if (['exe', 'deb', 'snap'].indexOf(ext) === -1) continue;
    // const path = require('path');
    const filePath = join(__dirname, dist, dirent.name);
    const is32 = dirent.name.indexOf('-32-') !== -1;
    fs.open(filePath, 'r', (err, fd) => {
      if (err) throw err;
      fs.fstat(fd, async (err, stat) => {
        if (err) throw err;
        // console.log(dirent.name);
        // console.log(stat);
        const hash = await md5File(filePath);
        const isWin = ext === 'exe';
        var info = {
          name: json.build.productName,
          version: json.version,
          date: stat.ctime.toISOString().split('T')[0],
          edition: '',
          platform: isWin ? 'win' : 'linux',
          platform_version:
            isWin & !is32 ? '10' : isWin & is32 ? '7' : ext.toUpperCase(),
          architecture: isWin & is32 ? 'x86_32' : 'x86_64',
          stability: 'stable',
          nature: 'ver2',
          file: dirent.name,
          md5: hash.toUpperCase(),
          type: ext,
          build: '',
          compatible: 'Paratext>=9.x',
        };
        // console.log(info);
        fs.writeFileSync(
          filePath.replace('.' + ext, '_' + ext + '.download_info'),
          JSON.stringify(info, null, 2)
        );
        fs.close(fd, (err) => {
          if (err) throw err;
        });
      });
    });
  }
}
makeInfo(join(__dirname, dist));
