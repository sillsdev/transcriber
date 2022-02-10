import { CSSProperties } from 'styled-components';

export const Stage = ({
  id,
  label,
  color,
  done,
  select,
}: {
  id: string;
  label: string;
  color?: string;
  done?: boolean;
  select?: (id: string) => void;
}) => {
  const lineProps = { strokeWidth: 1.1 };
  const textProps = {
    fontStyle: 'normal',
    fontSize: '16px',
    lineHeight: 1.25,
    fontFamily: 'sans-serif',
    textAlign: 'center',
    textAnchor: 'middle',
    whiteSpace: 'pre',
    inlineSize: 173,
    fill: '#000000',
    fillOpacity: 1,
    stroke: 'none',
  } as CSSProperties;

  const handleClick = () => {
    select && select(id);
  };

  return (
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
          style={textProps}
          x="85.3"
          y="25.6"
          transform="matrix(1.3,0,0,2.2,34.5,-21.3)"
        >
          <tspan x="85.3" y="25.6">
            {`${done ? '\u2714 ' : ''}${label}`}
          </tspan>
        </text>
      </g>
    </svg>
  );
};
