import { describe, it, expect } from "vitest";
import { humanize, parseQuery, parseOrderBy, query } from "./index";
import { run } from "./cli";

describe("humanize", () => {
  it("renders conditions, joins, and ordering in plain English", () => {
    expect(humanize("active=true^priority<=2")).toBe("active is true and priority ≤ 2");
    expect(humanize("state=1^ORstate=2")).toBe("state is 1 or state is 2");
    expect(humanize("assigned_toISEMPTY")).toBe("assigned_to is empty");
    expect(humanize("short_descriptionLIKEoutage^ORDERBYDESCsys_created_on"))
      .toBe("short_description contains outage, sorted by sys_created_on (descending)");
  });

  it("explains IN lists and BETWEEN ranges", () => {
    expect(humanize("priorityIN1,2,3")).toBe("priority is one of [1, 2, 3]");
    expect(humanize("priorityBETWEEN1@3")).toBe("priority is between 1 and 3");
  });

  it("handles an empty query", () => {
    expect(humanize("")).toBe("(empty query)");
  });

  it("round-trips a builder query back to English", () => {
    const q = query().where("active", "eq", true).and("priority", "between", [1, 3]).build();
    expect(humanize(q)).toBe("active is true and priority is between 1 and 3");
  });

  it("renders a ^NQ new-query group as a top-level OR", () => {
    expect(humanize("active=true^priority=1^NQactive=false^priority=2"))
      .toBe("active is true and priority is 1; or active is false and priority is 2");
  });

  it("explains SAMEAS / NSAMEAS field comparisons", () => {
    expect(humanize("opened_bySAMEASassigned_to")).toBe("opened_by is the same as assigned_to");
    expect(humanize("opened_byNSAMEASassigned_to")).toBe("opened_by is not the same as assigned_to");
  });
});

describe("parseQuery ^NQ", () => {
  it("strips the NQ prefix and marks the join", () => {
    const conds = parseQuery("active=true^NQstate=6");
    expect(conds[0]).toMatchObject({ field: "active", op: "eq", join: "AND" });
    expect(conds[1]).toMatchObject({ field: "state", op: "eq", value: "6", join: "NQ" });
  });
});

describe("parseOrderBy", () => {
  it("captures ORDERBY and ORDERBYDESC", () => {
    expect(parseOrderBy("active=true^ORDERBYpriority^ORDERBYDESCsys_created_on"))
      .toEqual([{ field: "priority", desc: false }, { field: "sys_created_on", desc: true }]);
  });
});

describe("parseQuery BETWEEN", () => {
  it("parses a BETWEEN condition", () => {
    expect(parseQuery("priorityBETWEEN1@3")[0])
      .toMatchObject({ field: "priority", op: "between", value: "1@3" });
  });
});

describe("cli --explain", () => {
  it("prints the plain-English form and exits 0", () => {
    const r = run(["active=true^priority<=2", "--explain"]);
    expect(r.code).toBe(0);
    expect(r.output).toBe("active is true and priority ≤ 2");
  });
});
