import Transcriber from '@material-ui/icons/ReceiptOutlined';
import Editor from '@material-ui/icons/RateReviewOutlined';
import { IconButton } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { IState } from '../model/state';
import { ISharedStrings } from '../model';
import localStrings from '../selector/localize';

interface IStateProps {
  ts: ISharedStrings;
}
interface IProps extends IStateProps {}

const mapStateToProps = (state: IState): IStateProps => ({
  ts: localStrings(state, { layout: 'shared' }),
});

const TranscriberIconSnippet: FunctionComponent<IProps> = ({ ts }) => (
  <IconButton title={ts.transcriber}>
    <Transcriber />
  </IconButton>
);
export const TranscriberIcon = connect(mapStateToProps)(TranscriberIconSnippet);

const EditorIconSnippet: FunctionComponent<IProps> = ({ ts }) => (
  <IconButton title={ts.editor}>
    <Editor />
  </IconButton>
);
export const EditorIcon = connect(mapStateToProps)(EditorIconSnippet);
