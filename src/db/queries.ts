import db from "./schema";
import type { User, Property, Analysis, AnalysisWithProperty, Bid, BidSession } from "./schema";

// ── Users ──────────────────────────────────────────────

const insertUser = db.prepare(`
  INSERT INTO users (name, email, income, savings, loan_promise, debts, household_type)
  VALUES ($name, $email, $income, $savings, $loan_promise, $debts, $household_type)
`);

const selectUser = db.prepare(`SELECT * FROM users WHERE id = ?`);
const selectUserByEmail = db.prepare(`SELECT * FROM users WHERE email = ?`);

const updateUserStmt = db.prepare(`
  UPDATE users
  SET name = $name, income = $income, savings = $savings,
      loan_promise = $loan_promise, debts = $debts, household_type = $household_type,
      updated_at = datetime('now')
  WHERE id = $id
`);

export function createUser(data: {
    name: string;
    email?: string;
    income: number;
    savings: number;
    loan_promise: number;
    debts?: number;
    household_type: "solo" | "together";
}): User {
    const result = insertUser.run({
        $name: data.name,
        $email: data.email || null,
        $income: data.income,
        $savings: data.savings,
        $loan_promise: data.loan_promise,
        $debts: data.debts || 0,
        $household_type: data.household_type,
    });
    return selectUser.get(result.lastInsertRowid) as User;
}

export function getUser(id: number): User | null {
    return (selectUser.get(id) as User) || null;
}

export function updateUser(id: number, data: Partial<Omit<User, "id" | "created_at" | "updated_at" | "email">>): User | null {
    const existing = getUser(id);
    if (!existing) return null;

    updateUserStmt.run({
        $id: id,
        $name: data.name ?? existing.name,
        $income: data.income ?? existing.income,
        $savings: data.savings ?? existing.savings,
        $loan_promise: data.loan_promise ?? existing.loan_promise,
        $debts: data.debts ?? existing.debts,
        $household_type: data.household_type ?? existing.household_type,
    });

    return getUser(id);
}

// ── Households / Partner Invite ────────────────────────

function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for clarity
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

const setInviteCode = db.prepare(`
  UPDATE users SET partner_invite_code = $code, updated_at = datetime('now') WHERE id = $id
`);

const selectByInviteCode = db.prepare(`SELECT * FROM users WHERE partner_invite_code = ?`);

const linkPartners = db.prepare(`
  UPDATE users SET partner_id = $partner_id, updated_at = datetime('now') WHERE id = $id
`);

export function generateInviteCode(userId: number): string | null {
    const user = getUser(userId);
    if (!user) return null;

    // If already has a code, return it
    if (user.partner_invite_code) return user.partner_invite_code;

    const code = generateCode();
    setInviteCode.run({ $code: code, $id: userId });
    return code;
}

export function acceptInvite(userId: number, code: string): { success: boolean; partner?: User; error?: string } {
    const inviter = selectByInviteCode.get(code) as User | null;
    if (!inviter) return { success: false, error: "Ogiltig inbjudningskod" };
    if (inviter.id === userId) return { success: false, error: "Du kan inte bjuda in dig själv" };
    if (inviter.partner_id) return { success: false, error: "Partnern har redan en koppling" };

    const user = getUser(userId);
    if (!user) return { success: false, error: "Användare hittades inte" };
    if (user.partner_id) return { success: false, error: "Du har redan en partner kopplad" };

    // Link both users
    linkPartners.run({ $partner_id: inviter.id, $id: userId });
    linkPartners.run({ $partner_id: userId, $id: inviter.id });

    return { success: true, partner: getUser(inviter.id)! };
}

export function getHouseholdInfo(userId: number): {
    user: User;
    partner: User | null;
    combined_income: number;
    combined_savings: number;
    combined_loan_promise: number;
    combined_debts: number;
} | null {
    const user = getUser(userId);
    if (!user) return null;

    const partner = user.partner_id ? getUser(user.partner_id) : null;

    return {
        user,
        partner,
        combined_income: user.income + (partner?.income ?? 0),
        combined_savings: user.savings + (partner?.savings ?? 0),
        combined_loan_promise: user.loan_promise + (partner?.loan_promise ?? 0),
        combined_debts: user.debts + (partner?.debts ?? 0),
    };
}

// ── Properties ─────────────────────────────────────────

const insertProperty = db.prepare(`
  INSERT INTO properties (booli_url, broker_url, address, area, asking_price, sqm, fee, rooms, built_year, fair_value, brf_loan_per_sqm, brf_savings_per_sqm, brf_stats_json, image_url)
  VALUES ($booli_url, $broker_url, $address, $area, $asking_price, $sqm, $fee, $rooms, $built_year, $fair_value, $brf_loan_per_sqm, $brf_savings_per_sqm, $brf_stats_json, $image_url)
`);

const selectProperty = db.prepare(`SELECT * FROM properties WHERE id = ?`);
const selectPropertyByBooliUrl = db.prepare(`SELECT * FROM properties WHERE booli_url = ?`);

export function createProperty(data: {
    booli_url?: string;
    broker_url?: string;
    address: string;
    area?: string;
    asking_price: number;
    sqm?: number;
    fee?: number;
    rooms?: number;
    built_year?: number;
    fair_value?: number;
    brf_loan_per_sqm?: number;
    brf_savings_per_sqm?: number;
    brf_stats_json?: string;
    image_url?: string;
}): Property {
    const result = insertProperty.run({
        $booli_url: data.booli_url ?? null,
        $broker_url: data.broker_url ?? null,
        $address: data.address,
        $area: data.area ?? null,
        $asking_price: data.asking_price,
        $sqm: data.sqm ?? null,
        $fee: data.fee ?? null,
        $rooms: data.rooms ?? null,
        $built_year: data.built_year ?? null,
        $fair_value: data.fair_value ?? null,
        $brf_loan_per_sqm: data.brf_loan_per_sqm ?? null,
        $brf_savings_per_sqm: data.brf_savings_per_sqm ?? null,
        $brf_stats_json: data.brf_stats_json ?? null,
        $image_url: data.image_url ?? null,
    });
    return selectProperty.get(result.lastInsertRowid) as Property;
}

export function findPropertyByBooliUrl(url: string): Property | null {
    return (selectPropertyByBooliUrl.get(url) as Property) || null;
}

export function getProperty(id: number): Property | null {
    return (selectProperty.get(id) as Property) || null;
}

const updatePropertyBrf = db.prepare(`
  UPDATE properties
  SET brf_loan_per_sqm = $brf_loan_per_sqm,
      brf_savings_per_sqm = $brf_savings_per_sqm,
      brf_analysis_json = $brf_analysis_json
  WHERE id = $id
`);

export function updatePropertyBrfAnalysis(id: number, data: {
    brf_loan_per_sqm: number;
    brf_savings_per_sqm: number;
    brf_analysis_json: string;
}): Property | null {
    updatePropertyBrf.run({
        $id: id,
        $brf_loan_per_sqm: data.brf_loan_per_sqm,
        $brf_savings_per_sqm: data.brf_savings_per_sqm,
        $brf_analysis_json: data.brf_analysis_json,
    });
    return getProperty(id);
}

// ── Analyses ───────────────────────────────────────────

const insertAnalysis = db.prepare(`
  INSERT INTO analyses (user_id, property_id, payment_status, margin_result, grade)
  VALUES ($user_id, $property_id, $payment_status, $margin_result, $grade)
`);

const selectAnalysis = db.prepare(`SELECT * FROM analyses WHERE id = ?`);

const selectAnalysesByUser = db.prepare(`
  SELECT a.*, p.address, p.area, p.asking_price, p.sqm, p.fee, p.rooms, p.built_year, p.fair_value, p.brf_loan_per_sqm, p.brf_savings_per_sqm, p.brf_analysis_json, p.image_url, p.booli_url, p.broker_url
  FROM analyses a
  JOIN properties p ON a.property_id = p.id
  WHERE a.user_id = ?
  ORDER BY a.created_at DESC
`);

export function createAnalysis(data: {
    user_id: number;
    property_id: number;
    payment_status?: "free" | "paid";
    margin_result?: number;
    grade?: string;
}): Analysis {
    const result = insertAnalysis.run({
        $user_id: data.user_id,
        $property_id: data.property_id,
        $payment_status: data.payment_status || "free",
        $margin_result: data.margin_result || null,
        $grade: data.grade || null,
    });
    return selectAnalysis.get(result.lastInsertRowid) as Analysis;
}

export function getAnalysis(id: number): AnalysisWithProperty | null {
    const stmt = db.prepare(`
    SELECT a.*, p.address, p.area, p.asking_price, p.sqm, p.fee, p.rooms, p.built_year, p.fair_value, p.brf_loan_per_sqm, p.brf_savings_per_sqm, p.brf_analysis_json, p.image_url, p.booli_url, p.broker_url
    FROM analyses a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = ?
  `);
    return (stmt.get(id) as AnalysisWithProperty) || null;
}

export function listAnalysesByUser(userId: number): AnalysisWithProperty[] {
    return selectAnalysesByUser.all(userId) as AnalysisWithProperty[];
}

// Update analysis with KALP grade and margin
export function updateAnalysisGrade(id: number, grade: string, marginResult: number): void {
    db.run(`UPDATE analyses SET grade = ?, margin_result = ? WHERE id = ?`, [grade, marginResult, id]);
}

// Update analysis with AI-generated questions
export function updateAnalysisQuestions(id: number, questionsJson: string): void {
    db.run(`UPDATE analyses SET ai_questions_json = ? WHERE id = ?`, [questionsJson, id]);
}

// Update analysis payment status (free → paid)
export function updateAnalysisPaymentStatus(id: number, status: "free" | "paid"): void {
    if (status === "paid") {
        db.run(`UPDATE analyses SET payment_status = ?, paid_at = datetime('now') WHERE id = ?`, [status, id]);
    } else {
        db.run(`UPDATE analyses SET payment_status = ?, paid_at = NULL WHERE id = ?`, [status, id]);
    }
}

// Update property data (for re-scrape)
export function updatePropertyData(id: number, data: Partial<{
    address: string;
    area: string;
    asking_price: number;
    sqm: number;
    fee: number;
    rooms: number;
    built_year: number;
    fair_value: number;
    image_url: string;
    broker_url: string;
}>): Property | null {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
    }
    if (fields.length === 0) return getProperty(id);
    values.push(id);
    db.run(`UPDATE properties SET ${fields.join(", ")} WHERE id = ?`, values);
    return getProperty(id);
}

// ── Bids ───────────────────────────────────────────────

const insertBid = db.prepare(`
  INSERT INTO bids (analysis_id, amount, margin, grade)
  VALUES ($analysis_id, $amount, $margin, $grade)
`);

const selectBid = db.prepare(`SELECT * FROM bids WHERE id = ?`);

const selectBidsByAnalysis = db.prepare(`
  SELECT * FROM bids WHERE analysis_id = ? ORDER BY created_at DESC
`);

export function createBid(data: {
    analysis_id: number;
    amount: number;
    margin?: number;
    grade?: "green" | "yellow" | "red";
}): Bid {
    const result = insertBid.run({
        $analysis_id: data.analysis_id,
        $amount: data.amount,
        $margin: data.margin ?? null,
        $grade: data.grade ?? null,
    });
    return selectBid.get(result.lastInsertRowid) as Bid;
}

export function listBids(analysisId: number): Bid[] {
    return selectBidsByAnalysis.all(analysisId) as Bid[];
}

// ── Bid Sessions ───────────────────────────────────────

const insertBidSession = db.prepare(`
  INSERT INTO bid_sessions (analysis_id) VALUES ($analysis_id)
`);

const selectBidSession = db.prepare(`SELECT * FROM bid_sessions WHERE id = ?`);

const selectActiveBidSession = db.prepare(`
  SELECT * FROM bid_sessions WHERE analysis_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1
`);

const updateBidSessionStmt = db.prepare(`
  UPDATE bid_sessions SET status = $status, max_bid = $max_bid, ended_at = datetime('now') WHERE id = $id
`);

export function createBidSession(analysisId: number): BidSession {
    const result = insertBidSession.run({ $analysis_id: analysisId });
    return selectBidSession.get(result.lastInsertRowid) as BidSession;
}

export function getActiveBidSession(analysisId: number): BidSession | null {
    return (selectActiveBidSession.get(analysisId) as BidSession) || null;
}

export function getBidSession(id: number): BidSession | null {
    return (selectBidSession.get(id) as BidSession) || null;
}

export function updateBidSessionStatus(id: number, status: "won" | "lost", maxBid?: number): BidSession | null {
    const session = getBidSession(id);
    if (!session) return null;

    updateBidSessionStmt.run({
        $id: id,
        $status: status,
        $max_bid: maxBid ?? session.max_bid ?? null,
    });
    return getBidSession(id);
}

// ── Seed data (for development) ────────────────────────

export function seedDemoData(userId: number): void {
    // Only seed if no analyses exist for this user
    const existing = listAnalysesByUser(userId);
    if (existing.length > 0) return;

    const p1 = createProperty({
        address: "Storgatan 12, 3 tr",
        area: "Vasastan",
        asking_price: 3_950_000,
        sqm: 58,
        fee: 4_200,
        rooms: 2,
        built_year: 1928,
        fair_value: 3_800_000,
        brf_loan_per_sqm: 8_500,
        brf_savings_per_sqm: 1_200,
        image_url: "https://bcdn.se/images/cache/51542742_1200x900.jpg",
    });

    const p2 = createProperty({
        address: "Åsögatan 88, 2 tr",
        area: "Södermalm",
        asking_price: 2_850_000,
        sqm: 42,
        fee: 3_800,
        rooms: 1.5,
        built_year: 1935,
        fair_value: 2_700_000,
        brf_loan_per_sqm: 12_000,
        brf_savings_per_sqm: 800,
        image_url: "https://bcdn.se/images/cache/50530893_1200x900.jpg",
    });

    createAnalysis({ user_id: userId, property_id: p1.id, grade: "B+", margin_result: 8_500 });
    createAnalysis({ user_id: userId, property_id: p2.id, grade: "C", margin_result: 3_200 });
}
