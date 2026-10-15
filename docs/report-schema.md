# Security report format (v1.0)

Every part of Sentinel Voice reads the same report. The **engine** (`src/lib/security/engine.ts`) decides the findings with fixed rules; the **beginner view**, **expert view** and (later) **VoiceGuard voice** only explain them. Avalanche stores the report's fingerprint.

Type definitions: `src/lib/security/types.ts`.

## Example — unlimited approval (sample data)

```json
{
  "schema_version": "1.0",
  "scenario_id": "unlimited-approval",
  "sample_data": true,
  "chain": { "name": "Avalanche Fuji (testnet)", "chain_id": 43113 },
  "transaction": { "chain_id": 43113, "from": "0x9c1d…8c9d", "to": "0x5f0e…5e4f", "value": "0", "data": "0x095ea7b3…" },
  "decoded": { "kind": "approve", "function": "approve(address,uint256)", "selector": "0x095ea7b3", "spender": "0x7a2c…8a0c", "amount_raw": "115792…9935", "unlimited": true },
  "token": { "address": "0x5f0e…5e4f", "symbol": "USDC", "name": "USD Coin (demo token)", "decimals": 6 },
  "counterparty": { "role": "spender", "address": "0x7a2c…8a0c", "label": "Demo DEX Router" },
  "risk_level": "high",
  "findings": [
    { "rule_id": "UNLIMITED_ALLOWANCE", "severity": "high", "unverified": false, "title": "Unlimited token approval", "evidence": "approve() amount is … (≥ 2^128)" }
  ],
  "checks_performed": ["…"],
  "not_checked": ["Contract source code or audit status", "…"],
  "recommended_action": "Don't approve an unlimited amount…",
  "report_hash": "0x…",
  "verification_tx": null
}
```

## Risk levels

| `risk_level`   | Meaning                                              | Beginner label          |
|----------------|------------------------------------------------------|-------------------------|
| `low`          | Our checks found nothing concerning                  | Lower risk              |
| `medium`       | Something worth a closer look                        | Take a closer look      |
| `high`         | A known risky pattern                                | High risk               |
| `unverified`   | No reputation data for a party — not proof of harm   | Unverified              |
| `insufficient` | Transaction couldn't be decoded                      | Not enough information  |

Priority: any `high` finding → `high`; else undecodable → `insufficient`; else any unverified finding → `unverified`; else any `medium` → `medium`; else `low`.

## Rules

| Rule ID                 | Severity | Fires when                                              |
|-------------------------|----------|---------------------------------------------------------|
| `UNSUPPORTED_CALL`      | medium   | Calldata isn't `transfer` or `approve`                  |
| `KNOWN_TOKEN`           | info     | Token contract is in the reputation list                |
| `UNKNOWN_TOKEN`         | medium*  | Token contract isn't in the list                        |
| `ZERO_ADDRESS`          | high     | Spender/recipient is `0x000…000`                        |
| `UNLIMITED_ALLOWANCE`   | high     | `approve` amount ≥ 2^128                                |
| `LIMITED_ALLOWANCE`     | info     | `approve` amount < 2^128                                |
| `KNOWN_SPENDER`         | info     | Spender is in the list                                  |
| `UNKNOWN_SPENDER`       | medium*  | Spender isn't in the list                               |
| `TRANSFER_AMOUNT`       | info     | Any `transfer`                                          |
| `KNOWN_RECIPIENT`       | info     | Recipient is in the list                                |
| `UNKNOWN_RECIPIENT`     | low      | Recipient isn't in the list                             |
| `NATIVE_VALUE_ATTACHED` | medium   | AVAX value attached to a token call                     |

\* marked `unverified: true`.

## Report hash

`report_hash` = SHA-256 of the report as canonical JSON (keys sorted) with `report_hash` and `verification_tx` set to `null` (`src/lib/security/hash.ts`). The Avalanche contract stores this hash; anyone can recompute it from the JSON to check the report wasn't changed. It proves the report is unchanged — not that the analysis is correct.

## Demo data

Addresses, the USDC token and the reputation list in `src/lib/security/reputation.ts` are **fictional demo data**. Always label results from them as samples.

Run the engine checks: `npm run check:engine`.
