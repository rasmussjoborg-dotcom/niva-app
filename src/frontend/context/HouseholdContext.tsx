import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

// ── Types ──

export interface PartnerData {
    linked: boolean;
    name: string;
    avatarUrl: string;
    income: number;
    savings: number;
    loans: number;
}

export interface UserFinancials {
    income: number;
    savings: number;
    loans: number;
    lanelofte: number;
}

export interface HouseholdState {
    /** Derived from partner.linked — 'household' when partner is linked */
    mode: 'single' | 'household';
    /** Set during onboarding — determines whether to show partner invite prompt */
    partnerIntent: 'solo' | 'partner' | null;
    partner: PartnerData | null;
    user: UserFinancials;
    firstName: string;
    lastName: string;
}

type HouseholdAction =
    | { type: 'SET_PARTNER_INTENT'; intent: 'solo' | 'partner' }
    | { type: 'SET_USER_FINANCIALS'; financials: UserFinancials }
    | { type: 'SET_USER_NAME'; firstName: string; lastName: string }
    | { type: 'LINK_PARTNER'; partner: Omit<PartnerData, 'linked'> }
    | { type: 'UNLINK_PARTNER' }
    | { type: 'UPDATE_PARTNER_FINANCIALS'; financials: Partial<Pick<PartnerData, 'income' | 'savings' | 'loans'>> };

// ── Default state ──

const defaultState: HouseholdState = {
    mode: 'single',
    partnerIntent: null,
    partner: null,
    user: {
        income: 0,
        savings: 0,
        loans: 0,
        lanelofte: 0,
    },
    firstName: '',
    lastName: '',
};

// ── Reducer ──

function householdReducer(state: HouseholdState, action: HouseholdAction): HouseholdState {
    switch (action.type) {
        case 'SET_PARTNER_INTENT':
            return { ...state, partnerIntent: action.intent };

        case 'SET_USER_FINANCIALS':
            return { ...state, user: action.financials };

        case 'SET_USER_NAME':
            return { ...state, firstName: action.firstName, lastName: action.lastName };

        case 'LINK_PARTNER': {
            const partner: PartnerData = { ...action.partner, linked: true };
            return { ...state, mode: 'household', partner };
        }

        case 'UNLINK_PARTNER':
            return {
                ...state,
                mode: 'single',
                partner: state.partner ? { ...state.partner, linked: false } : null,
            };

        case 'UPDATE_PARTNER_FINANCIALS':
            if (!state.partner) return state;
            return {
                ...state,
                partner: { ...state.partner, ...action.financials },
            };

        default:
            return state;
    }
}

// ── Context ──

interface HouseholdContextValue {
    state: HouseholdState;
    dispatch: React.Dispatch<HouseholdAction>;
    /** Combined income (user + partner if linked) */
    combinedIncome: number;
    /** Combined savings */
    combinedSavings: number;
    /** Combined monthly loans */
    combinedLoans: number;
    /** User's lånelöfte from their bank */
    lanelofte: number;
    /** Whether household mode is active */
    isHousehold: boolean;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

// ── Provider ──

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(householdReducer, defaultState);

    const isHousehold = state.mode === 'household';
    const combinedIncome = state.user.income + (isHousehold && state.partner ? state.partner.income : 0);
    const combinedSavings = state.user.savings + (isHousehold && state.partner ? state.partner.savings : 0);
    const combinedLoans = state.user.loans + (isHousehold && state.partner ? state.partner.loans : 0);
    const lanelofte = state.user.lanelofte;

    return (
        <HouseholdContext.Provider value={{ state, dispatch, combinedIncome, combinedSavings, combinedLoans, lanelofte, isHousehold }}>
            {children}
        </HouseholdContext.Provider>
    );
};

// ── Hook ──

export const useHousehold = (): HouseholdContextValue => {
    const ctx = useContext(HouseholdContext);
    if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
    return ctx;
};
