import path from 'path';

export const execFolder = () =>
  path.dirname(
    (process as any).helperExecPath.replace(
      path.join('node_modules', 'electron', 'dist'),
      path.join('dist', 'win-unpacked')
    )
  );
