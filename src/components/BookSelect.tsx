import React, { PureComponent } from 'react';
import Select from 'react-select';
import keycode from 'keycode';

export interface OptionType {
  label: string;
  value: string;
}

type KeyEvent = React.KeyboardEvent<Element>;

interface IProps {
  value: OptionType;
  suggestions: OptionType[];
  placeHolder?: string;
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

  handleChange(opt: any) {
    const { onCommit, onRevert, setPreventSave } = this.props;
    const { e } = this.state;
    setPreventSave(false);
    if (!opt || e?.which === keycode('ESC')) {
      return onRevert();
    }
    if (e) onCommit(opt.value, e);
    else onCommit(opt.value);
  }

  handleKeyDown(e: KeyEvent) {
    if (e.which === keycode('ESC')) {
      this.props.setPreventSave(false);
      this.props.onRevert();
    }
    // record last key pressed so we can handle enter
    else if ([keycode('ENTER'), keycode('TAB')].indexOf(e.which) !== -1) {
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
        autoFocus
        openOnFocus
        closeOnSelect
        placeholder={this.props.placeHolder || 'Select Book...'}
        value={this.props.value}
        menuShouldScrollIntoView
        onChange={this.handleChange}
        onInputKeyDown={this.handleKeyDown}
        onKeyDown={this.handleKeyDown}
        options={this.props.suggestions}
      />
    );
  }
}

export default SelectEditor;
