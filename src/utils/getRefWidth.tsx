import { RefObject } from 'react';

/**
 * Utility function to calculate the content width of a DOM element
 * by subtracting padding from the client width
 *
 * @param ref - React ref object pointing to a DOM element
 * @returns The content width in pixels, or 0 if ref is null
 */
export const getRefWidth = (ref: RefObject<HTMLElement>): number => {
  if (!ref.current) {
    return 0;
  }

  // Get the computed style to account for padding
  const computedStyle = window.getComputedStyle(ref.current);
  const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(computedStyle.paddingRight) || 0;

  // Calculate content width by subtracting padding from client width
  const contentWidth = ref.current.clientWidth - paddingLeft - paddingRight;

  return contentWidth;
};
