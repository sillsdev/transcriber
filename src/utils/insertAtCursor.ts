// See: https://stackoverflow.com/questions/11076975/insert-text-into-textarea-at-cursor-position-javascript

export function insertAtCursor(myField: HTMLTextAreaElement, myValue: string) {
  //IE support is not handled
  //MOZILLA and others
  if (myField.selectionStart || myField.selectionStart === 0) {
    var startPos = myField.selectionStart;
    var endPos = myField.selectionEnd;
    myField.value =
      myField.value.substring(0, startPos) +
      myValue +
      myField.value.substring(endPos, myField.value.length);
  } else {
    myField.value += myValue;
  }
}

export default insertAtCursor;
