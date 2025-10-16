# ZK Coupon — Anonymous Check-In

A minimal, end-to-end **zero-knowledge proof app** built with **Circom** + **snarkjs** + **vanilla HTML**, proving:

> “I’m on the allowlist and haven’t used my coupon yet”  
> — without revealing your secret.

---

## Concept

This demo implements a **Merkle membership + nullifier pattern**:

- **Merkle proof:** verifies the user’s secret is in an allowlist.
- **Nullifier:** ensures each secret can only be used once.
- **PLONK proof:** generated and verified entirely client-side in the browser.

---

## Tech Stack

| Layer          | Tool                                            |
| -------------- | ----------------------------------------------- |
| Circuit        | Circom                                          |
| Proving system | PLONK via snarkjs                               |
| Hash           | Poseidon                                        |
| Frontend       | Vanilla JS + snarkjs WASM                       |
| Hosting        | Static (`http-server`, GitHub Pages, or Vercel) |

---

## Run locally

```bash
git clone https://github.com/the-axmc/zk-coupon.git
cd zk-coupon
npx http-server public -p 8080

```

## What it demonstrates

1. Fully offline ZK proof generation in the browser.

2. Secure one-time proof via nullifier.

3. Reusable pattern for phygital tickets, anonymous voting, or gated access.

## Author

Built by andlopvic 💙 / axmc
