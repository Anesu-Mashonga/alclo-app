import { useEffect } from 'react';

export const APP_NAME = 'Alclo';

/**
 * Sets `document.title` to "Title | Alclo" (or just "Alclo" without a title).
 *
 * Pass `false` to leave the current title alone.
 *
 * @param {string | false | null | undefined} title
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (title === false) return;
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
}
