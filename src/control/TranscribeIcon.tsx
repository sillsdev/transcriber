import { useTheme } from '@material-ui/core/styles';

interface IconProps {
  className?: string;
  color?: string;
}
export const TranscribeIcon = ({ className, color }: IconProps) => {
  const theme = useTheme();

  return (
    <span className={className || ''}>
      <svg width="16" height="16" viewBox="0 0 38 36" fill="none">
        <g stroke={color || theme.palette.primary.main}>
          <path d="M20 35H30.2857" strokeWidth="4" />
          <path d="M20 28H38" strokeWidth="4" />
          <path d="M20 21L38 21" strokeWidth="4" />
          <path
            d="M1 15.5C1 15.5 2.5 9 5.5 9C8.5 9 8.1 25 12.5 25C18 25 16.5 1.5 22 1.5C27 1.5 25 14 29 14C33 14 34.5 14 38 14"
            strokeWidth="4"
          />
        </g>
      </svg>
    </span>
  );
};
export default TranscribeIcon;
