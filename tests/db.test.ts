import { describe, test, expect, beforeEach } from "bun:test";
import { Database } from "bun:sqlite";

// ============================================================
// Database Layer Tests
// ============================================================
// These tests verify the SQLite schema and query functions.
// They use an in-memory database so there's no file I/O.
// ============================================================

let db: Database;

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    income INTEGER NOT NULL DEFAULT 0,
    savings INTEGER NOT NULL DEFAULT 0,
    loan_promise INTEGER NOT NULL DEFAULT 0,
    debts INTEGER NOT NULL DEFAULT 0,
    household_type TEXT DEFAULT 'solo',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS households (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER REFERENCES users(id),
    user2_id INTEGER REFERENCES users(id),
    shared_loan_promise INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booli_url TEXT,
    address TEXT NOT NULL,
    area TEXT,
    asking_price INTEGER,
    fair_value INTEGER,
    sqm REAL,
    fee INTEGER,
    rooms REAL,
    built_year INTEGER,
    brf_loan_per_sqm INTEGER,
    brf_savings_per_sqm INTEGER,
    brf_stats_json TEXT,
    brf_analysis_json TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    property_id INTEGER REFERENCES properties(id),
    payment_status TEXT DEFAULT 'free',
    margin_result INTEGER,
    grade TEXT
  );
`;

beforeEach(() => {
  db = new Database(":memory:");
  db.exec(SCHEMA);
});

// ---- Users ----

describe("Users", () => {
  test("create user returns an ID", () => {
    const stmt = db.prepare(
      "INSERT INTO users (name, income, savings, loan_promise) VALUES (?, ?, ?, ?)"
    );
    const result = stmt.run("Lisa", 35000, 500000, 4000000);
    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  test("get user by ID returns correct fields", () => {
    db.prepare(
      "INSERT INTO users (name, income, savings, loan_promise, household_type) VALUES (?, ?, ?, ?, ?)"
    ).run("Lisa", 35000, 500000, 4000000, "solo");

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(1) as any;
    expect(user).not.toBeNull();
    expect(user.name).toBe("Lisa");
    expect(user.income).toBe(35000);
    expect(user.savings).toBe(500000);
    expect(user.loan_promise).toBe(4000000);
    expect(user.household_type).toBe("solo");
  });

  test("update user reflects changes", () => {
    db.prepare(
      "INSERT INTO users (name, income, savings, loan_promise) VALUES (?, ?, ?, ?)"
    ).run("Lisa", 35000, 500000, 4000000);

    db.prepare("UPDATE users SET income = ?, savings = ? WHERE id = ?").run(40000, 600000, 1);

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(1) as any;
    expect(user.income).toBe(40000);
    expect(user.savings).toBe(600000);
  });

  test("unique email constraint", () => {
    db.prepare(
      "INSERT INTO users (name, email, income, savings, loan_promise) VALUES (?, ?, ?, ?, ?)"
    ).run("Lisa", "lisa@test.se", 35000, 500000, 4000000);

    expect(() => {
      db.prepare(
        "INSERT INTO users (name, email, income, savings, loan_promise) VALUES (?, ?, ?, ?, ?)"
      ).run("Anna", "lisa@test.se", 30000, 300000, 3000000);
    }).toThrow();
  });
});

// ---- Properties ----

describe("Properties", () => {
  test("create property with address", () => {
    const result = db.prepare(
      "INSERT INTO properties (address, area, asking_price, sqm, fee, rooms) VALUES (?, ?, ?, ?, ?, ?)"
    ).run("Storgatan 12", "Södermalm", 3500000, 62.5, 4200, 2.5);
    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  test("store and retrieve BRF analysis JSON", () => {
    const analysis = JSON.stringify({
      grade: "B+",
      verdict: "Stabil förening med god ekonomi",
      health_indicators: [{ label: "Likviditet", status: "green" }],
    });

    db.prepare(
      "INSERT INTO properties (address, brf_analysis_json) VALUES (?, ?)"
    ).run("Storgatan 12", analysis);

    const prop = db.prepare("SELECT * FROM properties WHERE id = ?").get(1) as any;
    const parsed = JSON.parse(prop.brf_analysis_json);
    expect(parsed.grade).toBe("B+");
    expect(parsed.health_indicators).toHaveLength(1);
  });
});

// ---- Analyses ----

describe("Analyses", () => {
  test("create analysis linked to user and property", () => {
    db.prepare(
      "INSERT INTO users (name, income, savings, loan_promise) VALUES (?, ?, ?, ?)"
    ).run("Lisa", 35000, 500000, 4000000);

    db.prepare(
      "INSERT INTO properties (address, asking_price) VALUES (?, ?)"
    ).run("Storgatan 12", 3500000);

    const result = db.prepare(
      "INSERT INTO analyses (user_id, property_id, margin_result, grade) VALUES (?, ?, ?, ?)"
    ).run(1, 1, 8500, "B+");

    expect(result.lastInsertRowid).toBeGreaterThan(0);
  });

  test("default payment_status is free", () => {
    db.prepare("INSERT INTO users (name, income, savings, loan_promise) VALUES (?, ?, ?, ?)").run("Lisa", 35000, 500000, 4000000);
    db.prepare("INSERT INTO properties (address) VALUES (?)").run("Storgatan 12");
    db.prepare("INSERT INTO analyses (user_id, property_id) VALUES (?, ?)").run(1, 1);

    const analysis = db.prepare("SELECT * FROM analyses WHERE id = ?").get(1) as any;
    expect(analysis.payment_status).toBe("free");
  });

  test("upgrade to paid", () => {
    db.prepare("INSERT INTO users (name, income, savings, loan_promise) VALUES (?, ?, ?, ?)").run("Lisa", 35000, 500000, 4000000);
    db.prepare("INSERT INTO properties (address) VALUES (?)").run("Storgatan 12");
    db.prepare("INSERT INTO analyses (user_id, property_id, payment_status) VALUES (?, ?, ?)").run(1, 1, "free");

    db.prepare("UPDATE analyses SET payment_status = ? WHERE id = ?").run("paid", 1);

    const analysis = db.prepare("SELECT * FROM analyses WHERE id = ?").get(1) as any;
    expect(analysis.payment_status).toBe("paid");
  });
});

// ---- Households ----

describe("Households", () => {
  test("link two users in a household", () => {
    db.prepare("INSERT INTO users (name, income, savings, loan_promise) VALUES (?, ?, ?, ?)").run("Lisa", 35000, 500000, 4000000);
    db.prepare("INSERT INTO users (name, income, savings, loan_promise) VALUES (?, ?, ?, ?)").run("Erik", 40000, 300000, 4500000);

    const result = db.prepare(
      "INSERT INTO households (user1_id, user2_id, shared_loan_promise) VALUES (?, ?, ?)"
    ).run(1, 2, 6000000);

    expect(result.lastInsertRowid).toBeGreaterThan(0);

    const hh = db.prepare("SELECT * FROM households WHERE id = ?").get(1) as any;
    expect(hh.shared_loan_promise).toBe(6000000);
  });
});
