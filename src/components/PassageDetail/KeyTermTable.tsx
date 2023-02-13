import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Chip } from '@mui/material';
import { elemOffset, generateUUID } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../model';
import { keyTermsSelector } from '../../selector';
import TargetWord from './TargetWordAdd';
import { useMediaUpload } from './useMediaUpload';
import { useArtifactType } from '../../crud';
import { useKeyTermSave } from '../../crud/useKeyTermSave';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    padding: `8px 16px`,
    overflowWrap: 'break-word',
    hyphens: 'manual',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: `8px 16px`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export interface IKeyTermRow {
  term: string;
  source: string;
  target: string[];
  index: number;
  fileName: string;
}

interface IProps {
  rows: IKeyTermRow[];
  termClick?: (term: number) => void;
  chipClick?: (target: string) => void;
  addTarget?: (term: number) => void;
}

export default function KeyTermTable({
  rows,
  termClick,
  chipClick,
}: // addTarget,
IProps) {
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  const [bodyHeight, setBodyHeight] = React.useState(window.innerHeight);
  const [targetText, setTargetText] = React.useState('');
  const rowRef = React.useRef<IKeyTermRow>();
  const [, setCanSaveRecording] = React.useState(false);
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const reset = () => {
    setTargetText('');
    rowRef.current = undefined;
  };
  const saveKeyTermTarget = useKeyTermSave({ cb: reset });
  const afterUploadCb = (mediaRemId: string) => {
    if (rowRef.current) {
      const { term, index } = rowRef.current;
      saveKeyTermTarget({
        term,
        termIndex: index,
        mediaRemId,
        target: targetText,
      });
    }
  };
  const { keyTermId } = useArtifactType();
  const uploadMedia = useMediaUpload({ artifactId: keyTermId, afterUploadCb });

  const handleTermClick = (term: number) => () => {
    termClick && termClick(term);
  };

  const handleChipClick = (target: string) => () => {
    chipClick && chipClick(target);
  };

  const getFilename = (row: IKeyTermRow) => {
    const uuid = generateUUID();
    return `${row.fileName}-${row.target.length}-${uuid.slice(0, 4)}`;
  };

  const onOk = (row: IKeyTermRow) => {
    rowRef.current = row;
  };

  const onCancel = () => {
    reset();
  };

  const onTextChange = (text: string) => {
    setTargetText(text);
  };

  React.useEffect(() => {
    const winHeight = window.innerHeight;
    if (bodyRef.current) {
      const { y } = elemOffset(bodyRef.current);
      const newHeight = winHeight - y;
      setBodyHeight(newHeight);
    }
  }, [rows]);

  return (
    <TableContainer component={Paper} style={{ height: `${bodyHeight}px` }}>
      <Table stickyHeader sx={{ minWidth: 400 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>{t.source}</StyledTableCell>
            <StyledTableCell>{t.target}</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody ref={bodyRef}>
          {rows.map((row) => (
            <StyledTableRow key={row.term}>
              <StyledTableCell
                component="th"
                scope="row"
                sx={{ cursor: 'pointer', whiteSpace: 'break-spaces' }}
                onClick={handleTermClick(row.index)}
              >
                {row.source}
              </StyledTableCell>
              <StyledTableCell>
                <>
                  {row.target.map((t) => (
                    <Chip
                      label={t}
                      onClick={handleChipClick(t)}
                      sx={{ mx: 1 }}
                    />
                  ))}
                  <TargetWord
                    toolId={`${row.index}`}
                    fileName={getFilename(row)}
                    uploadMethod={uploadMedia}
                    row={row}
                    onOk={onOk}
                    onCancel={onCancel}
                    cancelOnlyIfChanged
                    setCanSaveRecording={setCanSaveRecording}
                    onTextChange={onTextChange}
                  />
                </>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
