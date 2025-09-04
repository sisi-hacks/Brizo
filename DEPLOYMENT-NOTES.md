# Brizo Smart Contracts – Deployment Status and Continuation Plan

## Current Status
- Backend, frontend, scripts, and Clarinet configs are updated and ready.
- Automated workflow added:
  - `scripts/brizo-stacks-deploy.sh` (fund + deploy, non-interactive)
  - `npm run fund:deploy` and `npm run deploy:custom`
- Only the on-chain contract deployment to Stacks testnet is pending due to intermittent faucet/RPC issues.

## Challenges Encountered (Testnet)
- Address churn/selection:
  - Clarinet’s generated plans changed the `expected-sender` as signer inputs changed.
  - Fix: derive the sender from the generated plan each run and fund that specific address.
- Faucet flakiness and API change:
  - POST body rejected; faucet requires query param `?address=…`.
  - Balance polling sometimes slow; added retries/backoff.
- RPC broadcast instability:
  - “RecvError” during `clarinet deployments apply` on the Hiro proxy.
  - Fix: switch to core node `STACKS_API_URL=https://stacks-node-api.testnet.stacks.co` and retry.
- Non‑interactive Clarinet apply:
  - Clarinet prompts overwrite/apply; scripted piping of `y` added, plus retries.

## How To Complete Deployment (Reliable Sequence)
1) Use core node and generate plan:
   ```bash
   cd contracts
   export STACKS_API_URL=https://stacks-node-api.testnet.stacks.co
   clarinet deployments generate --testnet --medium-cost
   ADDR=$(grep -Eo 'expected-sender:\s*ST[A-Z0-9]+' deployments/default.testnet-plan.yaml | head -1 | awk '{print $2}')
   ```
2) Fund expected sender and poll balance:
   ```bash
   curl -sS -X POST "https://stacks-node-api.testnet.stacks.co/extended/v1/faucets/stx?address=$ADDR"
   for i in {1..24}; do
     bal=$(curl -s "https://stacks-node-api.testnet.stacks.co/v2/accounts/$ADDR" | jq -r '.balance // "0"')
     [ "${bal:-0}" -gt 300000 ] && echo "Funded: $bal µSTX" && break
     sleep 5
   done
   ```
3) Apply with retries:
   ```bash
   printf "y\ny\n" | clarinet deployments apply --testnet | tee ../.brizo-deploy.log || \
   (sleep 15 && printf "y\ny\n" | clarinet deployments apply --testnet | tee -a ../.brizo-deploy.log)
   ```
4) Print TXIDs:
   ```bash
   grep -Eo 'txid:\s*0x[0-9a-fA-F]{64}' ../.brizo-deploy.log | awk '{print $2}' | sort -u
   ```

If contract-name collision occurs, suffix names in `deployments/default.testnet-plan.yaml` (e.g., `-v$(date +%s)`) and re-apply.

## Post‑Deployment Frontend Hookup
- Update `frontend/lib/contracts.ts` testnet addresses to the final deployed IDs:
  - `ST<address>.brizo-payments`
  - `ST<address>.brizo-trait`
  - `ST<address>.brizo-sbtc-integration`
  - `ST<address>.deploy`
- Smoke test flows:
  - Merchant registration → payment creation → payment completion/cancel.

## Ongoing Work After Submission
- Stabilize deployment script against node/faucet outages (extra backoff + alternate broadcast endpoint fallback).
- Add automatic unique name suffixing to avoid collisions.
- CI job to run `fund:deploy` on testnet nightly (optional).
- Finalize explorer links + screenshots in README once TXIDs confirm.


