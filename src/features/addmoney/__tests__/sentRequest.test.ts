import {
  dropSent,
  keepSent,
  readSent,
  SENT_KEEP_MS,
  sentKey,
  type SentRequest,
} from "../sentRequest";

const mockVault = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (k: string) => mockVault.get(k) ?? null),
  setItemAsync: jest.fn(
    async (k: string, v: string) => void mockVault.set(k, v),
  ),
  deleteItemAsync: jest.fn(async (k: string) => void mockVault.delete(k)),
}));

/* The one request of an attempt survives the screen going away (WALLET-25 fix round 1, F1): the same key and the same scrambled card. */
const NOW = 1_790_000_000_000;
const request: SentRequest = {
  key: "key-1",
  rail: "card",
  amountKobo: 1_000_000,
  chargeKobo: 1_000_075,
  card: {
    encrypted: "SCRAMBLED-1",
    billing: { line1: "1 Test Street", city: "Lagos", state: "Lagos" },
  },
  at: NOW,
};

beforeEach(() => mockVault.clear());

describe("the request kept for an attempt", () => {
  it("is read back as it was kept, for the same account only, and is gone once dropped", async () => {
    expect(await keepSent("owner-1", request)).toBe(true);
    expect(await readSent("owner-1", NOW + 1000)).toEqual(request);
    expect(await readSent("owner-2", NOW + 1000)).toBeNull();
    await dropSent("owner-1");
    expect(await readSent("owner-1", NOW + 1000)).toBeNull();
  });

  it("is not trusted past the time the Hub keeps a key, and a damaged or half-written record reads as nothing", async () => {
    await keepSent("owner-1", request);
    expect(await readSent("owner-1", NOW + SENT_KEEP_MS + 1)).toBeNull();
    mockVault.set(sentKey("owner-1"), '{"key":"k"');
    expect(await readSent("owner-1", NOW)).toBeNull();
    mockVault.set(
      sentKey("owner-1"),
      JSON.stringify({ ...request, card: undefined }),
    );
    expect(await readSent("owner-1", NOW)).toBeNull();
  });

  it("keeps nothing for a signed-out phone", async () => {
    expect(await keepSent(null, request)).toBe(false);
    expect(await readSent(null)).toBeNull();
  });
});
