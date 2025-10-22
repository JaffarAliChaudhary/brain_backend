import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/index"; // adjust if your entry file differs

// --- Health Check / Root ---
describe("GET /api/health", () => {
  it("should return API health info", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
  });
});

// --- Ingest Route ---
describe("POST /api/ingest", () => {
  it("should ingest a transcript successfully", async () => {
    const payload = {
      transcript_id: "meeting-001" + Date.now(),
      title: "Q4 Strategy Call",
      occurred_at: "2025-10-15T10:00:00Z",
      duration_minutes: 30,
      participants: [
        { name: "John Doe", email: "john@acme.com", role: "speaker" },
        { name: "Sarah Chen", email: "sarah@acme.com", role: "listener" },
      ],
      transcript: "We discussed sales growth and team expansion plans.",
      metadata: { platform: "zoom", recording_url: "https://zoom.us/rec/play/example" },
    };

    const res = await request(app)
      .post("/api/ingest")
      .send(payload)
      .set("Accept", "application/json");

    expect(res.status).toBe(200);
    // expect(res.body).toHaveProperty("status");
    // expect(res.body.extracted).toHaveProperty("topics");
  });
});

// --- Analytics Routes ---
describe("GET /api/analytics/topics", () => {
  it("should return top topics", async () => {
    const res = await request(app).get("/api/analytics/topics");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("name");
      expect(res.body[0]).toHaveProperty("_count");
    }
  });
});

describe("GET /api/analytics/participants", () => {
  it("should return participant analytics", async () => {
    const res = await request(app).get("/api/analytics/participants");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("email");
    expect(res.body[0]).toHaveProperty("meetings_count");
  });
});

describe("GET /api/analytics/sentiment", () => {
  it("should return sentiment trend", async () => {
    const res = await request(app).get("/api/analytics/sentiment");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("date");
    expect(res.body[0]).toHaveProperty("avg_sentiment_score");
  });
});

// --- Graph Connections ---
describe("GET /api/graph/connections", () => {
  it("should return entity relationship data", async () => {
    const res = await request(app).get("/api/graph/connections");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("connections");
    expect(Array.isArray(res.body.connections)).toBe(true);
  });
});
