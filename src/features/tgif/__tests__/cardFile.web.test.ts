import { canShareCard, saveCardFile, shareCardFile, writeCard } from '../cardFile.web';

describe('H35 · the web build has no share sheet or photo library for the card', () => {
  it('says it cannot share, so the sheet draws WhatsApp and Chat only, as it did before', async () => {
    expect(await canShareCard()).toBe(false);
  });

  it('refuses to write, share or save a card', async () => {
    expect(() => writeCard({ blob: {} as Blob, uri: 'data:image/png;base64,AAAA' }, '2025-09-26')).toThrow();
    await expect(shareCardFile('file:///a.png', 'x')).rejects.toThrow();
    await expect(saveCardFile('file:///a.png')).rejects.toThrow();
  });
});
