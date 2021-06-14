import React from 'react';
import { ISharedStrings, IState } from '../model';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { makeStyles, createStyles, Theme } from '@material-ui/core';
import {} from '@material-ui/core';
import MoreIcon from '@material-ui/icons/MoreHoriz';
import { elemOffset } from '../utils';
import { debounce } from 'lodash';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    moreMenu: {
      '&:hover #icon': {
        display: 'none',
      },
      '&:hover #items': {
        visibility: 'visible',
        zIndex: 1,
        position: 'absolute',
        // left: `${1197 - 67}px`,
      },
      '& #items': {
        visibility: 'hidden',
        position: 'absolute',
      },
    },
  })
);

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  children: JSX.Element;
}

export function MoreMenu({ children, ts }: IProps) {
  const classes = useStyles();
  const iconRef = React.useRef<any>();
  const itemsRef = React.useRef<any>();
  const [left, setLeft] = React.useState(0);
  const [top, setTop] = React.useState(0);
  const [width, setWidth] = React.useState(0);

  const setLocation = () => {
    const { x, y } = elemOffset(iconRef?.current);
    setLeft(x + iconRef?.current?.firstChild?.clientWidth);
    setTop(y - 9);
  };

  React.useEffect(() => {
    setWidth(itemsRef.current.clientWidth);

    setLocation();
    const handleResize = debounce(() => {
      setLocation();
    }, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={classes.moreMenu}>
      <div ref={iconRef}>
        <MoreIcon id="icon" />
      </div>
      <div ref={itemsRef} id="items" style={{ left: left - width, top: top }}>
        {children}
      </div>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

export default connect(mapStateToProps)(MoreMenu);
