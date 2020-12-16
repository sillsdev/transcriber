### Variable indicating online status

| Variable        | Web   | Desktop online | Desktop offline | Comment |
| --------------- | ----- | -------------- | --------------- | ------- |
| isElectron      | false | true           | true            | Const   |
| offline         | false | false          | true            | *1      |
| isAuthenticated | true  | true           | false           | *2      |
| connected       |       |                |                 | *3      |

1. Default to `isElectron` but set to false when user logs on
2. Checking unexpired token
3. true is Internet is available now
