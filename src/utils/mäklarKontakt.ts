// AI Question Bank — generates due diligence questions from BRF analysis red flags

export interface MäklarQuestion {
    question: string;
    category: "ekonomi" | "underhåll" | "risk";
    source: string; // which BRF data point triggered this
}

interface BrfFlags {
    brf_loan_per_sqm: number | null;
    brf_savings_per_sqm: number | null;
    brf_analysis_json: string | null;
}

/**
 * Generate 3-5 technical due diligence questions based on BRF red flags.
 * These are professional questions a buyer should ask the realtor.
 */
export function generateMäklarQuestions(flags: BrfFlags): MäklarQuestion[] {
    const questions: MäklarQuestion[] = [];

    // Parse BRF analysis if available
    let brfAnalysis: any = null;
    if (flags.brf_analysis_json) {
        try { brfAnalysis = JSON.parse(flags.brf_analysis_json); } catch { }
    }

    // 1. High loan per sqm → ask about repayment plans
    if (flags.brf_loan_per_sqm !== null && flags.brf_loan_per_sqm > 10_000) {
        questions.push({
            question: "Föreningens skuldsättning ligger på " + flags.brf_loan_per_sqm.toLocaleString("sv-SE") + " kr/kvm, vilket är över genomsnittet. Finns det en amorteringsplan och hur ser den ut på 5 och 10 års sikt?",
            category: "ekonomi",
            source: "Hög skuldsättning per kvm",
        });
    }

    // 2. Low savings per sqm → ask about deferred maintenance
    if (flags.brf_savings_per_sqm !== null && flags.brf_savings_per_sqm < 1_000) {
        questions.push({
            question: "Föreningens sparande ligger på " + (flags.brf_savings_per_sqm || 0).toLocaleString("sv-SE") + " kr/kvm. Finns det planerade renoveringar (t.ex. stambyte, fasadrenovering) och hur kommer de att finansieras?",
            category: "underhåll",
            source: "Lågt sparande per kvm",
        });
    }

    // 3. Rate sensitivity (from analysis)
    if (brfAnalysis?.rate_sensitivity) {
        const sensitivity = brfAnalysis.rate_sensitivity.value;
        if (typeof sensitivity === "number" && sensitivity > 15) {
            questions.push({
                question: "Hur ser föreningens räntekänslighet ut vid en höjning med 2 procentenheter? Finns det en riskbuffert i budgeten för stigande räntor?",
                category: "risk",
                source: "Hög räntekänslighet",
            });
        }
    }

    // 4. Always relevant — stambyte
    questions.push({
        question: "Har föreningen genomfört ett stambyte? Om inte, finns det planer och hur beräknas det påverka månadsavgiften?",
        category: "underhåll",
        source: "Standardfråga — stambyte",
    });

    // 5. Always relevant — energy efficiency
    questions.push({
        question: "Vilken energiklass har fastigheten och har föreningen vidtagit åtgärder för att sänka energikostnaderna?",
        category: "ekonomi",
        source: "Standardfråga — energi",
    });

    // 6. If high loan — ask about future fee increases
    if (flags.brf_loan_per_sqm !== null && flags.brf_loan_per_sqm > 8_000) {
        questions.push({
            question: "Finns det beslutade eller planerade höjningar av månadsavgiften de kommande 1-3 åren?",
            category: "ekonomi",
            source: "Risk för avgiftshöjning",
        });
    }

    // Return max 5
    return questions.slice(0, 5);
}

/**
 * Generate a professional Swedish bid communication text.
 */
export function generateBidScript(params: {
    address: string;
    amount: number;
    userName: string;
    partnerName?: string;
}): string {
    const { address, amount, userName, partnerName } = params;
    const formattedAmount = amount.toLocaleString("sv-SE");
    const signatories = partnerName
        ? `${userName} & ${partnerName}`
        : userName;

    return `Hej,

Vi har med stort intresse följt ${address} och efter noggrann analys av föreningen och vår privatekonomi vill vi meddela att vi är beredda att lägga ett bud på ${formattedAmount} kr.

Vi har bankens godkännande och kan tillträda flexibelt efter överenskommelse.

Vänliga hälsningar,
${signatories}`;
}

/**
 * Generate a professional Swedish interest declaration.
 */
export function generateInterestText(params: {
    address: string;
    userName: string;
}): string {
    return `Hej,

Vi vill anmäla vårt intresse för ${params.address}. Vi är pre-godkända av banken och önskar boka en visning vid tillfälle.

Vänliga hälsningar,
${params.userName}`;
}
