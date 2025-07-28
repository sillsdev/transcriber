import { useTheme } from '@mui/material';

interface IProps {
  width?: string;
  height?: string;
  disabled: boolean;
}

export const NormalizeIcon = ({ width, height, disabled }: IProps) => {
  const theme = useTheme();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width || '24px'}
      height={height || '24px'}
      viewBox="0 -960 960 960"
      version="1.1"
    >
      <g
        id="cadence"
        stroke={theme.palette.grey[400]}
        strokeWidth="1"
        fill={disabled ? theme.palette.grey[400] : theme.palette.grey[700]}
        fillRule="evenodd"
      >
        <path d="M440-120v-560h80v560h-80ZM280-240v-320h80v320h-80Zm320 0v-320h80v320h-80ZM120-360v-80h80v80h-80Zm640 0v-80h80v80h-80ZM80-560v-80h47q42 0 78.5-21t58.5-57q34-57 91.5-89.5T480-840q67 0 124.5 32.5T696-718q22 36 58.5 57t78.5 21h47v80h-46q-63 0-118.5-31T628-676q-23-39-62.5-61.5T480-760q-45 0-84.5 22.5T333-676q-32 54-87.5 85T127-560H80Z" />
      </g>
    </svg>
  );
};

export default NormalizeIcon;
