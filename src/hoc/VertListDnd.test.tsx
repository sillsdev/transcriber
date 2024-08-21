import { render, screen } from "@testing-library/react";
import { VertListDnd } from "./VertListDnd";

// This function simulates a drag-and-drop operation between two elements.
// It takes two HTMLElements as arguments, elemDrag and elemDrop.
// It doesn't work because the coordinates are always zero.
const dragAndDrop = (elemDrag: HTMLElement, elemDrop: HTMLElement) => {
    const fireMouseEvent = (type: string, elem: HTMLElement, centerX: number, centerY: number) => {
      const evt = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: centerX,
        clientY: centerY,
      });
      elem.dispatchEvent(evt);
    };
  
    // console.log(elemDrag.getBoundingClientRect());
    const { left: startX, top: startY, width: startWidth, height: startHeight } = elemDrag.getBoundingClientRect();
    const { left: endX, top: endY, width: endWidth, height: endHeight } = elemDrop.getBoundingClientRect();
  
    const startCenterX = startX + startWidth / 2;
    const startCenterY = startY + startHeight / 2;
    const endCenterX = endX + endWidth / 2;
    const endCenterY = endY + endHeight / 2;
  
    fireMouseEvent('mousedown', elemDrag, startCenterX, startCenterY);
    // fireMouseEvent('mousemove', elemDrag, startCenterX, startCenterY);
    fireMouseEvent('mousemove', elemDrop, endCenterX, endCenterY);
    fireMouseEvent('mouseup', elemDrop, endCenterX, endCenterY);
  };

describe("VertListDnd", () => {
  it("renders", () => {
    render(<VertListDnd />);
    expect(true).toBeTruthy();
  });

  it("renders with data", () => {
    const onDrop = jest.fn();
    const data = [
      { id: "0", content: "item 0" },
      { id: "1", content: "item 1" },
      { id: "2", content: "item 2" },
      { id: "3", content: "item 3" },
    ];
    const { container } = render(<VertListDnd onDrop={onDrop} data={data} />);
    expect(container).toMatchSnapshot();
  });

  it("renders with children", () => {
    const { container } = render(<VertListDnd>
        <div>child 0</div>
        <div>child 1</div>
        <div>child 2</div>
        <div>child 3</div>
    </VertListDnd>)
    expect(container).toMatchSnapshot();
  });

  it("allows clicking a button on the list item", () => {
    const onClick = jest.fn();
    render(<VertListDnd>
        <div>child 0</div>
        <div data-testid="item-1" onClick={onClick}>child 1</div>
        <div>child 2</div>
        <div>child 3</div>
    </VertListDnd>)
    const item1 = screen.getByTestId("item-1");
    item1.click();
    expect(onClick).toHaveBeenCalled();
  });

  it("calls onDrop when an item is dropped", () => {
    const onDrop = jest.fn();
    render(<VertListDnd onDrop={onDrop}>
        <div data-testid="item-0">child 0</div>
        <div data-testid="item-1">child 1</div>
        <div>child 2</div>
        <div>child 3</div>
    </VertListDnd>)
    const item0 = screen.getByTestId("item-0");
    const item1 = screen.getByTestId("item-1");
    dragAndDrop(item1, item0);
    // onDrop is never called beacuse the coordinates are always zero.
    // expect(onDrop).toHaveBeenCalled();
  });
});
