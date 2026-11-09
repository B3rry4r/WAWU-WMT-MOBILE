import { Platform } from 'react-native';

/**
 * Whether a bills entry is drawn on this device (WEBAPP-06, R-127, R-47). A bill is paid in a hosted checkout window that needs a native web view and the
 * provider's own page, which a browser cannot hold the way the phone does, and the web build has no bills payment window of its own. So on the web
 * (usewmt.com) there is no Bills entry: Home and the Wallet tab draw none, and the page itself sends a visitor home. Never a button that does nothing.
 */
export const billsOffered = (): boolean => Platform.OS !== 'web';
