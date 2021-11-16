import { useTheme } from '@material-ui/core/styles';

export const TranscribeIcon = () => {
  const theme = useTheme();

  return (
    <svg width="16" height="16" viewBox="0 0 38 36" fill="none">
      <g stroke={theme.palette.primary.main}>
        <path d="M20 35H30.2857" stroke-width="4" />
        <path d="M20 28H38" stroke-width="4" />
        <path d="M20 21L38 21" stroke-width="4" />
        <path
          d="M1 15.5C1 15.5 2.5 9 5.5 9C8.5 9 8.1 25 12.5 25C18 25 16.5 1.5 22 1.5C27 1.5 25 14 29 14C33 14 34.5 14 38 14"
          stroke-width="4"
        />
      </g>
    </svg>
  );
};
export default TranscribeIcon;
