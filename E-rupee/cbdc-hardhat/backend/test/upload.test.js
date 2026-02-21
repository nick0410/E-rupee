import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../server.js";

test("POST /upload should return 400 when file is missing", async () => {
  const res = await request(app).post("/upload");
  assert.equal(res.status, 400);
  assert.equal(typeof res.body.error, "string");
});
