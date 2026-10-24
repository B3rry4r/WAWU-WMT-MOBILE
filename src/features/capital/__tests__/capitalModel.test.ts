import {
  amountProblem,
  cleanAmountText,
  countdownText,
  deductibleText,
  earlyLine,
  koboFromText,
  rateText,
  reservationRanOut,
  termText,
  withdrawBlockLine,
} from "../model";

describe("Capital words and sums (NUV-12)", () => {
  it("a rate is said as the provider states it, never rounded to a neater figure", () => {
    expect(rateText(0.3)).toBe("30% a year");
    expect(rateText(0.175)).toBe("17.5% a year");
    expect(rateText(0.2399)).toBe("23.99% a year");
    expect(rateText(null)).toBe("");
    expect(termText(90)).toBe("90 days");
    expect(termText(1)).toBe("1 day");
    expect(
      deductibleText({
        value: 0.1,
        valueType: "percentage",
        appliesTo: "interest",
      }),
    ).toBe("10% of interest");
    expect(
      deductibleText({
        value: 5000,
        valueType: "flat",
        appliesTo: "principal",
      }),
    ).toBe("₦50.00");
  });

  it("naira typed by a person becomes whole kobo without a float sum", () => {
    expect(koboFromText("1500")).toBe(150_000);
    expect(koboFromText("1,500.5")).toBe(150_050);
    expect(koboFromText("0.07")).toBe(7);
    expect(koboFromText("19.99")).toBe(1_999);
    expect(koboFromText("0")).toBeNull();
    expect(koboFromText("12.345")).toBeNull();
    expect(koboFromText("abc")).toBeNull();
    expect(koboFromText("")).toBeNull();
    expect(cleanAmountText("12a3.456")).toBe("123.45");
    expect(cleanAmountText("1.2.3")).toBe("1.23");
  });

  it("the amount is held to the product limits and WAWU's own, the stricter of each", () => {
    const p = { minKobo: 100_000, maxKobo: 5_000_000 };
    expect(amountProblem(50_000, p, null, null)).toBe(
      "The least this takes is ₦1,000.00.",
    );
    expect(amountProblem(6_000_000, p, null, null)).toBe(
      "The most this takes is ₦50,000.00.",
    );
    expect(amountProblem(2_000_000, p, 3_000_000, null)).toBe(
      "The least this takes is ₦30,000.00.",
    );
    expect(amountProblem(4_000_000, p, null, 3_500_000)).toBe(
      "The most this takes is ₦35,000.00.",
    );
    expect(amountProblem(2_000_000, p, null, null)).toBeNull();
    expect(amountProblem(null, p, null, null)).toBeNull();
  });

  it("what leaving early means is only what the product says", () => {
    expect(
      earlyLine({
        kind: "fixed_return",
        allowEarlyWithdrawal: false,
        earliestWithdrawalDays: null,
      }),
    ).toBe("Your money stays in until the term ends.");
    expect(
      earlyLine({
        kind: "fixed_return",
        allowEarlyWithdrawal: true,
        earliestWithdrawalDays: 30,
      }),
    ).toContain("from day 30");
    expect(
      earlyLine({
        kind: "fixed_return",
        allowEarlyWithdrawal: true,
        earliestWithdrawalDays: null,
      }),
    ).toContain("at any time");
    expect(
      earlyLine({
        kind: "fixed_return",
        allowEarlyWithdrawal: null,
        earliestWithdrawalDays: null,
      }),
    ).toBe("Ask before you invest whether you can leave early.");
    expect(withdrawBlockLine("locked")).toContain("lock");
    expect(withdrawBlockLine(null)).toBe("");
  });

  it("a reservation counts down and is over at its time", () => {
    const at = "2030-01-01T10:15:00.000Z";
    const start = new Date("2030-01-01T10:00:00.000Z").getTime();
    expect(countdownText(at, start)).toBe("15:00");
    expect(countdownText(at, start + 61_000)).toBe("13:59");
    expect(countdownText(at, start + 16 * 60_000)).toBe("0:00");
    expect(reservationRanOut(at, start)).toBe(false);
    expect(reservationRanOut(at, new Date(at).getTime())).toBe(true);
    expect(reservationRanOut(null, start)).toBe(false);
  });
});
