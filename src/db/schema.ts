import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DB_PATH || "./data/niva.db";

// Ensure data directory exists (skip for in-memory databases)
if (DB_PATH !== ":memory:") {
  mkdirSync(dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent performance
db.run("PRAGMA journal_mode = WAL");
db.run("PRAGMA foreign_keys = ON");

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    income INTEGER NOT NULL DEFAULT 0,
    savings INTEGER NOT NULL DEFAULT 0,
    loan_promise INTEGER NOT NULL DEFAULT 0,
    debts INTEGER NOT NULL DEFAULT 0,
    household_type TEXT NOT NULL DEFAULT 'solo' CHECK (household_type IN ('solo', 'together')),
    partner_invite_code TEXT UNIQUE,
    partner_id INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL REFERENCES users(id),
    user2_id INTEGER REFERENCES users(id),
    shared_loan_promise INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booli_url TEXT,
    broker_url TEXT,
    address TEXT NOT NULL,
    area TEXT,
    asking_price INTEGER NOT NULL,
    sqm REAL,
    fee INTEGER,
    rooms REAL,
    built_year INTEGER,
    fair_value INTEGER,
    brf_loan_per_sqm INTEGER,
    brf_savings_per_sqm INTEGER,
    brf_stats_json TEXT,
    brf_analysis_json TEXT,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Safe migration: add broker_url if missing
try {
  db.run(`ALTER TABLE properties ADD COLUMN broker_url TEXT`);
} catch { /* Column already exists — ignore */ }

db.run(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    property_id INTEGER NOT NULL REFERENCES properties(id),
    payment_status TEXT NOT NULL DEFAULT 'free' CHECK (payment_status IN ('free', 'paid')),
    margin_result INTEGER,
    grade TEXT,
    ai_questions_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Safe migration: add ai_questions_json if missing
try {
  db.run(`ALTER TABLE analyses ADD COLUMN ai_questions_json TEXT`);
} catch { /* Column already exists — ignore */ }

// Safe migration: add paid_at if missing
try {
  db.run(`ALTER TABLE analyses ADD COLUMN paid_at TEXT`);
} catch { /* Column already exists — ignore */ }

db.run(`
  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL REFERENCES analyses(id),
    amount INTEGER NOT NULL,
    margin INTEGER,
    grade TEXT CHECK (grade IN ('green', 'yellow', 'red')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS bid_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL REFERENCES analyses(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
    max_bid INTEGER,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    ended_at TEXT
  )
`);

// Migration: add new columns if they don't exist (for existing DBs)
try { db.run("ALTER TABLE users ADD COLUMN partner_invite_code TEXT UNIQUE"); } catch { }
try { db.run("ALTER TABLE users ADD COLUMN partner_id INTEGER REFERENCES users(id)"); } catch { }

export default db;

// Type definitions
export interface User {
  id: number;
  email: string | null;
  name: string;
  income: number;
  savings: number;
  loan_promise: number;
  debts: number;
  household_type: "solo" | "together";
  partner_invite_code: string | null;
  partner_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: number;
  booli_url: string | null;
  broker_url: string | null;
  address: string;
  area: string | null;
  asking_price: number;
  sqm: number | null;
  fee: number | null;
  rooms: number | null;
  built_year: number | null;
  fair_value: number | null;
  brf_loan_per_sqm: number | null;
  brf_savings_per_sqm: number | null;
  brf_stats_json: string | null;
  brf_analysis_json: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Analysis {
  id: number;
  user_id: number;
  property_id: number;
  payment_status: "free" | "paid";
  margin_result: number | null;
  grade: string | null;
  ai_questions_json: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface AnalysisWithProperty extends Analysis {
  address: string;
  area: string | null;
  asking_price: number;
  sqm: number | null;
  fee: number | null;
  rooms: number | null;
  built_year: number | null;
  fair_value: number | null;
  brf_loan_per_sqm: number | null;
  brf_savings_per_sqm: number | null;
  brf_analysis_json: string | null;
  image_url: string | null;
  booli_url: string | null;
  broker_url: string | null;
  ai_questions_json: string | null;
  paid_at: string | null;
}

export interface Bid {
  id: number;
  analysis_id: number;
  amount: number;
  margin: number | null;
  grade: "green" | "yellow" | "red" | null;
  created_at: string;
}

export interface BidSession {
  id: number;
  analysis_id: number;
  status: "active" | "won" | "lost";
  max_bid: number | null;
  started_at: string;
  ended_at: string | null;
}
