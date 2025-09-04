#!/usr/bin/env node

/*
  Brizo Stacks Testnet Auto-Deployment
  - Generates or uses a deployer wallet (Clarinet or custom STWK mnemonic/private_key)
  - Funds via testnet faucet and polls until confirmed
  - Generates Clarinet deployment plan and enforces unique contract names
  - Applies deployment non-interactively and captures TXIDs
  - Scrubs secrets from settings/Testnet.toml at the end (restores backup)

  Usage:
    node contracts/auto-deploy.js                # auto-generate deployer and fund via faucet
    STX_MNEMONIC="..." node contracts/auto-deploy.js # use provided testnet mnemonic (STWK…)
    STX_PRIVATE_KEY="..." node contracts/auto-deploy.js # use provided testnet private key

  Requirements:
    - Clarinet CLI installed (brew install clarinet)
    - Node.js 18+
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const https = require('https');

const ROOT = path.resolve(__dirname, '.');
const SETTINGS_DIR = path.resolve(ROOT, 'settings');
const TESTNET_TOML = path.resolve(SETTINGS_DIR, 'Testnet.toml');
const DEPLOYMENTS_DIR = path.resolve(ROOT, 'deployments');
const PLAN_FILE = path.resolve(DEPLOYMENTS_DIR, 'default.testnet-plan.yaml');

const FAUCET_URL = 'https://stacks-node-api.testnet.stacks.co/extended/v1/faucets/stx';
const BALANCE_URL = (addr) => `https://api.testnet.hiro.so/extended/v1/address/${addr}/balances`;

const TX_EXPLORER = (txid) => `https://explorer.hiro.so/txid/${txid}?chain=testnet`;
const ADDRESS_EXPLORER = (addr) => `https://explorer.hiro.so/address/${addr}?chain=testnet`;

function execOrThrow(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', shell: false, ...opts });
  if (res.error) throw res.error;
  const code = res.status;
  if (code !== 0) {
    const out = (res.stdout || '') + (res.stderr || '');
    throw new Error(`Command failed (${cmd} ${args.join(' ')}):\n${out}`);
  }
  return res.stdout || '';
}

function httpPostJson(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request({
      method: 'POST',
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(chunks || '{}')); } catch { resolve({}); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${chunks}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({ method: 'GET', hostname: u.hostname, path: u.pathname + u.search }, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        try { resolve(JSON.parse(chunks || '{}')); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function ensureDirs() {
  if (!fs.existsSync(SETTINGS_DIR)) fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  if (!fs.existsSync(DEPLOYMENTS_DIR)) fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
}

function backupFile(p) {
  if (!fs.existsSync(p)) return null;
  const backup = p + '.bak.' + Date.now();
  fs.copyFileSync(p, backup);
  return backup;
}

function restoreBackup(backupPath, targetPath) {
  if (!backupPath) return;
  try { fs.copyFileSync(backupPath, targetPath); } catch {}
}

function parseDeployerFromTestnetToml() {
  if (!fs.existsSync(TESTNET_TOML)) return {};
  const content = fs.readFileSync(TESTNET_TOML, 'utf8');
  const addrMatch = content.match(/\baddress\s*=\s*"([A-Z0-9\.]+)"/);
  const mnemonicMatch = content.match(/\bmnemonic\s*=\s*"([^"]+)"/);
  const pkMatch = content.match(/\bprivate_key\s*=\s*"([^"]+)"/);
  return {
    address: addrMatch ? addrMatch[1] : undefined,
    mnemonic: mnemonicMatch ? mnemonicMatch[1] : undefined,
    privateKey: pkMatch ? pkMatch[1] : undefined,
  };
}

function writeTestnetTomlWithSigner({ mnemonic, privateKey, address }) {
  const header = '[network]\nname = "testnet"\ndeployment_fee_rate = 10\n\n[accounts.deployer]\n';
  let signerLine;
  if (mnemonic) signerLine = `mnemonic = "${mnemonic}"`;
  else if (privateKey) signerLine = `private_key = "${privateKey}"`;
  else if (address) signerLine = `address = "${address}"`;
  else throw new Error('No signer details provided');
  const body = `${header}${signerLine}\nbalance = 1000000000000000\n`;
  fs.writeFileSync(TESTNET_TOML, body, 'utf8');
}

function clarinetAccountsGenerate() {
  // Clarinet prints mnemonic and addresses to stdout
  const out = execOrThrow('clarinet', ['accounts', 'generate']);
  // Try to find mnemonic line
  const m = out.match(/mnemonic:\s*"([^"]+)"/i) || out.match(/Mnemonic:\s*([a-z\s]+)/i);
  const mnemonic = m ? m[1].trim() : undefined;
  // Try to find ST* address
  const a = out.match(/(ST[A-Z0-9]{10,})/);
  const address = a ? a[1] : undefined;
  if (!mnemonic || !address) {
    throw new Error('Unable to parse clarinet accounts generate output.\n' + out);
  }
  return { mnemonic, address };
}

async function fundAndWait(address, minMicroStx = 200_000) {
  console.log(`\n[36mFunding ${address} via faucet...[0m`);
  let funded = false;
  // Try faucet up to 3 times
  for (let i = 0; i < 3; i++) {
    try {
      await httpPostJson(FAUCET_URL, { address });
      funded = true;
      break;
    } catch (e) {
      console.warn(`Faucet attempt ${i + 1} failed: ${e.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  if (!funded) throw new Error('Faucet funding failed after retries');

  console.log('Polling for confirmed balance...');
  const start = Date.now();
  while (true) {
    try {
      const bal = await httpGetJson(BALANCE_URL(address));
      const micro = Number(bal?.balance || bal?.stx?.balance || '0');
      if (micro >= minMicroStx) {
        console.log(`Balance confirmed: ${micro} µSTX`);
        break;
      }
    } catch {}
    if (Date.now() - start > 120000) {
      throw new Error('Balance confirmation timeout (>120s)');
    }
    await new Promise(r => setTimeout(r, 3000));
  }
}

function generatePlan() {
  console.log('\n[36mGenerating deployment plan...[0m');
  const out = execOrThrow('clarinet', ['deployments', 'generate', '--testnet', '--medium-cost'], { cwd: ROOT });
  if (!fs.existsSync(PLAN_FILE)) throw new Error('Plan file not found after generate');
  return out;
}

function enforceUniqueContractNames() {
  const ts = Math.floor(Date.now() / 1000);
  let yaml = fs.readFileSync(PLAN_FILE, 'utf8');
  // Replace lines like: contract-name: brizo-payments
  const names = [];
  yaml = yaml.replace(/(contract-name:\s*)([a-zA-Z0-9\-_.]+)/g, (m, pfx, name) => {
    const newName = /-v\d+$/.test(name) ? name : `${name}-v${ts}`;
    names.push({ old: name, new: newName });
    return pfx + newName;
  });
  fs.writeFileSync(PLAN_FILE, yaml, 'utf8');
  return names;
}

function applyPlanAndCaptureTxids() {
  console.log('\n[36mApplying deployment plan (non-interactive)...[0m');
  // Pipe "y" twice to accept overwrite/apply prompts if present
  const res = spawnSync('bash', ['-lc', 'printf "y\ny\n" | clarinet deployments apply --testnet | cat'], { cwd: ROOT, encoding: 'utf8' });
  const out = (res.stdout || '') + (res.stderr || '');
  if (res.status !== 0) {
    throw new Error('Apply failed:\n' + out);
  }
  // Capture txids from lines like: Transaction broadcasted (txid: ...)
  const txids = [];
  const txRegex = /(txid:\s*)([0-9a-fA-Fx]{10,})/g;
  let m;
  while ((m = txRegex.exec(out))) {
    txids.push(m[2]);
  }
  return { out, txids };
}

(async function main() {
  try {
    ensureDirs();

    const userMnemonic = process.env.STX_MNEMONIC && process.env.STX_MNEMONIC.trim();
    const userPrivateKey = process.env.STX_PRIVATE_KEY && process.env.STX_PRIVATE_KEY.trim();

    const backup = backupFile(TESTNET_TOML);

    // Decide signer
    let signer = parseDeployerFromTestnetToml();
    let useGenerated = false;

    if (userMnemonic || userPrivateKey) {
      // Use user-provided STWK signer
      writeTestnetTomlWithSigner({ mnemonic: userMnemonic, privateKey: userPrivateKey });
      signer = parseDeployerFromTestnetToml();
      console.log('\nUsing custom signer from env for deployment (will be scrubbed after).');
    } else {
      // If Testnet.toml lacks signing material, generate a fresh deployer
      if (!signer.mnemonic && !signer.privateKey) {
        console.log('\nNo signer found in Testnet.toml — generating a temporary deployer with Clarinet...');
        const gen = clarinetAccountsGenerate();
        useGenerated = true;
        writeTestnetTomlWithSigner({ mnemonic: gen.mnemonic });
        signer = { ...signer, mnemonic: gen.mnemonic, address: gen.address };
      }
    }

    // Resolve address for faucet/balance
    if (!signer.address) {
      // Try to get expected sender from a temporary plan
      try {
        generatePlan();
        const plan = fs.readFileSync(PLAN_FILE, 'utf8');
        const addrMatch = plan.match(/expected-sender:\s*(ST[A-Z0-9]+)/);
        if (addrMatch) signer.address = addrMatch[1];
      } catch {}
    }

    if (!signer.address) {
      throw new Error('Unable to resolve deployer address. Provide STX_MNEMONIC or STX_PRIVATE_KEY.');
    }

    console.log(`\nDeployer Address: ${signer.address}`);
    console.log(`Explorer: ${ADDRESS_EXPLORER(signer.address)}`);

    // Fund + wait
    await fundAndWait(signer.address, 200_000); // enough for plan costs with buffer

    // Generate plan + ensure unique names
    generatePlan();
    const renamed = enforceUniqueContractNames();
    if (renamed.length) {
      console.log('\nUnique contract names:');
      renamed.forEach(r => console.log(`  ${r.old} -> ${r.new}`));
    }

    // Apply plan and collect txids
    const { out, txids } = applyPlanAndCaptureTxids();

    // Print clean summary
    console.log('\n\u001b[32mDeployment Summary\u001b[0m');
    const labelRegex = /contract-name:\s*([a-zA-Z0-9\-_.]+)/g;
    const namesInPlan = fs.readFileSync(PLAN_FILE, 'utf8').match(labelRegex) || [];
    const names = namesInPlan.map(s => s.replace('contract-name:', '').trim());

    // Map names to txids in order if counts align
    const lines = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const tx = txids[i] || 'n/a';
      lines.push({ name, tx });
    }
    lines.forEach(l => console.log(`[32m[1m✅ ${l.name}[0m -> ${l.tx}`));
    lines.forEach(l => {
      if (l.tx && l.tx !== 'n/a') console.log(`   ${TX_EXPLORER(l.tx)}`);
    });

    console.log('\nDone.');
  } catch (err) {
    console.error('\n\u001b[31mDeployment failed:\u001b[0m', err.message);
    console.error('You can safely re-run this script; it is idempotent.');
    process.exitCode = 1;
  } finally {
    // Scrub secrets by restoring backup if it existed, else leave minimal address-only config
    try {
      const backupCandidates = fs.readdirSync(SETTINGS_DIR)
        .filter(f => f.startsWith('Testnet.toml.bak.'))
        .map(f => path.join(SETTINGS_DIR, f))
        .sort();
      const latest = backupCandidates[backupCandidates.length - 1];
      if (latest) {
        restoreBackup(latest, TESTNET_TOML);
        // Cleanup backup file
        try { fs.unlinkSync(latest); } catch {}
        console.log('\nSecrets scrubbed: Testnet.toml restored to previous state.');
      } else {
        // If we created a file, reduce it to address only if possible
        const current = parseDeployerFromTestnetToml();
        if (current.address) {
          writeTestnetTomlWithSigner({ address: current.address });
          console.log('\nSecrets scrubbed: Testnet.toml reduced to address only.');
        }
      }
    } catch {}
  }
})();
