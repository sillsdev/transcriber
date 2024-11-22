import { SxProps, useTheme } from '@mui/material';

interface IProps {
  sx?: SxProps;
  width?: string;
  height?: string;
  disabled: boolean;
}

export const RemoveNoiseIcon = ({ width, height, disabled }: IProps) => {
  const theme = useTheme();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width || '14pt'}
      height={height || '14pt'}
      viewBox="0 0 4695 4695"
      version="1.1"
    >
      <g
        id="no-honk-icon"
        stroke={theme.palette.grey[400]}
        strokeWidth="1"
        fill={disabled ? theme.palette.grey[400] : theme.palette.grey[700]}
        fillRule="evenodd"
      >
        <path d="M 2979.628906 2046.960938 C 2994.441406 2055.929688 3420.789063 1903.421875 3580.671875 1782.300781 C 3675.421875 1700.070313 3622.121094 1607.371094 3503.691406 1649.230469 C 3318.640625 1731.46875 2963.351563 2037.988281 2979.628906 2046.960938 " />
        <path d="M 3275.710938 1417.46875 C 3321.601563 1309.820313 3241.660156 1254.488281 3161.71875 1336.730469 C 3040.320313 1477.28125 2865.640625 1873.511719 2881.921875 1875.011719 C 2898.210938 1876.5 3189.839844 1581.949219 3275.710938 1417.46875 " />
        <path d="M 1315.660156 2689.910156 C 1363.03125 2662.988281 1422.25 2677.941406 1448.898438 2725.789063 C 1475.539063 2772.140625 1459.261719 2833.449219 1413.371094 2860.359375 C 1365.988281 2887.269531 1306.78125 2870.828125 1280.128906 2824.480469 C 1253.488281 2776.628906 1269.769531 2716.820313 1315.660156 2689.910156 Z M 1565.851563 3279.019531 C 1690.199219 3205.761719 1756.820313 3068.199219 1744.980469 2932.128906 C 1967.039063 2834.941406 2174.289063 2760.179688 2365.269531 2715.328125 L 1986.28125 2331.050781 C 1870.808594 2441.699219 1739.058594 2552.339844 1591.011719 2662.988281 C 1479.988281 2583.738281 1328.988281 2573.28125 1203.148438 2646.539063 C 1029.949219 2746.730469 970.730469 2971 1071.398438 3145.949219 C 1170.589844 3320.890625 1392.648438 3380.699219 1565.851563 3279.019531 " />
        <path d="M 3665.050781 2099.289063 C 3481.488281 2091.808594 3083.261719 2199.480469 3075.859375 2214.421875 C 3069.941406 2229.371094 3496.289063 2275.730469 3678.378906 2239.839844 C 3787.929688 2209.941406 3780.519531 2112.75 3665.050781 2099.289063 " />
        <path d="M 3676.898438 3404.621094 C 2884.878906 2604.679688 2092.871094 1804.730469 1300.859375 1004.789063 C 1591.011719 774.53125 1950.75 639.960938 2347.5 639.960938 C 3281.628906 639.960938 4038.109375 1404.011719 4038.109375 2347.5 C 4038.109375 2721.300781 3921.160156 3089.128906 3676.898438 3404.621094 Z M 2347.5 4056.539063 C 1413.371094 4056.539063 655.40625 3290.988281 655.40625 2347.5 C 655.40625 1973.691406 772.359375 1605.871094 1018.109375 1290.378906 C 1810.109375 2090.320313 2602.128906 2890.261719 3392.660156 3690.210938 C 3102.5 3920.46875 2744.25 4056.539063 2347.5 4056.539063 Z M 2347.5 234.75 C 1192.789063 234.75 255.699219 1181.21875 255.699219 2347.5 C 255.699219 3513.769531 1192.789063 4460.25 2347.5 4460.25 C 3502.210938 4460.25 4439.300781 3513.769531 4439.300781 2347.5 C 4439.300781 1181.21875 3502.210938 234.75 2347.5 234.75 " />
        <path d="M 2578.441406 1472.789063 C 2565.121094 1450.371094 2535.511719 1441.398438 2511.828125 1454.851563 C 2488.140625 1468.308594 2480.738281 1499.710938 2494.058594 1522.140625 L 3176.519531 2716.820313 C 3189.839844 2740.738281 3219.460938 2749.710938 3243.140625 2734.761719 C 3266.828125 2721.300781 3274.230469 2691.398438 3260.898438 2668.96875 L 2578.441406 1472.789063 " />
        <path d="M 2304.570313 1954.261719 L 3034.398438 2691.398438 C 3064.011719 2700.371094 3093.621094 2709.339844 3123.230469 2721.300781 C 2902.648438 2334.039063 2682.070313 1948.269531 2461.488281 1562.511719 C 2442.238281 1692.589844 2387.46875 1822.679688 2304.570313 1954.261719 " />
      </g>
    </svg>
  );
};
