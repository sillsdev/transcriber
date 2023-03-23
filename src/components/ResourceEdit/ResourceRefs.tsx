import { Button, ButtonGroup, Stack } from '@mui/material';
import ReferenceTable, { BookRef } from './ResRefTable';

const t = {
  byWord: 'By Word',
};

interface ResourceRefsProps {
  onOpen: () => void;
}

export default function ResourceRefs({ onOpen }: ResourceRefsProps) {
  const handleAddWord = () => {};
  const handleCommit = (refs: BookRef[]) => {
    console.log(JSON.stringify(refs, null, 2));
  };
  const handleCancel = () => onOpen();

  return (
    <Stack spacing={1}>
      <ButtonGroup>
        <Button onClick={handleAddWord}>{t.byWord}</Button>
      </ButtonGroup>
      <ReferenceTable onCommit={handleCommit} onCancel={handleCancel} />
    </Stack>
  );
}
