import React, { CSSProperties, HTMLAttributes, useEffect } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Select from 'react-select';
import { ValueContainerProps } from 'react-select/src/components/containers';
import { ControlProps } from 'react-select/src/components/Control';
import { MenuProps, NoticeProps } from 'react-select/src/components/Menu';
import { MultiValueProps } from 'react-select/src/components/MultiValue';
import { OptionProps } from 'react-select/src/components/Option';
import { PlaceholderProps } from 'react-select/src/components/Placeholder';
import { SingleValueProps } from 'react-select/src/components/SingleValue';
import { ValueType } from 'react-select/src/types';
import {
  createStyles,
  makeStyles,
  useTheme,
  Theme,
} from '@material-ui/core/styles';
import { Typography, NoSsr, Paper, Chip, MenuItem } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import TextField, { BaseTextFieldProps } from '@material-ui/core/TextField';
import { emphasize } from '@material-ui/core/styles/colorManipulator';

export interface OptionType {
  label: string;
  value: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      height: 250,
    },
    noExtraRoot: {
      flexGrow: 0,
      height: 'inherit',
      paddingBottom: theme.spacing(1),
    },
    input: {
      display: 'flex',
      padding: 0,
      height: 'auto',
    },
    valueContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      flex: 1,
      alignItems: 'center',
      overflow: 'hidden',
    },
    chip: {
      margin: theme.spacing(0.5, 0.25),
    },
    chipFocused: {
      backgroundColor: emphasize(
        theme.palette.type === 'light'
          ? theme.palette.grey[300]
          : theme.palette.grey[700],
        0.08
      ),
    },
    noOptionsMessage: {
      padding: theme.spacing(1, 2),
    },
    singleValue: {
      fontSize: 16,
    },
    placeholder: {
      position: 'absolute',
      left: 2,
      bottom: 6,
      fontSize: 16,
    },
    paper: {
      position: 'absolute',
      zIndex: 1,
      marginTop: theme.spacing(1),
      left: 0,
      right: 0,
    },
    divider: {
      height: theme.spacing(2),
    },
  })
);

function NoOptionsMessage(props: NoticeProps<OptionType>) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

NoOptionsMessage.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object.isRequired,
} as any;

type InputComponentProps = Pick<BaseTextFieldProps, 'inputRef'> &
  HTMLAttributes<HTMLDivElement>;

function inputComponent({ inputRef, ...props }: InputComponentProps) {
  return <div ref={inputRef} {...props} />;
}

inputComponent.propTypes = {
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
} as any;

function Control(props: ControlProps<OptionType>) {
  const {
    children,
    innerProps,
    innerRef,
    selectProps: { classes, TextFieldProps },
  } = props;

  return (
    <TextField
      fullWidth
      InputProps={{
        inputComponent,
        inputProps: {
          className: classes.input,
          ref: innerRef,
          children,
          ...innerProps,
        },
      }}
      {...TextFieldProps}
    />
  );
}

Control.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  selectProps: PropTypes.object.isRequired,
} as any;

function Option(props: OptionProps<OptionType>) {
  return (
    <MenuItem
      ref={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

Option.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  isFocused: PropTypes.bool,
  isSelected: PropTypes.bool,
} as any;

function Placeholder(props: PlaceholderProps<OptionType>) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

Placeholder.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object.isRequired,
} as any;

function SingleValue(props: SingleValueProps<OptionType>) {
  return (
    <Typography
      className={props.selectProps.classes.singleValue}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

SingleValue.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object.isRequired,
} as any;

function ValueContainer(props: ValueContainerProps<OptionType>) {
  return (
    <div className={props.selectProps.classes.valueContainer}>
      {props.children}
    </div>
  );
}

ValueContainer.propTypes = {
  children: PropTypes.node,
  selectProps: PropTypes.object.isRequired,
} as any;

function MultiValue(props: MultiValueProps<OptionType>) {
  return (
    <Chip
      tabIndex={-1}
      label={props.children}
      className={clsx(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={props.removeProps.onClick}
      deleteIcon={<CancelIcon {...props.removeProps} />}
    />
  );
}

MultiValue.propTypes = {
  children: PropTypes.node,
  isFocused: PropTypes.bool,
  removeProps: PropTypes.object.isRequired,
  selectProps: PropTypes.object.isRequired,
} as any;

function Menu(props: MenuProps<OptionType>) {
  return (
    <Paper
      square
      className={props.selectProps.classes.paper}
      {...props.innerProps}
    >
      {props.children}
    </Paper>
  );
}

Menu.propTypes = {
  children: PropTypes.node,
  innerProps: PropTypes.object,
  selectProps: PropTypes.object,
} as any;

const components = {
  Control,
  Menu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};

interface IProps {
  suggestions: OptionType[];
  label?: string;
  placeholder?: string;
  current?: number | null;
  rightSize?: boolean;
  onCommit?: (newValue: string, callback: () => void) => void;
}

export function SingleReactSelect(props: IProps) {
  const {
    suggestions,
    label,
    placeholder,
    current,
    onCommit,
    rightSize,
  } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [single, setSingle] = React.useState<ValueType<OptionType>>(null);

  useEffect(() => {
    if (
      current != null &&
      current !== undefined &&
      current >= 0 &&
      suggestions.length > current
    ) {
      setSingle(suggestions[current]);
    } else if (current === null) {
      setSingle(null);
    }
  }, [suggestions, current]);

  function handleChangeSingle(value: ValueType<OptionType>) {
    if (onCommit && value) {
      onCommit((value as OptionType).value, () => setSingle(value));
    } else {
      setSingle(value);
    }
  }

  const selectStyles = {
    input: (base: CSSProperties) => ({
      ...base,
      color: theme.palette.text.primary,
      '& input': {
        font: 'inherit',
      },
    }),
  };

  return (
    <div
      className={clsx(classes.root, {
        [classes.noExtraRoot]: rightSize,
      })}
    >
      <NoSsr>
        <Select
          classes={classes}
          styles={selectStyles}
          inputId="react-select-single"
          autoFocus
          TextFieldProps={{
            label,
            InputLabelProps: {
              htmlFor: 'react-select-single',
              shrink: true,
            },
            placeholder,
          }}
          options={suggestions}
          components={components}
          value={single}
          onChange={handleChangeSingle}
        />
      </NoSsr>
    </div>
  );
}

export function MultiReactSelect(props: IProps) {
  const { suggestions, label, placeholder } = props;
  const classes = useStyles();
  const theme = useTheme();
  const [multi, setMulti] = React.useState<ValueType<OptionType>>(null);

  function handleChangeMulti(value: ValueType<OptionType>) {
    setMulti(value);
  }

  const selectStyles = {
    input: (base: CSSProperties) => ({
      ...base,
      color: theme.palette.text.primary,
      '& input': {
        font: 'inherit',
      },
    }),
  };

  return (
    <div className={classes.root}>
      <NoSsr>
        <Select
          classes={classes}
          styles={selectStyles}
          inputId="react-select-multiple"
          autoFocus
          TextFieldProps={{
            label,
            InputLabelProps: {
              htmlFor: 'react-select-multiple',
              shrink: true,
            },
            placeholder,
          }}
          options={suggestions}
          components={components}
          value={multi}
          onChange={handleChangeMulti}
          isMulti
        />
      </NoSsr>
    </div>
  );
}

export default SingleReactSelect;
