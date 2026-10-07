/** Rough localStorage quota most browsers give one site (characters). */
export const STORAGE_QUOTA = 5 * 1024 * 1024;

/**
 * Characters this site keeps in localStorage. Browsers count quota in UTF-16 characters,
 * so this is a fair stand-in for bytes used against the ~5 MB budget.
 * @returns {number}
 */
export function measureLocalStorage() {
  try {
    let total = 0;
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) ?? '';
      total += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
    return total;
  } catch {
    return 0;
  }
}

/** 152000 -> "148 KB", 2400000 -> "2.3 MB". */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Starts a download of `data` as pretty-printed JSON.
 * @param {unknown} data
 * @param {string} filename
 */
export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const FLASH_KEY = 'alclo.flash';

/** Leaves a message for the next page load (used before a full reload). */
export function setFlashMessage(message) {
  try {
    sessionStorage.setItem(FLASH_KEY, message);
  } catch {
    /* storage unavailable: the reload simply has no message */
  }
}

/** Reads and clears the message left by setFlashMessage, if any. */
export function takeFlashMessage() {
  try {
    const message = sessionStorage.getItem(FLASH_KEY);
    if (message) sessionStorage.removeItem(FLASH_KEY);
    return message;
  } catch {
    return null;
  }
}
