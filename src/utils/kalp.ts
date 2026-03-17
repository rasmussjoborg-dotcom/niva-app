// KALP (Kvar Att Leva På) Calculation Engine
// Swedish mortgage affordability calculator

export interface KALPInput {
    /** Monthly net income (netto) */
    monthlyIncome: number;
    /** Bid / purchase price */
    bidPrice: number;
    /** Own financing (kontantinsats) */
    ownFinancing: number;
    /** Annual interest rate as decimal (e.g. 0.04 for 4%) */
    interestRate: number;
    /** Monthly BRF fee (månadsavgift) */
    brfFee: number;
    /** Existing monthly debt payments */
    existingDebts?: number;
    /** Monthly living cost (levnadskostnad). Default: 10,500 single / 17,000 household */
    livingCost?: number;
    /** Household type */
    householdType: "solo" | "together";
    /** Gross annual income (for debt-to-income amortization check) */
    grossAnnualIncome?: number;
}

export interface KALPLineItem {
    label: string;
    amount: number;
    /** positive = cost, negative = deduction */
    type: "cost" | "deduction" | "income";
}

export interface KALPResult {
    /** Monthly margin (positive = surplus, negative = deficit) */
    margin: number;
    /** Traffic light grade */
    grade: "green" | "yellow" | "red";
    /** Signal color CSS variable name */
    gradeColor: string;
    /** Loan amount (bid - own financing) */
    loanAmount: number;
    /** Loan-to-value ratio */
    ltv: number;
    /** Monthly interest cost (before deduction) */
    interestCost: number;
    /** Monthly interest deduction (ränteavdrag) */
    ränteavdrag: number;
    /** Monthly amortization */
    amortization: number;
    /** Amortization rate (%) */
    amortizationRate: number;
    /** Monthly living cost used */
    livingCost: number;
    /** All line items for breakdown display */
    items: KALPLineItem[];
}

/**
 * Calculate Ränteavdrag (Swedish interest deduction)
 * 30% on first 100,000 SEK/year per person, 21% above that.
 * Households double the threshold to 200,000 SEK.
 */
function calculateRänteavdrag(
    annualInterestCost: number,
    householdType: "solo" | "together"
): number {
    const threshold = householdType === "together" ? 200_000 : 100_000;

    if (annualInterestCost <= threshold) {
        return annualInterestCost * 0.30;
    }

    const deductionBelow = threshold * 0.30;
    const deductionAbove = (annualInterestCost - threshold) * 0.21;
    return deductionBelow + deductionAbove;
}

/**
 * Calculate amortization rate based on Swedish rules:
 * - LTV > 50%: 1%
 * - LTV > 70%: additional 1% (total 2%)
 * - Debt > 4.5× gross income: additional 1%
 */
function calculateAmortizationRate(
    loanAmount: number,
    propertyValue: number,
    grossAnnualIncome?: number
): number {
    const ltv = propertyValue > 0 ? loanAmount / propertyValue : 0;
    let rate = 0;

    if (ltv > 0.50) rate += 1;
    if (ltv > 0.70) rate += 1;

    // Debt-to-income rule: > 4.5× gross annual income
    if (grossAnnualIncome && grossAnnualIncome > 0) {
        if (loanAmount > grossAnnualIncome * 4.5) {
            rate += 1;
        }
    }

    return rate;
}

/**
 * Main KALP calculation
 */
export function calculateKALP(input: KALPInput): KALPResult {
    const {
        monthlyIncome,
        bidPrice,
        ownFinancing,
        interestRate,
        brfFee,
        existingDebts = 0,
        householdType,
        grossAnnualIncome,
    } = input;

    // Default living costs (Konsumentverkets referensvärden, approximate)
    const livingCost = input.livingCost ?? (householdType === "together" ? 17_000 : 10_500);

    // Loan = bid minus own financing (kontantinsats)
    const loanAmount = Math.max(0, bidPrice - ownFinancing);

    // LTV ratio
    const ltv = bidPrice > 0 ? loanAmount / bidPrice : 0;

    // Monthly interest cost
    const monthlyInterestCost = (loanAmount * interestRate) / 12;
    const annualInterestCost = loanAmount * interestRate;

    // Ränteavdrag (monthly)
    const annualRänteavdrag = calculateRänteavdrag(annualInterestCost, householdType);
    const monthlyRänteavdrag = annualRänteavdrag / 12;

    // Amortization
    const amortizationRate = calculateAmortizationRate(loanAmount, bidPrice, grossAnnualIncome);
    const monthlyAmortization = (loanAmount * (amortizationRate / 100)) / 12;

    // Total monthly costs
    const totalCosts =
        monthlyInterestCost -
        monthlyRänteavdrag +
        monthlyAmortization +
        brfFee +
        livingCost +
        existingDebts;

    // Margin
    const margin = Math.round(monthlyIncome - totalCosts);

    // Traffic light
    let grade: "green" | "yellow" | "red";
    let gradeColor: string;

    if (margin < 0) {
        grade = "red";
        gradeColor = "var(--color-red)";
    } else if (margin < 5_000) {
        grade = "yellow";
        gradeColor = "var(--color-yellow)";
    } else {
        grade = "green";
        gradeColor = "var(--color-green)";
    }

    // Build breakdown items
    const items: KALPLineItem[] = [
        { label: "Nettoinkomst", amount: monthlyIncome, type: "income" },
        { label: "Räntekostnad", amount: -Math.round(monthlyInterestCost), type: "cost" },
        { label: "Ränteavdrag", amount: Math.round(monthlyRänteavdrag), type: "deduction" },
        { label: "Amortering", amount: -Math.round(monthlyAmortization), type: "cost" },
        { label: "Månadsavgift", amount: -brfFee, type: "cost" },
        { label: "Levnadskostnad", amount: -livingCost, type: "cost" },
    ];

    if (existingDebts > 0) {
        items.push({ label: "Befintliga skulder", amount: -existingDebts, type: "cost" });
    }

    return {
        margin,
        grade,
        gradeColor,
        loanAmount,
        ltv,
        interestCost: Math.round(monthlyInterestCost),
        ränteavdrag: Math.round(monthlyRänteavdrag),
        amortization: Math.round(monthlyAmortization),
        amortizationRate,
        livingCost,
        items,
    };
}
