import Transcriber from '@material-ui/icons/ReceiptOutlined';
import Editor from '@material-ui/icons/RateReviewOutlined';
import { Tooltip } from '@material-ui/core';
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
  <Tooltip title={ts.transcriber}>
    <>
      <Transcriber />
      {'\u00A0'}
    </>
  </Tooltip>
);
export const TranscriberIcon = connect(mapStateToProps)(TranscriberIconSnippet);

const EditorIconSnippet: FunctionComponent<IProps> = ({ ts }) => (
  <Tooltip title={ts.editor}>
    <>
      <Editor />
      {'\u00A0'}
    </>
  </Tooltip>
);
export const EditorIcon = connect(mapStateToProps)(EditorIconSnippet);
