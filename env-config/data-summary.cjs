function vals(row) {
  return row.split('\t').map((v) => v.trim());
}

function process(csv) {
  const result = [`name\temail\tlang\tlgName\tperf\trefs`];
  const perfs = new Map();
  let cname = '';
  let cemail = '';
  let clang = '';
  let clgName = '';
  let cbook = '';
  let refs = [];

  const doOutput = () => {
    if (cname !== '') {
      const value = Array.from(perfs.entries())
        .sort((a, b) => b[0] - a[0])
        .map((value) => {
          const [n, v] = value;
          const [dur, size, trans] = v.split('|');
          return `${n}:${dur}sec,${size}bytes,${trans}trans`;
        })
        .join('; ');
      perfs.clear();
      result.push(
        `${cname}\t${cemail}\t${clang}\t${clgName}\t${value}\t${refs.join(
          '; '
        )}`
      );
    }
  };

  csv.split('\n').forEach((row, i) => {
    if (i === 0) return; // Skip header
    const [name, email, lang, lgName, perf, dur, size, trans, book, ref] =
      vals(row);
    if (name !== cname || email !== cemail || lang !== clang) {
      doOutput();
      cname = name;
      cemail = email;
      clang = lang;
      clgName = lgName;
      perfs.set(
        perf,
        `${dur || 0}|${size || 0}|${trans && parseInt(trans || 0) > 0 ? 1 : 0}`
      );
      cbook = book;
      refs = [`${book} ${ref}`];
    } else {
      const ntrans = trans && parseInt(trans || 0) > 0 ? 1 : 0;
      if (perfs.has(perf)) {
        const [pdur, psize, ptrans] = perfs.get(perf).split('|');
        const tdur = parseInt(pdur) + parseInt(dur || 0);
        const tsize = parseInt(psize) + parseInt(size || 0);
        perfs.set(perf, `${tdur}|${tsize}|${parseInt(ptrans) + ntrans}`);
      } else {
        perfs.set(perf, `${dur}|${size}|${ntrans}`);
      }
      const nRef = book !== cbook ? `${book} ${ref}` : `${ref}`;
      if (nRef.trim() !== '') refs.push(nRef);
      cbook = book;
    }
  });

  doOutput();

  return result.join('\n');
}

const readFileSync = require('fs').readFileSync;
const writeFile = require('write');

const argName = `prod-lang-data-fr2021-to2025`;
const data = readFileSync(__dirname + `/../../${argName}.csv`, 'utf8');

const summary = process(data);

writeFile.sync(__dirname + `/../../${argName}-sum.csv`, summary);
