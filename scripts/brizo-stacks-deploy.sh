#!/usr/bin/env bash
set -euo pipefail

# Brizo Stacks Testnet: Fund & Deploy (one command)
# - Detect Clarinet deployer address (testnet)
# - Optionally override with a custom private key (temporary)
# - Fund via faucet API and poll until confirmed
# - Deploy non-interactively and print TXIDs + explorer links

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CONTRACTS_DIR="$PROJECT_ROOT/contracts"
SETTINGS_DIR="$CONTRACTS_DIR/settings"
TESTNET_TOML="$SETTINGS_DIR/Testnet.toml"
LOG_FILE="$PROJECT_ROOT/.brizo-deploy.log"

USE_CUSTOM_KEY="false"
SKIP_FUND="false"

for arg in "$@"; do
  case "$arg" in
    --use-custom-key)
      USE_CUSTOM_KEY="true";;
    --skip-fund)
      SKIP_FUND="true";;
    *)
      echo "Unknown option: $arg" >&2
      exit 1;;
  esac
done

# Colors (fallback if tput unavailable)
if command -v tput >/dev/null 2>&1; then
  COLOR_CYAN="$(tput setaf 6)"; COLOR_GREEN="$(tput setaf 2)"; COLOR_YELLOW="$(tput setaf 3)"; COLOR_RED="$(tput setaf 1)"; COLOR_BOLD="$(tput bold)"; COLOR_RESET="$(tput sgr0)"
else
  COLOR_CYAN=""; COLOR_GREEN=""; COLOR_YELLOW=""; COLOR_RED=""; COLOR_BOLD=""; COLOR_RESET=""
fi

banner() {
  echo "${COLOR_CYAN}${COLOR_BOLD}$1${COLOR_RESET}"
}

note() { echo "${COLOR_YELLOW}$*${COLOR_RESET}"; }
ok()   { echo "${COLOR_GREEN}$*${COLOR_RESET}"; }
err()  { echo "${COLOR_RED}$*${COLOR_RESET}"; }

# Preflight checks
banner "[0/4] Preflight checks"
if ! command -v clarinet >/dev/null 2>&1; then
  err "Missing 'clarinet'. Install: brew install clarinet"
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  err "Missing 'curl'. Install via Homebrew: brew install curl"
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  err "Missing 'jq'. Install via Homebrew: brew install jq"
  exit 1
fi

if [ ! -f "$TESTNET_TOML" ]; then
  err "Not a Clarinet project or missing $TESTNET_TOML"
  exit 1
fi

mkdir -p "$SETTINGS_DIR"

# Optionally inject custom private key (temporary)
RESTORE_BACKUP=""
if [ "$USE_CUSTOM_KEY" = "true" ]; then
  if [ -z "${CUSTOM_PRIVATE_KEY:-}" ]; then
    err "--use-custom-key set but CUSTOM_PRIVATE_KEY env var is empty"
    exit 1
  fi
  # Backup settings file
  RESTORE_BACKUP="$TESTNET_TOML.bak.$(date +%s)"
  cp "$TESTNET_TOML" "$RESTORE_BACKUP" || true
  # Write private key into deployer, clear mnemonic
  # Generate a minimal Testnet.toml if needed
  if ! grep -q "^\[network\]" "$TESTNET_TOML" 2>/dev/null; then
    cat > "$TESTNET_TOML" <<'EOF'
[network]
name = "testnet"
deployment_fee_rate = 10

[accounts.deployer]
balance = 1000000000000000
EOF
  fi
  # Remove existing mnemonic line and set private_key
  tmpfile="$(mktemp)"
  awk '\
    BEGIN{mn=0} \
    { \
      if ($0 ~ /mnemonic\s*=/) next; \
      print $0; \
    }' "$TESTNET_TOML" > "$tmpfile"
  mv "$tmpfile" "$TESTNET_TOML"
  # If private_key exists, replace; else append under accounts.deployer
  if grep -q "private_key\s*=\s*\"" "$TESTNET_TOML"; then
    sed -i.bak "s|private_key\s*=\s*\".*\"|private_key = \"${CUSTOM_PRIVATE_KEY}\"|" "$TESTNET_TOML" && rm -f "$TESTNET_TOML.bak"
  else
    # Append into accounts.deployer section
    awk -v pk="$CUSTOM_PRIVATE_KEY" '
      BEGIN{inacc=0}
      /^\[accounts.deployer\]/{inacc=1; print; next}
      /^\[/{if(inacc==1){print "private_key = \"" pk "\""; inacc=0} print; next}
      {print}
      END{if(inacc==1) print "private_key = \"" pk "\""}
    ' "$TESTNET_TOML" > "$tmpfile"
    mv "$tmpfile" "$TESTNET_TOML"
  fi
  ok "Injected custom private key into settings/Testnet.toml (will be restored after deploy)"
fi

# [1/4] Detect deployer address (clarinet accounts --testnet)
banner "[1/4] Detect deployer address"
ADDR=""

# Try clarinet accounts (v3 may not support this; ignore errors)
pushd "$CONTRACTS_DIR" >/dev/null
ACCOUNTS_OUT="$(clarinet accounts --testnet 2>/dev/null || true)"
if echo "$ACCOUNTS_OUT" | grep -qi "deployer"; then
  ADDR="$(echo "$ACCOUNTS_OUT" | awk '/deployer/{flag=1;next}/^$/{flag=0}flag' | grep -Eo 'ST[A-Z0-9]+' | head -n1 || true)"
fi

# If still empty, generate a plan and parse expected-sender
if [ -z "$ADDR" ]; then
  clarinet deployments generate --testnet --medium-cost | cat || true
  if [ -f "$CONTRACTS_DIR/deployments/default.testnet-plan.yaml" ]; then
    ADDR="$(grep -Eo 'expected-sender:\s*ST[A-Z0-9]+' "$CONTRACTS_DIR/deployments/default.testnet-plan.yaml" | head -1 | awk '{print $2}' || true)"
  fi
fi

popd >/dev/null

# Fallback to reading Testnet.toml address
if [ -z "$ADDR" ] && grep -q "address\s*=\s*\"ST" "$TESTNET_TOML" 2>/dev/null; then
  ADDR="$(grep -Eo 'address\s*=\s*"(ST[A-Z0-9]+)"' "$TESTNET_TOML" | sed -E 's/.*"(ST[A-Z0-9]+)"/\1/' | head -n1)"
fi

if [ -z "$ADDR" ]; then
  err "Unable to detect deployer address. Ensure Testnet.toml has a signer or generate a plan."
  [ -n "$RESTORE_BACKUP" ] && cp "$RESTORE_BACKUP" "$TESTNET_TOML" && ok "Restored Testnet.toml"
  exit 1
fi

ok "Deployer: $ADDR"
echo "Explorer: https://explorer.hiro.so/address/$ADDR?chain=testnet"

# [2/4] Fund via faucet (unless skipped)
banner "[2/4] Fund deployer via faucet"
if [ "$SKIP_FUND" = "true" ]; then
  note "--skip-fund specified; skipping faucet"
else
  FAUCET_URL="https://stacks-node-api.testnet.stacks.co/extended/v1/faucets/stx"
  BODY="{\"address\":\"$ADDR\"}"
  backoff=2
  for i in 1 2 3 4; do
    set +e
    RESP="$(curl -sS -X POST -H 'Content-Type: application/json' -d "$BODY" "$FAUCET_URL" 2>&1)"
    CODE=$?
    set -e
    if [ $CODE -eq 0 ]; then
      ok "Faucet request accepted (attempt $i)"
      break
    else
      note "Faucet attempt $i failed; retrying in ${backoff}s"
      sleep "$backoff"
      backoff=$((backoff*2))
    fi
    if [ $i -eq 4 ]; then
      err "Faucet failed after retries"
      [ -n "$RESTORE_BACKUP" ] && cp "$RESTORE_BACKUP" "$TESTNET_TOML" && ok "Restored Testnet.toml"
      exit 1
    fi
  done

  # Poll balance up to ~60s
  banner "Polling for confirmed balance"
  for t in $(seq 0 6); do
    # Try v2/accounts first
    BAL_JSON="$(curl -s "https://stacks-node-api.testnet.stacks.co/v2/accounts/$ADDR" || true)"
    BALANCE="$(echo "$BAL_JSON" | jq -r '.balance' 2>/dev/null || echo "")"
    if [ -z "$BALANCE" ] || [ "$BALANCE" = "null" ]; then
      BAL_JSON="$(curl -s "https://stacks-node-api.testnet.stacks.co/extended/v1/address/$ADDR/stx" || true)"
      BALANCE="$(echo "$BAL_JSON" | jq -r '.balance' 2>/dev/null || echo "")"
    fi
    if [ -n "$BALANCE" ] && [ "$BALANCE" != "null" ]; then
      # Numeric check (fallback grep if jq missing)
      if echo "$BALANCE" | grep -Eq '^[0-9]+$'; then
        if [ "$BALANCE" -gt 0 ]; then ok "Balance: ${BALANCE} µSTX"; break; fi
      fi
    fi
    if [ "$t" -eq 6 ]; then
      err "Timed out waiting for faucet confirmation"
      [ -n "$RESTORE_BACKUP" ] && cp "$RESTORE_BACKUP" "$TESTNET_TOML" && ok "Restored Testnet.toml"
      exit 1
    fi
    sleep 10
  done
fi

# [3/4] Deploy non-interactively
banner "[3/4] Deploying contracts (non-interactive)"
pushd "$CONTRACTS_DIR" >/dev/null
set +e
# Ensure a plan exists/updated for current signer
clarinet deployments generate --testnet --medium-cost | cat
printf "y\ny\n" | clarinet deployments apply --testnet | tee "$LOG_FILE"
RC=$?
set -e
popd >/dev/null

if [ $RC -ne 0 ] || grep -Eqi 'NotEnoughFunds|invalid address|already exists' "$LOG_FILE"; then
  err "Deployment error detected."
  if grep -Eqi 'already exists' "$LOG_FILE"; then
    note "Contract name collision detected. Rename contracts (e.g., append -v2) and re-run."
  fi
  [ -n "$RESTORE_BACKUP" ] && cp "$RESTORE_BACKUP" "$TESTNET_TOML" && ok "Restored Testnet.toml"
  exit 1
fi

# [4/4] Extract and print TXIDs
banner "[4/4] Deployment results"
TXIDS=$(grep -Eo 'txid:\s*0x[0-9a-fA-F]{64}' "$LOG_FILE" | awk '{print $2}' | sort -u)
if [ -z "$TXIDS" ]; then
  note "No TXIDs found in log. Check $LOG_FILE for details."
else
  for tx in $TXIDS; do
    ok "✅ -> $tx"
    echo "   https://explorer.hiro.so/txid/${tx}?chain=testnet"
  done
fi

# Security hygiene: restore backup if we injected a key
if [ -n "$RESTORE_BACKUP" ]; then
  cp "$RESTORE_BACKUP" "$TESTNET_TOML" || true
  ok "Scrubbed secrets: restored settings/Testnet.toml"
fi

note "Re-run quick: npm run fund:deploy  # or add --skip-fund for faster retries"


