import { describe, it, expect } from "vitest";
import { parseQuery } from "./parse";
import { validate } from "./validate";
import { run } from "./cli";

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

  it("binds to the earliest operator, not an operator substring in the value", () => {
    // the "IN" inside "INPROGRESS" must not beat the real "=" operator
    expect(parseQuery("state=INPROGRESS")[0]).toMatchObject({ field: "state", op: "eq", value: "INPROGRESS" });
    // "=" inside a LIKE value stays part of the value
    expect(parseQuery("short_descriptionLIKEa=b")[0])
      .toMatchObject({ field: "short_description", op: "contains", value: "a=b" });
    // != beats the = inside it
    expect(parseQuery("priority!=2")[0]).toMatchObject({ field: "priority", op: "ne", value: "2" });
  });
});

describe("cli run()", () => {
  it("prints help with no args (exit 1)", () => {
    const r = run([]);
    expect(r.code).toBe(1);
    expect(r.output).toContain("Usage:");
  });

  it("parses + validates and exits 0 for a clean query", () => {
    const r = run(["active=true^priority>=2"]);
    expect(r.code).toBe(0);
    expect(r.output).toContain("no issues");
  });

  it("exits 1 with --json when an operator can't be parsed", () => {
    const r = run(["just_a_field_no_operator", "--json"]);
    expect(r.code).toBe(1);
    const data = JSON.parse(r.output);
    expect(data.issues.some((i: any) => i.rule === "bad-operator")).toBe(true);
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

  it("validates the real field after an ^NQ prefix (not 'NQstate')", () => {
    // before NQ support, the second group's field parsed as 'NQstate' -> false unknown-field
    expect(validate("active=true^NQstate=6", fields)).toEqual([]);
    expect(validate("active=true^NQbogus=6", fields).some((i) => i.rule === "unknown-field")).toBe(true);
  });
});
