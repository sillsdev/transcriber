import path from 'path-browserify';
const ipc = (window as any)?.electron;

export const audPrefsName = async () => {
  if (await ipc?.isWindows()) {
    const appData = await ipc?.appData();
    return path.join(appData, 'audacity', 'audacity.cfg');
  } else {
    const home = await ipc?.home();
    const snapName = path.join(
      home,
      'snap',
      'audacity',
      'current',
      '.audacity-data',
      'audacity.cfg'
    );
    if (await ipc?.exists(snapName)) return snapName;
    // const debName = path.join(home, '.audacity-data', 'audacity.cfg');
    // if (fs.existsSync(debName)) return debName;
  }
};

const getAllPref = async (prefs: string) => {
  if (!(await ipc?.exists(prefs))) return false;
  return await ipc?.read(prefs, 'utf-8');
};

const getAudPrefContent = async (inPrefs?: string) => {
  const prefs = inPrefs || (await audPrefsName());
  if (prefs === undefined) return false;
  return await getAllPref(prefs);
};

const getRecordChannels = (content: string) => {
  return /RecordChannels=([12])/.exec(content);
};

const getTmpMatch = (content: string) => {
  return /\[Directories\]\r?\nTempDir=([^\r\n]*)\r?\n/.exec(content || '');
};

const getDirMatch = (content: string) => {
  return /\[Directories\/(Open|Save)\]\r?\nDefault=([^\r\n]*)/.exec(
    content || ''
  );
};

const getIoMatch = (content: string) => {
  return /\[Directories\/(Import|Export)\]\r?\nDefault=([^\r\n]*)/.exec(
    content || ''
  );
};

const setFolder = async (kind: string, target: string) => {
  const ln = (await ipc?.isWindows()) ? '\r\n' : '\n';
  return `[Directories/${kind}]${ln}Default=${target}${ln}LastUsed=${target}${ln}`;
};

export const resetAudacityPref = (prefs: string, data: string) => {
  ipc?.write(prefs, data);
};

const changeValueTo1 = (data: string, m: RegExpExecArray) => {
  const pos = data.indexOf(m[0]) + m[0].length - 1;
  return data.slice(0, pos) + '1' + data.slice(pos + 1);
};

export const setAudacityPref = async (fullName: string) => {
  let folder = path.dirname(fullName);
  await ipc?.createFolder(folder);
  let ioFolder = folder.replace('aup3', 'io');
  await ipc?.createFolder(ioFolder);
  if (path.sep === '\\') {
    folder = folder.replace(/\\/g, `\\\\`);
    ioFolder = ioFolder.replace(/\\/g, `\\\\`);
  }

  const prefName = (await audPrefsName()) || '';
  const beforeContent = (await getAudPrefContent(prefName)) || '';
  const save = getDirMatch(beforeContent);
  const saveFolder = (save && save[2]) || '';
  const imp = getIoMatch(beforeContent);
  const impFolder = (imp && imp[2]) || '';
  if (saveFolder === folder && impFolder === ioFolder) return false;
  let cleanContent = beforeContent.replace(
    /\[Directories\/[^\n]*\r?\n([^[\r\n]*\r?\n)*/g,
    ''
  );
  const channels = getRecordChannels(cleanContent);
  if (channels) cleanContent = changeValueTo1(cleanContent, channels);
  // We expect the audacity.cfg to always contain the recording channels
  const tmp = getTmpMatch(beforeContent);
  let pos = cleanContent.length;
  if (tmp) pos = cleanContent.indexOf(tmp[0]) + tmp[0].length;
  const passContent =
    cleanContent.slice(0, pos) +
    setFolder('Save', folder) +
    setFolder('Open', folder) +
    setFolder('Import', ioFolder) +
    setFolder('Export', ioFolder) +
    cleanContent.slice(pos);
  resetAudacityPref(prefName, passContent);
  return beforeContent;
};
