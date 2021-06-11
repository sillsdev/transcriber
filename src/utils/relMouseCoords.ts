// https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
export function elemOffset(elem: HTMLElement) {
  let totalOffsetX = 0;
  let totalOffsetY = 0;
  let currentElement: HTMLElement | null = elem;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  } while (
    (currentElement = currentElement.offsetParent as HTMLElement | null)
  );
  return { x: totalOffsetX, y: totalOffsetY };
}

export function relMouseCoords(event: React.MouseEvent, elem: HTMLElement) {
  const { x, y } = elemOffset(elem);
  return { x: event.pageX - x, y: event.pageY - y };
}

export default relMouseCoords;
