import { Box } from '@mui/material';

export const HTMLPage = ({ text }: { text: string }) => {
  return (
    <Box
      sx={{ m: 4 }}
      dangerouslySetInnerHTML={{
        __html: text,
      }}
    />
  );
};
