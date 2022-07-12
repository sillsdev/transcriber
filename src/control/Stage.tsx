import { IconButton } from '@material-ui/core';
import { CSSProperties } from 'styled-components';
import PrevIcon from '@mui/icons-material/NavigateBefore';
import NextIcon from '@mui/icons-material/NavigateNext';
export const Stage = ({
  id,
  label,
  color,
  textColor,
  done,
  select,
  moveStep,
}: {
  id: string;
  label: string;
  color?: string;
  textColor?: string;
  done?: boolean;
  select?: (id: string) => void;
  moveStep?: (forward: boolean) => void;
}) => {
  const lineProps = { strokeWidth: 1.1 };
  const textProps = (textColor?: string) =>
    ({
      fontStyle: 'normal',
      fontSize: '16px',
      lineHeight: 1.25,
      fontFamily: 'sans-serif',
      textAlign: 'center',
      textAnchor: 'middle',
      whiteSpace: 'pre',
      inlineSize: 173,
      fill: textColor || '#000000',
      fillOpacity: 1,
      stroke: 'none',
    } as CSSProperties);

  const handleClick = () => {
    select && select(id);
  };
  const handleMove = (forward: boolean) => () => {
    moveStep && moveStep(forward);
  };
  const shortLabel = label.length > 22 ? `${label.slice(0, 22)}...` : label;
  return id === 'prev' || id === 'next' ? (
    <IconButton
      id={id}
      disabled={label === ''}
      color="secondary"
      onClick={handleMove(id === 'next')}
      style={{ minWidth: '20px' }}
    >
      {label === '' ? (
        <></>
      ) : id === 'prev' ? (
        <PrevIcon fontSize="large" />
      ) : (
        <NextIcon fontSize="large" />
      )}
    </IconButton>
  ) : (
    <svg
      width="300px"
      height="50px"
      viewBox="0.0 0.0 300.0 50.0"
      fill="none"
      stroke="none"
      strokeLinecap="square"
      strokeMiterlimit="10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        onClick={handleClick}
        style={{ cursor: select ? 'pointer' : 'default' }}
      >
        <path
          fill="#eeeeee"
          d="M 0,0 H 276 L 299,24.7 276,49.5 H 0 L 23,24.7 Z"
          fillRule="evenodd"
          style={lineProps}
        />
        <path
          fill={color || '#ffffff'}
          stroke="#595959"
          strokeWidth="1.1"
          strokeLinejoin="round"
          strokeLinecap="butt"
          d="M 0,0 H 276 L 299,24.7 276,49.5 H 0 L 23,24.7 Z"
          fillRule="evenodd"
        />
        <text
          style={textProps(textColor)}
          x="85.3"
          y="25.6"
          transform="matrix(1.3,0,0,2.2,34.5,-21.3)"
        >
          <tspan x="85.3" y="25.6">
            {`${done ? '\u2714 ' : ''}${shortLabel}`}
          </tspan>
        </text>
      </g>
    </svg>
  );
};
