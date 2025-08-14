import React, { PureComponent } from 'react';
import Select from 'react-select';

export interface OptionType {
  label: string;
  value: string;
}

type KeyEvent = React.KeyboardEvent<Element>;

interface IProps {
  value?: OptionType;
  suggestions: OptionType[];
  placeHolder?: string;
  autoFocus?: boolean;
  onCommit: (newValue: string, e?: KeyEvent) => void;
  onRevert: () => void;
  setPreventSave: (v: boolean) => void;
}

interface SelectState {
  e: KeyEvent | null;
}

const initState: SelectState = {
  e: null,
};

class SelectEditor extends PureComponent<IProps, SelectState> {
  constructor(props: IProps) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.state = { ...initState };
    this.props.setPreventSave(true);
  }

  handleMenuClose = () => {
    this.props.setPreventSave(false);
  };

  handleChange(opt: any) {
    const { onCommit, onRevert, setPreventSave } = this.props;
    const { e } = this.state;
    setPreventSave(false);
    if (!opt || e?.key === 'ESC') {
      return onRevert();
    }
    if (e) onCommit(opt.value, e);
    else onCommit(opt.value);
  }

  handleKeyDown(e: KeyEvent) {
    if (e.key === 'ESC') {
      this.props.setPreventSave(false);
      this.props.onRevert();
    }
    // record last key pressed so we can handle enter
    else if (['ENTER', 'TAB'].indexOf(e.key) !== -1) {
      e.persist();
      this.setState({ e });
    } else {
      e.persist();
      this.setState({ e: null });
    }
  }

  render() {
    return (
      <Select
        autoFocus={this.props.autoFocus ?? true}
        openMenuOnFocus
        closeMenuOnSelect
        placeholder={this.props.placeHolder || 'Select Book...'}
        value={this.props.value}
        menuShouldScrollIntoView
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        onMenuClose={this.handleMenuClose}
        options={this.props.suggestions}
      />
    );
  }
}

export default SelectEditor;
