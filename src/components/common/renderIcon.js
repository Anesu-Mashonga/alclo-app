import { createElement, isValidElement } from 'react';

/**
 * Accept an icon as an element (<CheckroomOutlined />) or a component (CheckroomOutlined)
 * and return an element. Decorative by default.
 *
 * @param {import('react').ReactNode | import('react').ElementType} icon
 * @param {object} [props]
 */
export default function renderIcon(icon, props) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  return createElement(icon, { 'aria-hidden': true, ...props });
}
