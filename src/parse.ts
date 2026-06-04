import { OPERATORS, OperatorName } from "./operators.js";

export interface ParsedCondition {
  field: string;
  op: OperatorName | "unknown";
  token: string;
  value: string;
  join: "AND" | "OR";
}

// longest tokens first so ">=" beats ">"
const TOKENS: Array<[OperatorName, string]> = (Object.entries(OPERATORS) as Array<[OperatorName, string]>)
  .sort((a, b) => b[1].length - a[1].length);


export function parseQuery(encoded: string): ParsedCondition[] {
  const out: ParsedCondition[] = [];
  for (const segment of encoded.split("^")) {
    if (!segment) continue;
    if (/^ORDERBY/i.test(segment)) continue;
    let join: "AND" | "OR" = "AND";
    let seg = segment;
    if (seg.startsWith("OR")) { join = "OR"; seg = seg.slice(2); }
    let matched = false;
    for (const [name, token] of TOKENS) {
      // unary tokens are suffixes (field + ISEMPTY)
      if ((name === "isEmpty" || name === "isNotEmpty")) {
        if (seg.endsWith(token)) {
          out.push({ field: seg.slice(0, -token.length), op: name, token, value: "", join });
          matched = true; break;
        }
        continue;
      }
      const idx = seg.indexOf(token);
      if (idx > 0) {
        out.push({ field: seg.slice(0, idx), op: name, token, value: seg.slice(idx + token.length), join });
        matched = true; break;
      }
    }
    if (!matched) out.push({ field: seg, op: "unknown", token: "", value: "", join });
  }
  return out;
}
