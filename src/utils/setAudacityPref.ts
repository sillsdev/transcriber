import path from 'path-browserify';
const ipc = (window as any)?.electron;

export const audPrefsName = async () => {
  if (await ipc?.isWindows()) {
    const appData = await ipc?.appData();
    return path.join(appData, 'audacity', 'audacity.cfg');
  } else {
    const home = await ipc?.home();
    if (await ipc?.isMac()) {
      const macAudacityCfg = path.join(
        home,
        'Library',
        'Application Support',
        'audacity'
      );
      if (await ipc?.exists(macAudacityCfg)) {
        return macAudacityCfg;
      }
    }
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

const getSaveLocation = (content: string) => {
  return /SaveLocationMode=([a-zA-Z0-9]*)/.exec(content);
};

const getExpLocation = (content: string) => {
  return /ExportLocationMode=([a-zA-Z0-9]*)/.exec(content);
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

const getExpMatch = (content: string) => {
  return /\[ExportAudioDialog\]\r?\nFormat=([A-Z1-3]*)\r?\nDefaultPath=([^\r\n]*)/.exec(
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

const changeSaveMode = (
  data: string,
  m: RegExpExecArray | null,
  val: string
) => {
  // set the save location Mode to local
  const cloudAudio = /\[cloud\/audiocom[^\n]*\r?\n([^[\r\n]*\r?\n)*/.exec(data);
  if (cloudAudio) {
    const start = m ? m.index : cloudAudio.index + cloudAudio[0].length;
    const end = m ? m.index + m[0].length : start;
    data =
      data.slice(0, start) +
      val +
      (start === end ? '\r\n' : '') +
      data.slice(end);
  }
  return data;
};

export const setAudacityPref = async (fullName: string) => {
  // create folders for audio projects and import/export
  let folder = path.dirname(fullName);
  await ipc?.createFolder(folder);
  let ioFolder = folder.replace('aup3', 'io');
  await ipc?.createFolder(ioFolder);
  if (path.sep === '\\') {
    folder = folder.replace(/\\/g, `\\\\`);
    ioFolder = ioFolder.replace(/\\/g, `\\\\`);
  }

  // get the current audacity.cfg content
  const prefName = (await audPrefsName()) || '';
  const beforeContent = (await getAudPrefContent(prefName)) || '';

  // check if the folders are already set
  const save = getDirMatch(beforeContent);
  const saveFolder = (save && save[2]) || '';
  const imp = getIoMatch(beforeContent);
  const impFolder = (imp && imp[2]) || '';
  const exp = getExpMatch(beforeContent);
  const expFolder = (exp && exp[2]) || '';
  if (saveFolder === folder && impFolder === ioFolder && expFolder === ioFolder)
    return false;

  // remove the directories section
  let cleanContent = beforeContent.replace(
    /\[Directories\/[^\n]*\r?\n([^[\r\n]*\r?\n)*/g,
    ''
  );

  // setRecording channels to 1
  const channels = getRecordChannels(cleanContent);
  if (channels) cleanContent = changeValueTo1(cleanContent, channels);
  // We expect the audacity.cfg to always contain the recording channels

  // set the save location Mode to local
  cleanContent = changeSaveMode(
    cleanContent,
    getSaveLocation(cleanContent),
    'SaveLocationMode=local'
  );
  cleanContent = changeSaveMode(
    cleanContent,
    getExpLocation(cleanContent),
    'ExportLocationMode=local'
  );

  // set the folders
  const tmp = getTmpMatch(cleanContent);
  let pos = cleanContent.length;
  if (tmp) pos = cleanContent.indexOf(tmp[0]) + tmp[0].length;
  let passContent =
    cleanContent.slice(0, pos) +
    (await setFolder('Save', folder)) +
    (await setFolder('Open', folder)) +
    (await setFolder('Import', ioFolder)) +
    (await setFolder('Export', ioFolder)) +
    cleanContent.slice(pos);

  // Replace Export path
  const expMatch = getExpMatch(passContent);
  if (expMatch) {
    const expPos =
      passContent.indexOf(expMatch[0]) +
      expMatch[0].length -
      expMatch[2].length;
    passContent =
      passContent.slice(0, expPos) +
      ioFolder +
      passContent.slice(expPos + expMatch[2].length);
  } else {
    passContent += `[ExportAudioDialog]\r\nFormat=wav\r\nDefaultPath=${ioFolder}\r\nExportRange=project\r\n`;
  }

  // write the new content
  resetAudacityPref(prefName, passContent);
  return beforeContent;
};
