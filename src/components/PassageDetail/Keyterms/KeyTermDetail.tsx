import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { IKeyTerm } from '../../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../../model';
import { keyTermsSelector } from '../../../selector';
import { useKeyTerms } from '../../../utils';

interface ITermRow {
  label: string;
  value: string;
}

const TermRow = ({ label, value }: ITermRow) => (
  <TableRow
    key={label}
    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
  >
    <TableCell component="th" scope="row">
      {label}
    </TableCell>
    <TableCell>{value}</TableCell>
  </TableRow>
);

interface IProps {
  term: IKeyTerm;
}

export default function KeyTermDetail({ term }: IProps) {
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);
  const { catLabel } = useKeyTerms();
  const langName = [t.hebrew, t.aramaic, t.greek];

  return Boolean(term?.W) ? (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 400 }} aria-label="simple table">
        <TableBody>
          <TermRow label={t.word} value={term.W} />
          <TermRow label={t.transliteration} value={term.T} />
          {term.D ? (
            <TermRow label={t.definition} value={term.D} />
          ) : (
            <TermRow label={t.gloss} value={term.G} />
          )}
          {term.C && <TermRow label={t.category} value={catLabel(term.C)} />}
          {term.S && <TermRow label={t.strong} value={term.S} />}
          {term.A && <TermRow label={t.domain} value={term.A} />}
          <TermRow label={t.language} value={langName[term.L]} />
          {!term.D && <TermRow label={t.gloss} value={term.G} />}
          {term.P && <TermRow label={t.link} value={term.P} />}
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <></>
  );
}
