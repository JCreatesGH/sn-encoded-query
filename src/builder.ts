import { OPERATORS, OperatorName, UNARY, LIST_OPS } from "./operators.js";

interface Condition {
  field: string;
  op: OperatorName;
  value?: string | number | boolean | Array<string | number>;
  join: "AND" | "OR";
}

export class QueryBuilder {
  private conditions: Condition[] = [];
  private orderBys: string[] = [];

  where(field: string, op: OperatorName, value?: any): this {
    this.conditions.push({ field, op, value, join: "AND" });
    return this;
  }
  and(field: string, op: OperatorName, value?: any): this {
    return this.where(field, op, value);
  }
  or(field: string, op: OperatorName, value?: any): this {
    this.conditions.push({ field, op, value, join: "OR" });
    return this;
  }
  orderBy(field: string): this { this.orderBys.push("ORDERBY" + field); return this; }
  orderByDesc(field: string): this { this.orderBys.push("ORDERBYDESC" + field); return this; }

  private encodeCondition(c: Condition): string {
    const token = OPERATORS[c.op];
    if (UNARY.includes(c.op)) return `${c.field}${token}`;
    if (LIST_OPS.includes(c.op)) {
      const list = Array.isArray(c.value) ? c.value.join(",") : String(c.value);
      return `${c.field}${token}${list}`;
    }
    return `${c.field}${token}${formatValue(c.value)}`;
  }

  build(): string {
    const parts: string[] = [];
    this.conditions.forEach((c, i) => {
      const enc = this.encodeCondition(c);
      if (i === 0) parts.push(enc);
      else if (c.join === "OR") parts.push("^OR" + enc);
      else parts.push("^" + enc);
    });
    for (const o of this.orderBys) parts.push("^" + o);
    return parts.join("");
  }

  toString(): string { return this.build(); }
}

function formatValue(v: any): string {
  if (typeof v === "boolean") return v ? "true" : "false";
  return String(v ?? "");
}

export function query(): QueryBuilder {
  return new QueryBuilder();
}
