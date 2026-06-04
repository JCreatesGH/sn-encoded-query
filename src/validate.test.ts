import { describe, it, expect } from "vitest";
import { parseQuery } from "./parse";
import { validate } from "./validate";

describe("parseQuery", () => {
  it("round-trips operators including >= and OR", () => {
    const c = parseQuery("active=true^priority>=2^ORstate=6^assigned_toISEMPTY");
    expect(c[0]).toMatchObject({ field: "active", op: "eq", value: "true", join: "AND" });
    expect(c[1]).toMatchObject({ field: "priority", op: "gte", value: "2" });
    expect(c[2]).toMatchObject({ field: "state", op: "eq", join: "OR" });
    expect(c[3]).toMatchObject({ field: "assigned_to", op: "isEmpty" });
  });

  it("ignores ORDERBY segments", () => {
    expect(parseQuery("active=true^ORDERBYDESCsys_created_on")).toHaveLength(1);
  });
});

describe("validate", () => {
  const fields = new Set(["active", "priority", "state"]);

  it("flags unknown fields against a schema", () => {
    const issues = validate("active=true^bogus_field=1", fields);
    expect(issues.some((i) => i.rule === "unknown-field")).toBe(true);
  });

  it("passes a valid query", () => {
    expect(validate("active=true^priority>=2", fields)).toEqual([]);
  });

  it("flags an empty value", () => {
    const issues = validate("priority=", fields);
    expect(issues.some((i) => i.rule === "empty-value")).toBe(true);
  });

  it("flags empty query", () => {
    expect(validate("").some((i) => i.rule === "empty")).toBe(true);
  });
});
