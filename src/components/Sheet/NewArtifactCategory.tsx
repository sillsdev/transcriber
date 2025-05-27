import { Box, IconButton, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/CancelOutlined';
import { ISelectArtifactCategoryStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { selectArtifactCategory } from '../../selector';
import { ArtifactCategoryType, useArtifactCategory } from '../../crud';
import { useState } from 'react';
import { useSnackBar } from '../../hoc/SnackBar';

interface IProps {
  type: ArtifactCategoryType;
  onAdded: (newId: string) => void;
  onCancelled?: () => void;
}

export const NewArtifactCategory = (props: IProps) => {
  const { type, onAdded, onCancelled } = props;

  const t: ISelectArtifactCategoryStrings = useSelector(
    selectArtifactCategory,
    shallowEqual
  );
  const { addNewArtifactCategory } = useArtifactCategory();
  const { showMessage } = useSnackBar();
  const [newArtifactCategory, setNewArtifactCategory] = useState('');
  const handleNewArtifactCategoryChange = (e: any) => {
    setNewArtifactCategory(e.target.value);
  };
  const addNewCategory = () => {
    addNewArtifactCategory(newArtifactCategory, type).then((newId) => {
      if (newId) {
        if (newId === 'duplicate') {
          showMessage(t.duplicateCategory);
        } else {
          setNewArtifactCategory('');
          onAdded(newId);
        }
      }
    });
  };
  const cancelNewCategory = () => {
    setNewArtifactCategory('');
    onCancelled && onCancelled();
  };
  return (
    <Box sx={{ p: 1 }}>
      <TextField
        id="new-artifact-cat"
        label={t.newArtifactCategory}
        sx={{ width: '300px' }}
        value={newArtifactCategory || ''}
        onChange={handleNewArtifactCategoryChange}
        InputProps={{
          endAdornment: (
            <>
              <IconButton
                id="addnew"
                color="secondary"
                aria-label="addnew"
                onClick={addNewCategory}
                disabled={!newArtifactCategory}
              >
                <AddIcon />
              </IconButton>
              <IconButton
                id="cancelnew"
                color="secondary"
                aria-label="cancelnew"
                onClick={cancelNewCategory}
                disabled={!newArtifactCategory}
              >
                <CancelIcon />
              </IconButton>
            </>
          ),
        }}
      ></TextField>
    </Box>
  );
};
