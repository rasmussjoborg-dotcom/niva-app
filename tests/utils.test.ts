import { describe, test, expect } from "bun:test";

// ============================================================
// Utility Function Tests
// ============================================================
// Tests for URL parsing, data transforms, and KALP calculations.
// These are pure functions with no side effects — ideal for
// Copilot to extend when adding new utilities.
// ============================================================

// ---- URL Parsing ----

describe("URL Parsing", () => {
  test("extract broker domain from URL", () => {
    const url = "https://www.bjurfors.se/objekt/stockholm/123456";
    const domain = new URL(url).hostname.replace("www.", "");
    expect(domain).toBe("bjurfors.se");
  });

  test("handle URL with trailing slash", () => {
    const url = "https://www.svenskfast.se/objekt/stockholm/123/";
    const domain = new URL(url).hostname.replace("www.", "");
    expect(domain).toBe("svenskfast.se");
  });

  test("reject invalid URLs", () => {
    expect(() => new URL("not-a-url")).toThrow();
  });

  test("extract property ID from path", () => {
    const url = "https://www.bjurfors.se/objekt/stockholm/789012";
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const propertyId = segments[segments.length - 1];
    expect(propertyId).toBe("789012");
  });
});

// ---- KALP Calculation ----

describe("KALP Calculator", () => {
  /**
   * KALP = Kvar att leva på (money left to live on)
   * Formula: income - (mortgage_cost + fee + living_cost)
   * Where mortgage_cost = (loan_amount * interest_rate / 12)
   *   + amortization (based on LTV ratio)
   */

  function calculateKALP(params: {
    monthlyIncome: number;
    loanAmount: number;
    interestRate: number; // e.g. 0.04 for 4%
    fee: number;
    livingCost: number;
  }): number {
    const monthlyInterest = (params.loanAmount * params.interestRate) / 12;
    // Simplified amortization: 2% of loan / 12 months
    const monthlyAmortization = (params.loanAmount * 0.02) / 12;
    const totalCost = monthlyInterest + monthlyAmortization + params.fee + params.livingCost;
    return Math.round(params.monthlyIncome - totalCost);
  }

  test("positive margin for affordable property", () => {
    const margin = calculateKALP({
      monthlyIncome: 45000,
      loanAmount: 2000000,
      interestRate: 0.04,
      fee: 4000,
      livingCost: 15000,
    });
    expect(margin).toBeGreaterThan(0);
  });

  test("negative margin for unaffordable property", () => {
    const margin = calculateKALP({
      monthlyIncome: 25000,
      loanAmount: 5000000,
      interestRate: 0.06,
      fee: 6000,
      livingCost: 15000,
    });
    expect(margin).toBeLessThan(0);
  });

  test("zero interest means lower cost", () => {
    const withInterest = calculateKALP({
      monthlyIncome: 45000,
      loanAmount: 3000000,
      interestRate: 0.04,
      fee: 4000,
      livingCost: 15000,
    });
    const noInterest = calculateKALP({
      monthlyIncome: 45000,
      loanAmount: 3000000,
      interestRate: 0,
      fee: 4000,
      livingCost: 15000,
    });
    expect(noInterest).toBeGreaterThan(withInterest);
  });

  test("higher income increases margin", () => {
    const low = calculateKALP({ monthlyIncome: 30000, loanAmount: 3000000, interestRate: 0.04, fee: 4000, livingCost: 15000 });
    const high = calculateKALP({ monthlyIncome: 50000, loanAmount: 3000000, interestRate: 0.04, fee: 4000, livingCost: 15000 });
    expect(high).toBeGreaterThan(low);
  });
});

// ---- Data Transforms ----

describe("Data Transforms", () => {
  test("format Swedish currency", () => {
    const formatSEK = (amount: number): string => {
      return new Intl.NumberFormat("sv-SE", {
        style: "currency",
        currency: "SEK",
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const result = formatSEK(3500000);
    expect(result).toContain("3");
    expect(result).toContain("500");
    expect(result).toContain("000");
  });

  test("grade to color mapping", () => {
    const gradeColors: Record<string, string> = {
      "A++": "#22C55E",
      "A+": "#22C55E",
      "A": "#4ADE80",
      "B+": "#A3E635",
      "B": "#FACC15",
      "C": "#FB923C",
      "D": "#EF4444",
    };

    expect(gradeColors["A++"]).toBe("#22C55E");
    expect(gradeColors["D"]).toBe("#EF4444");
    expect(gradeColors["unknown"]).toBeUndefined();
  });

  test("extract health indicators from BRF analysis", () => {
    const brfAnalysis = {
      grade: "B+",
      health_indicators: [
        { label: "Likviditet", status: "green", detail: "Kassaflöde: 2.1M kr" },
        { label: "Skuldsättning", status: "yellow", detail: "Lån/m²: 8 200 kr" },
        { label: "Underhållsfond", status: "green", detail: "Fond/m²: 1 100 kr" },
      ],
    };

    const greenCount = brfAnalysis.health_indicators.filter(i => i.status === "green").length;
    const yellowCount = brfAnalysis.health_indicators.filter(i => i.status === "yellow").length;

    expect(greenCount).toBe(2);
    expect(yellowCount).toBe(1);
    expect(brfAnalysis.health_indicators).toHaveLength(3);
  });
});
