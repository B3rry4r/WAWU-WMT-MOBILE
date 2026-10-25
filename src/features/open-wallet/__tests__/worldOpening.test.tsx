/* eslint-disable @typescript-eslint/no-require-imports */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as rtl from "@testing-library/react-native";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

/*
 * KYC-07: the review opening's chain from A31 to A26. Under it the Hub has no BVN check (it answers `step_not_used`),
 * so A31 holds the BVN and NIN in memory, the details step takes the name, and Submit sends them all in the open call.
 */
const mockVault = new Map<string, string>();
const mockStored: string[] = [];
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockVault.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStored.push(`${key}=${value}`);
    mockVault.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockVault.delete(key);
  }),
}));

type Reply = { status: number; body: unknown };
type Sent = { method: string; path: string; body: string };

const OWNER = "00000000-0000-4000-8000-0000000000b7";
let sent: Sent[] = [];
let fallback: Record<string, Reply> = {};
let optionsFor: ((country: string) => Reply) | null = null;

const ok = (data: unknown): Reply => ({
  status: 200,
  body: { statusCode: 200, message: "OK", data },
});
const me = {
  wawuUserId: OWNER,
  phone: "+442071234567",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Eze",
};

globalThis.fetch = jest.fn(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const request =
      input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(request.url).pathname;
    sent.push({
      method: request.method,
      path,
      body: await request.clone().text(),
    });
    const answer =
      optionsFor && path.endsWith("/money/world/options")
        ? optionsFor(new URL(request.url).searchParams.get("country") ?? "")
        : fallback[`${request.method} ${path.replace(/^\/api\/hub/, "")}`];
    if (!answer) throw new Error(`no answer for ${request.method} ${path}`);
    return new Response(JSON.stringify(answer.body), {
      status: answer.status,
      headers: { "content-type": "application/json" },
    });
  },
) as typeof fetch;

// Under load the first screen needs longer than the default second to appear (WALLET-41 low): the waits are longer, the checks the same.
rtl.configure({ asyncUtilTimeout: 5000 });

const { OpenWalletScreen } =
  require("../OpenWalletScreen") as typeof import("../OpenWalletScreen");
const { ReviewDetailsForm } =
  require("../ReviewDetailsForm") as typeof import("../ReviewDetailsForm");
const kept = require("../keptCheck") as typeof import("../keptCheck");
const submit = require("../submit") as typeof import("../submit");

const clients: QueryClient[] = [];
/** The country on the account, as WAWU ID's `countryCode` claim carries it; none by default. */
let residenceClaim: string | undefined;
const tokenFor = (sub: string) => {
  const part = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const claims = residenceClaim
    ? { sub, countryCode: residenceClaim }
    : { sub };
  return `${part({ alg: "RS256" })}.${part(claims)}.signature`;
};

const COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "GH", name: "Ghana" },
  { code: "KP", name: "North Korea" },
  { code: "NG", name: "Nigeria" },
  { code: "US", name: "United States" },
];
const CHOICES = [
  { code: "USD", name: "US dollar", enabled: true },
  { code: "EUR", name: "Euro", enabled: true },
  { code: "GBP", name: "British pound", enabled: true },
  { code: "CAD", name: "Canadian dollar", enabled: false },
  { code: "AED", name: "UAE dirham", enabled: true },
  { code: "GHS", name: "Ghana cedi", enabled: true },
];
const options = (country: string, over: Record<string, unknown> = {}) =>
  ok({
    country,
    abroad: country !== "NG",
    available: true,
    unavailableReason: null,
    suggested: country === "GB" ? "GBP" : "USD",
    choices: CHOICES,
    openFee: { currency: "USD", amountMinor: 0 },
    ...over,
  });

function serve() {
  fallback = {
    "GET /users/me": ok(me),
    "GET /money/wallet": ok({
      state: "not_open",
      openingFlow: "review",
      review: null,
      accountNumberStatus: "none",
    }),
    "GET /money/identity": ok({
      bvn: null,
      ninLast4: null,
      occupation: null,
      checksLeft: 3,
    }),
    "GET /money/world/countries": ok({ countries: COUNTRIES }),
    "GET /money/world/options": options("GB"),
  };
}
/** The options answer follows the country asked about, as the Hub's does. */
function serveOptionsByCountry() {
  optionsFor = (country) =>
    country === "KP"
      ? options("KP", {
          available: false,
          unavailableReason: "country_blocked",
        })
      : options(country);
}

async function boot(
  child: (onContinue: jest.Mock, onClose: jest.Mock) => ReactElement,
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  const onClose = jest.fn();
  const onContinue = jest.fn();
  await rtl.render(
    <QueryClientProvider client={client}>
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        {child(onContinue, onClose)}
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
  return { ...rtl, onClose, onContinue };
}

beforeAll(async () => {
  const warm = await rtl.render(<></>);
  warm.unmount();
});

beforeEach(() => {
  residenceClaim = undefined;
  sent = [];
  optionsFor = null;
  mockStored.length = 0;
  mockVault.clear();
  residenceClaim = residenceClaim ?? undefined;
  mockVault.set("wawu.session.access", tokenFor(OWNER));
  mockVault.set("wawu.session.refresh", "refresh-1");
  kept.forgetKeptCheck();
  (
    require("@/api/session") as typeof import("@/api/session")
  ).resetSessionForTests();
});

afterEach(async () => {
  await rtl.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await rtl.cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

describe("A31 for a person whose number is from outside Nigeria", () => {
  it("asks where they live first, offers the country’s own currency, and goes on to the details with no BVN asked", async () => {
    serve();
    serveOptionsByCountry();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    expect(await app.screen.findByText("Where do you live?")).toBeTruthy();
    expect(app.screen.queryByTestId("open-wallet-bvn")).toBeNull();
    // The title is drawn at once; the country field only once the Hub's list of countries has come (under load, later): wait for it.
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-country-field"),
    );
    await rtl.fireEvent.press(await app.screen.findByTestId("country-GB"));
    // The country's own currency, from the Hub's table, is already chosen.
    expect(await app.screen.findByText("British pound")).toBeTruthy();
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(kept.readWorld(OWNER)).toEqual({ country: "GB", currency: "GBP" });
    // The numbers are held empty: every later step reads it as the review opening, and there is nothing to send.
    expect(kept.readNumbers(OWNER)).toEqual({ bvn: "", nin: "" });
    expect(sent.filter((s) => s.method === "POST")).toHaveLength(0);
  });

  it("the person may pick another first currency, but only one that is on", async () => {
    serve();
    serveOptionsByCountry();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-country-field"),
    );
    await rtl.fireEvent.press(await app.screen.findByTestId("country-US"));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-currency-field"),
    );
    expect(app.screen.queryByTestId("open-wallet-currency-CAD")).toBeNull();
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-currency-EUR"),
    );
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(kept.readWorld(OWNER)).toEqual({ country: "US", currency: "EUR" });
  });

  it("Nigeria goes on to the BVN and NIN as ever, and holds no country", async () => {
    serve();
    serveOptionsByCountry();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-country-field"),
    );
    await rtl.fireEvent.press(await app.screen.findByTestId("country-NG"));
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    expect(await app.screen.findByTestId("open-wallet-bvn")).toBeTruthy();
    expect(kept.readWorld(OWNER)).toBeNull();
    expect(app.onContinue).not.toHaveBeenCalled();
  });

  it("a country the Hub holds back is told plainly and Continue does nothing", async () => {
    serve();
    serveOptionsByCountry();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-country-field"),
    );
    await rtl.fireEvent.press(await app.screen.findByTestId("country-KP"));
    expect(
      await app.screen.findByText(
        "We cannot open a wallet for a person in this country yet.",
      ),
    ).toBeTruthy();
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    expect(app.onContinue).not.toHaveBeenCalled();
    expect(kept.readWorld(OWNER)).toBeNull();
  });

  it("the list can be narrowed by typing", async () => {
    serve();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-country-field"),
    );
    await rtl.fireEvent.changeText(
      await app.screen.findByTestId("country-search"),
      "ghan",
    );
    expect(await app.screen.findByTestId("country-GH")).toBeTruthy();
    expect(app.screen.queryByTestId("country-US")).toBeNull();
  });
});

describe("residence decides, not the phone (round 1)", () => {
  it("an account that lives in the United Kingdom is shown that country, not a list, and goes on with it", async () => {
    residenceClaim = "GB";
    mockVault.set("wawu.session.access", tokenFor(OWNER));
    serve();
    serveOptionsByCountry();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    expect(await app.screen.findByText("United Kingdom")).toBeTruthy();
    expect(await app.screen.findByText("British pound")).toBeTruthy();
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(kept.readWorld(OWNER)).toEqual({ country: "GB", currency: "GBP" });
  });

  it("an account that lives in Nigeria goes to the BVN even with a number from another country", async () => {
    residenceClaim = "NG";
    mockVault.set("wawu.session.access", tokenFor(OWNER));
    serve();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    expect(await app.screen.findByTestId("open-wallet-bvn")).toBeTruthy();
    expect(app.screen.queryByTestId("open-wallet-country")).toBeNull();
  });

  it("the claim is read as the Hub reads it: two letters, any case, or nothing", () => {
    const { countryCodeOfToken } =
      require("../sessionAccount") as typeof import("../sessionAccount");
    const t = (claims: object) => {
      const part = (v: object) =>
        Buffer.from(JSON.stringify(v)).toString("base64url");
      return `${part({ alg: "RS256" })}.${part(claims)}.x`;
    };
    expect(countryCodeOfToken(t({ sub: "a", countryCode: "gb" }))).toBe("GB");
    expect(
      countryCodeOfToken(t({ sub: "a", countryCode: "United Kingdom" })),
    ).toBeNull();
    expect(countryCodeOfToken(t({ sub: "a", country: "GB" }))).toBeNull();
    expect(countryCodeOfToken(null)).toBeNull();
  });
});

describe("the first account asked for on the way in (RELEASE-02 fix round 1, R-87)", () => {
  /** A Ghana account, as "Add a dollar account" on /tiers leads to it: the cedi is the country's own, the dollar is asked for. */
  const ghana = () => {
    residenceClaim = "GH";
    mockVault.set("wawu.session.access", tokenFor(OWNER));
    serve();
    optionsFor = (country) => options(country, { suggested: "GHS" });
  };

  it("a person from Ghana sent to add a dollar account sees US dollar as Your first account, not the cedi, and goes on with USD", async () => {
    ghana();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen
        onClose={onClose}
        onContinue={onContinue}
        firstCurrency="USD"
      />
    ));
    expect(await app.screen.findByText("Ghana")).toBeTruthy();
    expect(await app.screen.findByText("US dollar")).toBeTruthy();
    expect(app.screen.queryByText("Ghana cedi")).toBeNull();
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(kept.readWorld(OWNER)).toEqual({ country: "GH", currency: "USD" });
  });

  it("the same person sent in with no currency asked for is offered the cedi, the country's own", async () => {
    ghana();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    expect(await app.screen.findByText("Ghana cedi")).toBeTruthy();
    expect(app.screen.queryByText("US dollar")).toBeNull();
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(kept.readWorld(OWNER)).toEqual({ country: "GH", currency: "GHS" });
  });

  it("a currency the Hub has switched off is not used: the country's own is offered instead", async () => {
    ghana();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen
        onClose={onClose}
        onContinue={onContinue}
        firstCurrency="CAD"
      />
    ));
    expect(await app.screen.findByText("Ghana cedi")).toBeTruthy();
    expect(app.screen.queryByText("Canadian dollar")).toBeNull();
  });

  it("the person may still change it: the choice they make wins over the one asked for", async () => {
    ghana();
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen
        onClose={onClose}
        onContinue={onContinue}
        firstCurrency="USD"
      />
    ));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-currency-field"),
    );
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-currency-GHS"),
    );
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-country-continue"),
    );
    await rtl.waitFor(() => expect(app.onContinue).toHaveBeenCalledTimes(1));
    expect(kept.readWorld(OWNER)).toEqual({ country: "GH", currency: "GHS" });
  });
});

describe("a refused opening names its fields (round 1)", () => {
  const { markFields } =
    require("../hubFields") as typeof import("../hubFields");
  const { toApiError } =
    require("@/api/errors") as typeof import("@/api/errors");
  it("keeps reason.fields on the error, and only names", () => {
    const e = toApiError(409, {
      statusCode: 409,
      message: "Check this and try again.",
      reason: {
        code: "account_not_opened",
        message: "Check this and try again.",
        fields: ["person.ssn", "address.postal_code", 7, "bad name!"],
      },
    });
    expect(e.detail?.fields).toEqual(["person.ssn", "address.postal_code"]);
  });
  it("marks exactly the fields the screen has, lists the rest in plain words, drops none", () => {
    const marks = markFields(
      [
        "address.postal_code",
        "person.ssn",
        "identification.document.number",
        "person.date_of_birth",
        "address.line_1",
        "person.favourite_colour",
      ],
      ["address", "postalCode", "proofType"],
    );
    expect(marks.keys).toEqual(["postalCode", "address"]);
    expect(marks.elsewhere).toEqual([
      "Social security number",
      "ID number",
      "Date of birth",
      "Favourite colour",
    ]);
  });
  it("a field the app does not know is shown humanised, never hidden", () => {
    expect(markFields(["person.tax_id"], []).elsewhere).toEqual(["Tax number"]);
    expect(markFields(undefined, ["address"])).toEqual({
      keys: [],
      elsewhere: [],
    });
  });
});

describe("a Nigerian number is not asked where it lives", () => {
  it("goes straight to the BVN", async () => {
    serve();
    fallback["GET /users/me"] = ok({ ...me, phone: "+2348031234412" });
    const app = await boot((onContinue, onClose) => (
      <OpenWalletScreen onClose={onClose} onContinue={onContinue} />
    ));
    expect(await app.screen.findByTestId("open-wallet-bvn")).toBeTruthy();
    expect(app.screen.queryByTestId("open-wallet-country")).toBeNull();
  });
  it("isAbroadNumber: a code that is not +234 is abroad; +234 and a local form are not", () => {
    const { isAbroadNumber } =
      require("../OpenWalletScreen") as typeof import("../OpenWalletScreen");
    expect(isAbroadNumber("+442071234567")).toBe(true);
    expect(isAbroadNumber("+12125550198")).toBe(true);
    expect(isAbroadNumber("+2348031234412")).toBe(false);
    expect(isAbroadNumber("08031234412")).toBe(false);
  });
});

describe("the details step for a person outside Nigeria", () => {
  const held = () => {
    const ticket = kept.ticketFor(OWNER);
    kept.keepWorld(ticket, { country: "US", currency: "USD" });
    const review = {
      numbers: { bvn: "", nin: "" },
      person: null,
      address: null,
      world: { country: "US", currency: "USD" as const },
    };
    return { ticket, review };
  };

  it("takes the state or province as typed, with no Nigerian list, and keeps it for the open call", async () => {
    serve();
    const { review } = held();
    const app = await boot((onContinue, onClose) => (
      <ReviewDetailsForm
        owner={OWNER}
        held={review}
        onBack={onClose}
        onContinue={onContinue}
      />
    ));
    expect(app.screen.queryByTestId("open-wallet-state")).toBeNull();
    await rtl.fireEvent.changeText(
      await app.screen.findByTestId("open-wallet-first-name"),
      "Alex",
    );
    await rtl.fireEvent.changeText(
      app.screen.getByTestId("open-wallet-last-name"),
      "Johnson",
    );
    await rtl.fireEvent.changeText(
      app.screen.getByTestId("open-wallet-birth"),
      "12041990",
    );
    await rtl.fireEvent.press(app.screen.getByTestId("open-wallet-gender"));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-gender-male"),
    );
    await rtl.fireEvent.changeText(
      app.screen.getByTestId("open-wallet-city"),
      "New York",
    );
    await rtl.fireEvent.changeText(
      app.screen.getByTestId("open-wallet-state-text"),
      "New York",
    );
    await rtl.fireEvent.press(
      app.screen.getByTestId("open-wallet-details-continue"),
    );
    // The consent box is still asked for.
    expect(
      await app.screen.findByText("Tick the box to agree before you continue."),
    ).toBeTruthy();
    expect(app.onContinue).not.toHaveBeenCalled();
  });

  it("a missing state asks for it in words for a province too", async () => {
    serve();
    const { review } = held();
    const app = await boot((onContinue, onClose) => (
      <ReviewDetailsForm
        owner={OWNER}
        held={review}
        onBack={onClose}
        onContinue={onContinue}
      />
    ));
    await rtl.fireEvent.press(
      await app.screen.findByTestId("open-wallet-details-continue"),
    );
    expect(
      await app.screen.findByText("Enter your state, province or region."),
    ).toBeTruthy();
  });
});

describe("the open call for a person outside Nigeria", () => {
  const fields = {
    address: "210 West 77th Street",
    postalCode: "10024",
    idType: "international_passport",
    idNumber: "P123456789",
    proofType: "utility_bill",
    idFront: null,
    idBack: null,
    proof: null,
  };
  it("carries the country and the first currency and no BVN or NIN", () => {
    const ticket = kept.ticketFor(OWNER);
    kept.keepWorld(ticket, { country: "DE", currency: "EUR" });
    kept.keepPerson(
      ticket,
      {
        firstName: "Ada",
        lastName: "Eze",
        dateOfBirth: "1990-04-12",
        gender: "female",
      },
      { street: "", city: "Berlin", state: "Berlin" },
    );
    const details = submit.detailsFromKept(
      OWNER,
      fields as unknown as Parameters<typeof submit.detailsFromKept>[1],
    );
    expect(details).toMatchObject({
      countryCode: "DE",
      firstCurrency: "EUR",
      city: "Berlin",
      state: "Berlin",
      idType: "international_passport",
    });
    expect(details).not.toHaveProperty("bvn");
    expect(details).not.toHaveProperty("nin");
  });
  it("a Nigerian opening still sends both numbers and no country", () => {
    const ticket = kept.ticketFor(OWNER);
    kept.keepNumbers(ticket, { bvn: "22190000111", nin: "70190000999" });
    kept.keepPerson(
      ticket,
      {
        firstName: "Ada",
        lastName: "Eze",
        dateOfBirth: "1990-04-12",
        gender: "female",
      },
      { street: "", city: "Lagos", state: "Lagos" },
    );
    const details = submit.detailsFromKept(
      OWNER,
      fields as unknown as Parameters<typeof submit.detailsFromKept>[1],
    );
    expect(details).toMatchObject({ bvn: "22190000111", nin: "70190000999" });
    expect(details).not.toHaveProperty("countryCode");
    expect(details).not.toHaveProperty("firstCurrency");
  });
});

describe("after the bank approves a person outside Nigeria", () => {
  const { checkingNext } =
    require("../CheckingScreen") as typeof import("../CheckingScreen");
  const { firstAccountDue } =
    require("../WorldFirstAccount") as typeof import("../WorldFirstAccount");
  const base = {
    state: "open" as const,
    flow: "review" as const,
    accountNumberStatus: "none" as const,
    review: null,
  };
  it("the wallet is open once the first account is, though there is no account number", () => {
    expect(
      checkingNext({
        ...base,
        world: { country: "GB", firstCurrency: "GBP", state: "open" },
      }),
    ).toBe("opened");
    expect(
      checkingNext({
        ...base,
        world: { country: "GB", firstCurrency: "GBP", state: "opening" },
      }),
    ).toBeNull();
  });
  it("the first account is asked for only when the bank approved and it is not open", () => {
    const approved = {
      stage: "approved" as const,
      reasons: [],
      canResubmit: false,
      canResubmitAt: null,
      decidedAt: null,
    };
    const world = {
      country: "GB",
      firstCurrency: "GBP" as const,
      state: "opening" as const,
    };
    expect(
      firstAccountDue({ ...base, state: "opening", review: approved, world }),
    ).toBe(true);
    expect(
      firstAccountDue({
        ...base,
        state: "opening",
        review: { ...approved, stage: "checking" },
        world,
      }),
    ).toBe(false);
    expect(
      firstAccountDue({
        ...base,
        state: "open",
        review: approved,
        world: { ...world, state: "open" },
      }),
    ).toBe(false);
    expect(
      firstAccountDue({
        ...base,
        state: "opening",
        review: approved,
        world: null,
      }),
    ).toBe(false);
  });
});

describe("the Wallet tab of a person outside Nigeria", () => {
  const { homeView } =
    require("../../wallet/home/model") as typeof import("../../wallet/home/model");
  it("lists their accounts instead of reading a naira balance, and never calls it a failed wallet", () => {
    const world = {
      country: "GB",
      firstCurrency: "GBP" as const,
      state: "open" as const,
    };
    expect(
      homeView(
        {
          data: { state: "open", account: null, world },
          error: null,
          isPending: false,
        },
        { data: undefined, error: null, isPending: true },
      ),
    ).toEqual({ kind: "world" });
    expect(
      homeView(
        {
          data: { state: "open", account: null },
          error: null,
          isPending: false,
        },
        { data: undefined, error: null, isPending: true },
      ).kind,
    ).toBe("wallet_error");
  });
});
