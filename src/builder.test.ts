import { describe, it, expect } from "vitest";
import { query } from "./builder";

describe("QueryBuilder", () => {
  it("builds a simple AND query", () => {
    const q = query().where("active", "eq", true).and("priority", "lte", 2).build();
    expect(q).toBe("active=true^priority<=2");
  });

  it("builds OR conditions", () => {
    const q = query().where("state", "eq", 1).or("state", "eq", 2).build();
    expect(q).toBe("state=1^ORstate=2");
  });

  it("handles unary and list operators", () => {
    expect(query().where("assigned_to", "isEmpty").build()).toBe("assigned_toISEMPTY");
    expect(query().where("priority", "in", [1, 2, 3]).build()).toBe("priorityIN1,2,3");
  });

  it("text operators and ordering", () => {
    const q = query()
      .where("short_description", "contains", "outage")
      .orderByDesc("sys_created_on")
      .build();
    expect(q).toBe("short_descriptionLIKEoutage^ORDERBYDESCsys_created_on");
  });

  it("toString equals build", () => {
    const b = query().where("x", "eq", 1);
    expect(b.toString()).toBe(b.build());
  });
});
