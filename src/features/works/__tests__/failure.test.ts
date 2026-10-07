import { ApiError } from '@/api/errors';

import { readFailure, saveFailure, uploadFailure } from '../failure';
import { UPLOAD_FAILED } from '../upload';

describe('saveFailure', () => {
  it('puts the Hub\'s sentence under the field it is about', () => {
    expect(saveFailure(new ApiError('validation', 400, 'Year must be a year from 1950 to 2027'))).toEqual({ field: 'year', message: 'Year must be a year from 1950 to 2027' });
  });

  it('puts a refusal that is about no field in the banner, in the Hub\'s words', () => {
    const cap = 'A profile can feature at most 50 works. Remove one to add another.';
    expect(saveFailure(new ApiError('validation', 400, cap))).toEqual({ banner: cap });
  });

  it('says there is no connection in the server\'s own sentence, and anything else in one plain one', () => {
    expect(saveFailure(new ApiError('network', 0, 'No connection. Check your internet and try again.'))).toEqual({ banner: 'No connection. Check your internet and try again.' });
    expect(saveFailure(new ApiError('server', 500, 'boom'))).toEqual({ banner: 'Your work did not save. Try again.' });
    expect(saveFailure(new Error('x'))).toEqual({ banner: 'Your work did not save. Try again.' });
  });
});

describe('readFailure', () => {
  it('keeps the connection sentence and softens the rest', () => {
    expect(readFailure(new ApiError('network', 0, 'No connection. Check your internet and try again.'))).toBe('No connection. Check your internet and try again.');
    expect(readFailure(new ApiError('server', 500, 'boom'))).toBe('Something went wrong. Try again.');
  });
});

describe('uploadFailure', () => {
  it('names no connection, and the storage refusing the file, in their own sentences', () => {
    expect(uploadFailure(new ApiError('network', 0, 'No connection. Check your internet and try again.'))).toBe('No connection. Check your internet and try again.');
    expect(uploadFailure(new ApiError('server', 403, 'That file did not upload. Try again.', UPLOAD_FAILED))).toBe('That file did not upload. Try again.');
  });

  it('says a file is too big when the Hub says so (413), without the Hub\'s folder name or a figure of its own', () => {
    const text = uploadFailure(new ApiError('unknown', 413, 'A file in profile/work can be at most 100MB.'));
    expect(text).toBe('That file is too big to add.');
    expect(text).not.toMatch(/profile\/work|100/);
  });

  it('says a kind of file is not taken, without the Hub\'s folder name', () => {
    const text = uploadFailure(new ApiError('validation', 400, 'image/gif is not allowed in profile/work. Allowed: image/png, image/jpeg, image/webp, video/mp4.'));
    expect(text).toBe('That kind of file cannot be added. Choose a photo or a video.');
  });

  it('gives one plain sentence for anything else', () => {
    expect(uploadFailure(new ApiError('validation', 400, 'contentLength must not be less than 1'))).toBe('That file did not upload. Try again.');
    expect(uploadFailure(new ApiError('server', 503, 'File uploads are not available on this environment yet.'))).toBe('That file did not upload. Try again.');
  });
});
