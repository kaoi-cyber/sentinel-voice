// Compiles contracts/SentinelReportRegistry.sol into src/lib/avalanche/registry-artifact.json
// (ABI + bytecode) so the app can deploy and call it. Run: `npm run compile:contract`
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
// solc ships without types.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const solc = require("solc");

const root = path.join(__dirname, "..");
const file = "SentinelReportRegistry.sol";
const source = readFileSync(path.join(root, "contracts", file), "utf8");

const input = {
  language: "Solidity",
  sources: { [file]: { content: source } },
  settings: {
    // "paris" avoids newer opcodes, so the bytecode runs on any EVM chain, including Fuji.
    evmVersion: "paris",
    optimizer: { enabled: true, runs: 200 },
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.methodIdentifiers"] } },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = (output.errors ?? []).filter((e: { severity: string }) => e.severity === "error");
for (const e of output.errors ?? []) console.log(e.formattedMessage);
if (errors.length) process.exit(1);

const contract = output.contracts[file].SentinelReportRegistry;
const artifact = {
  contractName: "SentinelReportRegistry",
  compiler: solc.version(),
  evmVersion: input.settings.evmVersion,
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object,
  methodIdentifiers: contract.evm.methodIdentifiers,
};
const out = path.join(root, "src/lib/avalanche/registry-artifact.json");
writeFileSync(out, JSON.stringify(artifact, null, 2) + "\n");
console.log(`Compiled with solc ${artifact.compiler} → ${path.relative(root, out)} (${(artifact.bytecode.length - 2) / 2} bytes)`);
