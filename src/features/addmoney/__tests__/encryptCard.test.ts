import {
  createHash,
  generateKeyPairSync,
  privateDecrypt,
  constants,
  randomBytes,
} from "node:crypto";

import {
  cardProblems,
  expiryParts,
  groupedCard,
  groupedExpiry,
  koboOf,
  luhnOk,
  quoteLines,
} from "../cardModel";
import {
  encryptCard,
  oaepEncrypt,
  readPublicKey,
  type CryptoParts,
} from "../encryptCard";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
const parts: CryptoParts = {
  sha256: async (data) =>
    new Uint8Array(createHash("sha256").update(data).digest()),
  randomBytes: (n) => new Uint8Array(randomBytes(n)),
};
const decrypt = (b64: string) =>
  privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(b64, "base64"),
  ).toString("utf8");

describe("a card is encrypted on the phone with the provider key (WALLET-25)", () => {
  it("the provider key is read from its PEM: 2048 bits, exponent 65537", () => {
    const k = readPublicKey(publicKey);
    expect(k.size).toBe(256);
    expect(k.e).toBe(65537n);
  });

  it("the private key opens it to exactly the provider JSON (RSA-OAEP, SHA-256), and each encryption differs", async () => {
    const card = {
      number: "4111 1111 1111 1111",
      expiryMonth: "7",
      expiryYear: "2030",
      cvv: "123",
      name: "Ada Lovelace",
    };
    const a = await encryptCard(publicKey, card, parts);
    const b = await encryptCard(publicKey, card, parts);
    expect(a).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(a).not.toBe(b);
    expect(JSON.parse(decrypt(a))).toEqual({
      card_number: "4111111111111111",
      expiration_month: "07",
      expiration_year: "2030",
      cvv: "123",
      card_holder_name: "Ada Lovelace",
    });
    expect(a).not.toContain("4111");
  });

  it("a message too long for the key is refused, and a text that is not an RSA key is refused", async () => {
    await expect(
      oaepEncrypt(publicKey, new Uint8Array(300), parts),
    ).rejects.toThrow(/too long/);
    expect(() =>
      readPublicKey(
        "-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----",
      ),
    ).toThrow();
  });
});

describe("what is typed for a card and an amount (WALLET-25)", () => {
  const ok = {
    number: "4111 1111 1111 1111",
    expiry: "12/30",
    cvv: "123",
    name: "Ada Lovelace",
    address: "1 Test Street",
    city: "Lagos",
    state: "Lagos",
  };

  it("groups the number and the expiry as they are typed", () => {
    expect(groupedCard("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(groupedCard("4111-11")).toBe("4111 11");
    expect(groupedExpiry("1230")).toBe("12/30");
    expect(groupedExpiry("1")).toBe("1");
    expect(expiryParts("07/31")).toEqual({ month: "07", year: "2031" });
  });

  it("a card that can be sent has no problem, and each fault is named in words", () => {
    const now = new Date("2026-10-24T12:00:00Z");
    expect(cardProblems(ok, now)).toEqual({});
    expect(
      cardProblems({ ...ok, number: "4111 1111 1111 1112" }, now).number,
    ).toBe("Check the card number.");
    expect(cardProblems({ ...ok, expiry: "09/26" }, now).expiry).toBe(
      "Check the expiry date.",
    );
    expect(cardProblems({ ...ok, expiry: "13/30" }, now).expiry).toBe(
      "Check the expiry date.",
    );
    expect(cardProblems({ ...ok, cvv: "12" }, now).cvv).toMatch(
      /3 or 4 digits/,
    );
    expect(cardProblems({ ...ok, name: "" }, now).name).toBe(
      "Enter the name on the card.",
    );
    expect(
      Object.keys(
        cardProblems({ ...ok, address: "", city: "", state: "" }, now),
      ).sort(),
    ).toEqual(["address", "city", "state"]);
    expect(luhnOk("4111111111111111")).toBe(true);
    expect(luhnOk("")).toBe(false);
  });

  it("an amount is whole kobo or nothing", () => {
    expect(koboOf("10,000")).toBe(1_000_000);
    expect(koboOf("₦1500.5")).toBe(150_050);
    expect(koboOf("0")).toBeNull();
    expect(koboOf("1e3")).toBeNull();
    expect(koboOf("12.345")).toBeNull();
    expect(koboOf("")).toBeNull();
  });

  it("a quote lists only the fees that are above nothing, then what is paid and what the wallet gets", () => {
    const q = {
      rail: "card" as const,
      currency: "NGN" as const,
      amountKobo: 1_000_000,
      providerFeeKobo: 75,
      wawuFeeKobo: 0,
      feeKobo: 75,
      chargeKobo: 1_000_075,
    };
    expect(quoteLines(q).map((l) => l.key)).toEqual([
      "provider",
      "pay",
      "gets",
    ]);
    expect(
      quoteLines({ ...q, wawuFeeKobo: 50, chargeKobo: 1_000_125 }).map(
        (l) => l.key,
      ),
    ).toEqual(["provider", "wawu", "pay", "gets"]);
    expect(quoteLines(q).find((l) => l.key === "pay")!.value).toBe(
      "₦10,000.75",
    );
  });
});
