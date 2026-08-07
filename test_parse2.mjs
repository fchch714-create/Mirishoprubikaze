import * as swc from "@swc/core";
import fs from "fs";

const code = fs.readFileSync("src/components/layout/CategoryClientContent.tsx", "utf8");

try {
  swc.parseSync(code, { syntax: "typescript", tsx: true });
  console.log("SWC Parse Success Category");
} catch (e) {
  console.error("SWC Parse Error Category:", e.message);
}
