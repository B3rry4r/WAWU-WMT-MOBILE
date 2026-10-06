/**
 * Puts A8's account number on the clipboard in the browser (the web build):
 * the asynchronous Clipboard API, which a page may use from a tap. False when
 * the browser refuses, so the button never says "Copied" for nothing.
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
