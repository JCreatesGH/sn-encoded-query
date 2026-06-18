import { OPERATORS, OperatorName } from "./operators.js";

export interface ParsedCondition {
  field: string;
  op: OperatorName | "unknown";
  token: string;
  value: string;
  join: "AND" | "OR";
}

// Binary operators (those with a value); matched by *position*, not just length,
// so an operator substring inside a value (e.g. the "IN" in "state=INPROGRESS")
// can't beat the real, earlier operator.
const BINARY: Array<[OperatorName, string]> = (Object.entries(OPERATORS) as Array<[OperatorName, string]>)
  .filter(([name]) => name !== "isEmpty" && name !== "isNotEmpty");

// Longest unary suffix first (ISNOTEMPTY before ISEMPTY).
const UNARY_TOKENS: Array<[OperatorName, string]> = [
  ["isNotEmpty", OPERATORS.isNotEmpty],
  ["isEmpty", OPERATORS.isEmpty],
];

export interface OrderBy { field: string; desc: boolean; }

/** Extract the ORDERBY / ORDERBYDESC clauses from an encoded query. */
export function parseOrderBy(encoded: string): OrderBy[] {
  const out: OrderBy[] = [];
  for (const segment of encoded.split("^")) {
    if (/^ORDERBYDESC/i.test(segment)) out.push({ field: segment.slice("ORDERBYDESC".length), desc: true });
    else if (/^ORDERBY/i.test(segment)) out.push({ field: segment.slice("ORDERBY".length), desc: false });
  }
  return out;
}

export function parseQuery(encoded: string): ParsedCondition[] {
  const out: ParsedCondition[] = [];
  for (const segment of encoded.split("^")) {
    if (!segment) continue;
    if (/^ORDERBY/i.test(segment)) continue;
    let join: "AND" | "OR" = "AND";
    let seg = segment;
    if (seg.startsWith("OR")) { join = "OR"; seg = seg.slice(2); }

    // value-less suffix operators (field + ISEMPTY / ISNOTEMPTY)
    const unary = UNARY_TOKENS.find(([, t]) => seg.endsWith(t) && seg.length > t.length);
    if (unary) {
      out.push({ field: seg.slice(0, -unary[1].length), op: unary[0], token: unary[1], value: "", join });
      continue;
    }

    // The operator that starts earliest delimits field from value; on a tie the
    // longest token wins (so ">=" beats ">", "!=" beats "=").
    let best: { name: OperatorName; token: string; idx: number } | null = null;
    for (const [name, token] of BINARY) {
      const idx = seg.indexOf(token);
      if (idx > 0 && (best === null || idx < best.idx || (idx === best.idx && token.length > best.token.length))) {
        best = { name, token, idx };
      }
    }
    if (best) {
      out.push({ field: seg.slice(0, best.idx), op: best.name, token: best.token,
                 value: seg.slice(best.idx + best.token.length), join });
    } else {
      out.push({ field: seg, op: "unknown", token: "", value: "", join });
    }
  }
  return out;
}
