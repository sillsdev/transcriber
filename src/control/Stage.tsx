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
  const lineProps = { strokeWidth: 1.10133 };
  const textProps = {
    fontStyle: 'normal',
    fontSize: '16px',
    lineHeight: 1.25,
    fontFamily: 'sans-serif',
    textAlign: 'center',
    textAnchor: 'middle',
    whiteSpace: 'pre',
    inlineSize: 115.44,
    fill: '#000000',
    fillOpacity: 1,
    stroke: 'none',
  } as CSSProperties;

  const handleClick = () => {
    select && select(id);
  };

  return (
    <svg
      version="1.1"
      viewBox="0.0 0.0 200.0 50.0"
      fill="none"
      stroke="none"
      strokeLinecap="square"
      strokeMiterlimit="10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g onClick={handleClick}>
        <path
          fill="#eeeeee"
          d="M 0,0 H 176.52729 L 199.6284,24.725997 176.52729,49.451994 H 0 L 23.101103,24.725997 Z"
          fillRule="evenodd"
          id="path743"
          style={lineProps}
        />
        <path
          fill={color || '#ffffff'}
          stroke="#595959"
          strokeWidth="1.10133"
          strokeLinejoin="round"
          strokeLinecap="butt"
          d="M 0,0 H 176.52729 L 199.6284,24.725997 176.52729,49.451994 H 0 L 23.101102,24.725997 Z"
          fillRule="evenodd"
          id="path745"
        />
        <text
          // xml:space="preserve"
          style={textProps}
          x="85.276993"
          y="25.568182"
          id="text50627"
          transform="matrix(1.2814758,0,0,2.1700602,-8.2661539,-17.681404)"
        >
          <tspan x="85.276993" y="25.568182" id="tspan83787">
            {`${done ? '\u2714 ' : ''}${label}`}
          </tspan>
        </text>
      </g>
    </svg>
  );
};
