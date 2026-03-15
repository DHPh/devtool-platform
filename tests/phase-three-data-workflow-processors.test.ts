import { describe, expect, it } from "vitest";
import {
  buildSelectQuery,
  dataToSql,
  formatGraphql,
  formatSql,
  generateFakeData,
  validateOpenApi,
} from "@/lib/processors";

describe("Phase 3 data workflow processors", () => {
  it("formats SQL tokens without changing literals", () => {
    expect(formatSql("select id,name from users where status='order by' and active=true;")).toEqual({
      ok: true,
      value: "SELECT id, name\nFROM users\nWHERE status = 'order by'\nAND active = TRUE;\n",
    });
    expect(formatSql("").ok).toBe(false);
  });

  it("builds safe SELECT queries", () => {
    expect(buildSelectQuery({ table: "users", columns: ["id", "name"], conditions: [{ column: "active", operator: "=", value: "true" }], orderBy: "name", limit: 25 })).toEqual({
      ok: true,
      value: "SELECT id, name\nFROM users\nWHERE active = TRUE\nORDER BY name ASC\nLIMIT 25;",
    });
    expect(buildSelectQuery({ table: "users; DROP TABLE users", columns: ["*"] }).ok).toBe(false);
  });

  it("converts JSON rows to dialect-aware INSERT SQL", () => {
    expect(dataToSql('[{"name":"O\'Brien","active":true},{"name":"Ada","active":false}]', "users", "postgresql")).toEqual({
      ok: true,
      value: 'INSERT INTO "users" ("name", "active")\nVALUES\n  (\'O\'\'Brien\', TRUE),\n  (\'Ada\', FALSE);',
    });
    expect(dataToSql("[]", "users").ok).toBe(false);
  });

  it("validates OpenAPI structure and operations", () => {
    const valid = validateOpenApi("openapi: 3.1.0\ninfo:\n  title: Example\n  version: 1.0.0\npaths:\n  /users:\n    get:\n      responses:\n        '200':\n          description: OK");
    expect(valid).toEqual({ ok: true, value: { version: "3.1.0", title: "Example", paths: 1, operations: 1, issues: [] } });
    expect(validateOpenApi('{"swagger":"2.0"}').ok).toBe(false);
  });

  it("formats and rejects GraphQL documents", async () => {
    await expect(formatGraphql("query User($id:ID!){user(id:$id){id name}}")).resolves.toEqual({ ok: true, value: "query User($id: ID!) {\n  user(id: $id) {\n    id\n    name\n  }\n}\n" });
    await expect(formatGraphql("query {")).resolves.toMatchObject({ ok: false });
  });

  it("generates deterministic bounded fake data", () => {
    expect(generateFakeData({ count: 2, seed: 7 })).toEqual(generateFakeData({ count: 2, seed: 7 }));
    const result = generateFakeData({ count: 2, seed: 7 });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(JSON.parse(result.value)).toHaveLength(2);
    expect(generateFakeData({ count: 1001 }).ok).toBe(false);
  });
});
