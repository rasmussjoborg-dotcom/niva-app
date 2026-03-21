/**
 * Nivå API Client
 * Ported from src/hooks/useApi.ts for React Native.
 * Points to Railway backend, uses Bearer token auth instead of cookies.
 */

// ─── Types ──────────────────────────────────────────────────────

export interface UserData {
  id: number;
  name: string;
  income: number;
  savings: number;
  loan_promise: number;
  other_debts: number;
  household_type: string;
  household_id?: number;
  partner_id?: number;
  created_at?: string;
}

export interface AnalysisData {
  id: number;
  user_id: number;
  property_id: number;
  grade: string;
  grade_color: string;
  monthly_cost: number;
  risk_level: string;
  is_premium: boolean;
  payment_status: string;
  created_at: string;
  // Property fields (joined)
  address?: string;
  price?: number;
  sqm?: number;
  rooms?: number;
  monthly_fee?: number;
  brf_name?: string;
  broker_name?: string;
  broker_firm?: string;
  image_url?: string;
}

export interface BrokerDocument {
  id: number;
  property_id: number;
  doc_type: string;
  url: string;
  title: string;
}

export interface BidData {
  id: number;
  analysis_id: number;
  amount: number;
  kalp_margin?: number;
  kalp_grade?: string;
  created_at: string;
}

export interface HouseholdInfo {
  id: number;
  combined_income: number;
  combined_savings: number;
  combined_loan_promise: number;
  combined_debts: number;
  members: UserData[];
}

export interface KALPResult {
  can_afford: boolean;
  margin: number;
  grade: string;
  grade_color: string;
  monthly_cost: number;
  net_income: number;
  loan_amount: number;
  amortization: number;
  interest_cost: number;
  tax_deduction: number;
}

// ─── Config ─────────────────────────────────────────────────────

const API_BASE = "https://niva-app-production.up.railway.app/api";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ─── API Methods ────────────────────────────────────────────────

// Users
export const createUser = (data: Partial<UserData>) =>
  apiFetch<UserData>("/users", { method: "POST", body: JSON.stringify(data) });

export const getUser = (id: number) =>
  apiFetch<UserData>(`/users/${id}`);

export const updateUser = (id: number, data: Partial<UserData>) =>
  apiFetch<UserData>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Household
export const generateInviteCode = () =>
  apiFetch<{ code: string }>("/households/invite", { method: "POST" });

export const acceptInvite = (code: string) =>
  apiFetch<HouseholdInfo>("/households/accept", { method: "POST", body: JSON.stringify({ code }) });

export const getHousehold = (id: number) =>
  apiFetch<HouseholdInfo>(`/households/${id}`);

// Properties & Analysis
export const resolveProperty = (url: string) =>
  apiFetch<AnalysisData>("/resolve-property", { method: "POST", body: JSON.stringify({ url }) });

export const getAnalyses = () =>
  apiFetch<AnalysisData[]>("/analyses");

export const getAnalysis = (id: number) =>
  apiFetch<AnalysisData>(`/analyses/${id}`);

export const refreshAnalysis = (id: number) =>
  apiFetch<AnalysisData>(`/analyses/${id}/refresh`, { method: "POST" });

export const unlockPremium = (analysisId: number) =>
  apiFetch<AnalysisData>(`/analyses/${analysisId}/payment`, { method: "POST" });

// Documents
export const getDocuments = (propertyId: number) =>
  apiFetch<BrokerDocument[]>(`/properties/${propertyId}/documents`);

export const analyzePdf = (propertyId: number) =>
  apiFetch<{ summary: string; risks: string[] }>(`/properties/${propertyId}/analyze-pdf`, { method: "POST" });

// Chat
export const chatWithAI = (propertyId: number, message: string) =>
  apiFetch<{ response: string }>(`/properties/${propertyId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

// KALP Calculator
export const calculateKALP = (data: {
  price: number;
  monthly_fee: number;
  income: number;
  savings: number;
  other_debts?: number;
  interest_rate?: number;
}) => apiFetch<KALPResult>("/calculate", { method: "POST", body: JSON.stringify(data) });

// Bids
export const createBid = (analysisId: number, amount: number) =>
  apiFetch<BidData>("/bids", { method: "POST", body: JSON.stringify({ analysis_id: analysisId, amount }) });

export const getBids = (analysisId: number) =>
  apiFetch<BidData[]>(`/bids?analysis_id=${analysisId}`);

// Bid Sessions
export const createBidSession = (analysisId: number) =>
  apiFetch<{ id: number }>("/bid-sessions", { method: "POST", body: JSON.stringify({ analysis_id: analysisId }) });

export const updateBidSession = (id: number, status: "won" | "lost") =>
  apiFetch<{ id: number }>(`/bid-sessions/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
