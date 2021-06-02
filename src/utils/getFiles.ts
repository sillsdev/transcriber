// See also: https://qwtel.com/posts/software/async-generators-in-the-wild
// See also: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#async-generators
const { resolve } = require('path');
const { readdir, stat } = require('fs').promises;

export async function* getFiles(rootPath: string): AsyncGenerator<string> {
  try {
    const fileNames = await readdir(rootPath);
    for (const fileName of fileNames) {
      const path = resolve(rootPath, fileName);
      if ((await stat(path)).isDirectory()) {
        yield* getFiles(path);
      } else {
        yield path;
      }
    }
  } catch (EACCES) {
    // Ignore folders with no access
  }
}
