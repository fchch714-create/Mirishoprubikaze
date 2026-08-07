import * as swc from "@swc/core";
import fs from "fs";

const code = fs.readFileSync("src/components/layout/Header.tsx", "utf8");

try {
  swc.parseSync(code, { syntax: "typescript", tsx: true });
  console.log("SWC Parse Success");
} catch (e) {
  console.error("SWC Parse Error:", e.message);
}
