## 1️⃣ Overview

This repository implements a ZK Coupon / Anonymous Check-In system — a minimal end-to-end demo of a Merkle membership + nullifier circuit.
It allows a user to prove they’re on an allowlist (via Merkle root) without revealing their secret code or identity, and ensures one-time use through a nullifier hash.

It’s a reusable pattern for:

- Anonymous event check-ins (phygital tickets)

- One-time coupon redemptions

- Gated downloads or content access

- Anonymous voting or participation proofs

## 2️⃣ What it does

1. Circuit:

A Circom circuit defines the logic:

- Prove membership in a Merkle tree of secrets

- Include a public externalNullifier to prevent reuse

- Output (root, externalNullifier, nullifierHash) as public signals

2. Trusted Setup (PLONK):

Using snarkjs, we generate:

- zkCoupon.wasm — compiled circuit

- zkCoupon_plonk.zkey — proving key

- verification_key.json — for local/on-chain verification

- root.json — the Merkle root

3. Tree Builder:

scripts/buildTree.mjs generates:

- Random user secrets

- Merkle tree (Poseidon hash)

- Inclusion paths + nullifiers

- Individual input.json files for each user

4. Frontend:

The /public/index.html page:

- Loads input.json, zkCoupon.wasm, zkCoupon_plonk.zkey

- Runs snarkjs.plonk.fullProve client-side in WASM

- Verifies locally, showing ✅ / ❌

- Allows exporting proof.json and publicSignals.json

## 3️⃣ Project structure

zk-coupon/
├── circuits/zkCoupon.circom # Circuit logic (Merkle + nullifier)
├── build/ # Compiled circuit artifacts
│ ├── zkCoupon.wasm
│ ├── zkCoupon_plonk.zkey
│ ├── potXX_final.ptau
├── scripts/
│ └── buildTree.mjs # Generates secrets, Merkle tree, inputs
├── inputs/users/ # Per-user inputs (generated)
├── public/
│ ├── index.html # Browser interface
│ ├── input.json
│ ├── root.json
│ ├── verification_key.json
│ ├── zkCoupon.wasm
│ ├── zkCoupon_plonk.zkey
│ ├── proof.json # optional: sample proof
│ ├── publicSignals.json # optional: sample signals
└── README.md

## 4️⃣ How to run locally

```bash
git clone https://github.com/the-axmc/zk-coupon.git
cd zk-coupon
npx http-server public -p 8080
```

Open in browser:
👉 http://127.0.0.1:8080

Then click Generate Proof.
Wait ~20–40 seconds for WASM proving to finish.
You’ll see: ✅ Verified locally

and can download both proof.json and publicSignals.json.

## What's next?

- Add a Verifier.sol
