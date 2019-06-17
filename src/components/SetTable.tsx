import React, { useState } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Section, Passage, IProjectSettingsStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { Schema, KeyMap, QueryBuilder, TransformBuilder } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';
import AddIcon from '@material-ui/icons/Add';
import SnackBar from './SnackBar';
import DataSheet from 'react-datasheet';
import 'react-datasheet/lib/react-datasheet.css';
import './SetTable.css';

const styles = (theme: Theme) => ({
  container: {
    display: 'flex',
    margin: theme.spacing(4),
  },
  paper: {
    paddingLeft: theme.spacing(4),
  },
  actions: theme.mixins.gutters({
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  }),
  button: {
    margin: theme.spacing(1),
  },
  icon: {
    marginLeft: theme.spacing(1),
  },
});

interface IChange {
  cell: any;
  row: number;
  col: number;
  value: string | null;
}

interface IStateProps {
  t: IProjectSettingsStrings;
}

interface IRecordProps {
  Sections: Array<Section>;
  tasks: Array<Passage>;
}

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles> {
  updateStore?: any;
}

export function SetTable(props: IProps) {
  const { classes, updateStore, t } = props;
  const [schema] = useGlobal('schema');
  const [keyMap] = useGlobal('keyMap');
  const [project] = useGlobal('project');
  const [book] = useGlobal('plan');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState([
    [
      { value: 'Sequence', readOnly: true, width: 120 },
      { value: 'Title', readOnly: true, width: 180 },
      { value: 'Reference', readOnly: true, width: 120 },
      { value: 'Assignments', readOnly: true, width: 120 },
      { value: 'Media', readOnly: true, width: 180 },
    ],
    [
      { readOnly: true, value: 1 },
      { value: 'Creation Story' },
      { value: '1:1-2:4' },
      { value: <Avatar /> },
      { value: 'gen001001.mp3' },
    ],
    [
      { readOnly: true, value: 2 },
      { value: 'Eden' },
      { value: '2:5-25' },
      { value: <Avatar /> },
      { value: 'gen002005.mpe' },
    ],
    [
      { readOnly: true, value: 3 },
      { value: 'First Sin' },
      { value: '3:1-19' },
      { value: <Avatar /> },
      { value: 'gen003001.mp3' },
    ],
    [
      { readOnly: true, value: 4 },
      { value: 'Paradise Lost' },
      { value: '3:20-24' },
      { value: <Avatar /> },
      { value: 'gen003020.mp3' },
    ],
  ]);

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleAdd = () => alert('add');
  const handleSave = () => {
    if (project === null) {
      setMessage(<span>Project not section.</span>);
      return;
    }
    const projectId = (keyMap as KeyMap).idToKey(
      'project',
      'remoteId',
      project as string
    );
    if (book === null) {
      setMessage(<span>Book not section.</span>);
      return;
    }
    const bookId = (keyMap as KeyMap).idToKey(
      'book',
      'remoteId',
      book as string
    );

    if (data[0].length !== 4) {
      setMessage(
        <span>
          Data should consist of section, passage, breaks, and title (four
          columns).
        </span>
      );
      return;
    }
    let section: Section;
    let setId: number | null = null;
    for (let i = 1; i < data.length; i += 1) {
      if (data[i][0].value !== '') {
        section = {
          type: 'section',
          attributes: {
            name: data[i][3].value as string,
            projectId: parseInt(projectId),
            bookId: parseInt(bookId),
          },
        } as any;
        (schema as Schema).initializeRecord(section);
        updateStore((t: TransformBuilder) => t.addRecord(section)).then(
          (e: any) => {
            // alert('section added: ' + JSON.stringify(e));
            const setRec = (q: QueryBuilder) =>
              q.findRecord({ type: 'section', id: section.id });
            setId = parseInt(
              (keyMap as KeyMap).idToKey('section', 'remoteId', section.id)
            );
            // alert(setId)
          }
        );
      }
      if (data[i][1].value !== '') {
        let passage: Passage = {
          type: 'passage',
          attributes: {
            reference: data[i][2].value as string,
            passage: data[i][1].value as string,
            position: 0,
            taskState: 'Incomplete',
            hold: false,
            title: data[i][3].value as string,
            dateCreated: new Date().toISOString(),
            dateUpdated: new Date().toISOString(),
          },
        } as any;
        (schema as Schema).initializeRecord(passage);
        let taskId: number | null = null;
        updateStore((t: TransformBuilder) => t.addRecord(passage)).then(
          (e: any) => {
            // alert('passage added: ' + JSON.stringify(e))
            const taskRec = (q: QueryBuilder) =>
              q.findRecord({ type: 'passage', id: passage.id });
            taskId = parseInt(
              (keyMap as KeyMap).idToKey('passage', 'remoteId', passage.id)
            );
            // alert(taskId)
          }
        );
        if (taskId && setId) {
          let taskSet = {
            type: 'taskset',
            attributes: {
              taskId: taskId,
              setId: setId,
            },
          } as any;
          (schema as Schema).initializeRecord(taskSet);
          updateStore((t: TransformBuilder) => t.addRecord(taskSet)).then(
            (e: any) => alert('taskset added' + JSON.stringify(e))
          );
        }
      }
    }
  };

  const handleValueRender = (cell: any) => cell.value;

  const handleCellsChanged = (changes: Array<IChange>) => {
    const grid = data.map((row: any) => [...row]);
    changes.forEach(({ cell, row, col, value }: IChange) => {
      grid[row][col] = { ...grid[row][col], value };
    });
    setData(grid);
  };

  const handleContextMenu = (e: MouseEvent, cell: any) =>
    cell.readOnly ? e.preventDefault() : null;

  const handlePaste = (s: string) => {
    const widths = [60, 80, 120, 400];
    const blankLines = /\r?\n\t*\r?\n/;
    const chunks = s.split(blankLines);
    const lines = chunks
      .join('\n')
      .replace(/\r?\n$/, '')
      .split('\n');
    // test: > 2 lines, first starts with a letter, 4 columns, second starts with a number
    if (
      lines.length > 1 &&
      !lines[0].match(/^[0-9]/) &&
      lines[0].split('\t').length === 4 &&
      lines[0].split('\t')[0].length > 2 &&
      lines[1].match(/^[0-9]/)
    ) {
      const grid = lines.map((row: string, i: number) =>
        row.split('\t').map((val: string, j: number) => {
          return {
            value: val,
            readOnly: i === 0,
            width: widths[j],
            className:
              (i === 0 || lines[i].slice(0, 1) === '\t' ? 'pass' : 'section') +
              (j < 2 ? ' num' : ''),
          };
        })
      );
      setData(grid);
      return Array<Array<string>>();
    }
    return lines.map(s => s.split('\t'));
  };

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          <Button
            key="add"
            aria-label={'Add'}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleAdd}
          >
            {'Add'}
            <AddIcon className={classes.icon} />
          </Button>
          <Button
            key="save"
            aria-label={'Save'}
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={handleSave}
          >
            {'Save'}
            <SaveIcon className={classes.icon} />
          </Button>
        </div>

        <DataSheet
          data={data as any[][]}
          valueRenderer={handleValueRender}
          onContextMenu={handleContextMenu}
          onCellsChanged={handleCellsChanged}
          parsePaste={handlePaste}
        />
      </div>
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'projectSettings' }),
});

const mapRecordsToProps = {
  sets: (q: QueryBuilder) => q.findRecords('section'),
  tasks: (q: QueryBuilder) => q.findRecords('passage'),
  tasksets: (q: QueryBuilder) => q.findRecords('taskset'),
};

export default withStyles(styles, { withTheme: true })(withData(
  mapRecordsToProps
)(connect(mapStateToProps)(SetTable) as any) as any) as any;
