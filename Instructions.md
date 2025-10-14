1. ## Circuit: “Semaphore-lite” (Merkle + Nullifier)

We’ll prove:

- Private: secret, Merkle path (pathElements[], pathIndex[]).

- Public: root (allowlist commitment), externalNullifier (event/campaign id), nullifierHash (prevents double use).

# Constraint logic:

- Poseidon(secret) is a leaf in the Merkle tree root.

- Poseidon(secret, externalNullifier) == nullifierHash.

circuits/zkCoupon.circom

2. ## NPM scripts to compile + setup + prove

# package.json → add:

{
"scripts": {
"compile": "circom circuits/zkCoupon.circom --r1cs --wasm --sym -o build",
"ptau:new": "snarkjs powersoftau new bn128 16 build/pot16_0000.ptau",
"ptau:contribute": "snarkjs powersoftau contribute build/pot16_0000.ptau build/pot16_0001.ptau -e=\"zk-coupon\"",
"ptau:phase2": "snarkjs powersoftau prepare phase2 build/pot16_0001.ptau build/pot16_final.ptau",
"setup": "snarkjs groth16 setup build/zkCoupon.r1cs build/pot16_final.ptau build/zkCoupon_0000.zkey",
"beacon": "snarkjs zkey beacon build/zkCoupon_0000.zkey build/zkCoupon_final.zkey 0123456789abcdef0123456789abcdef 10",
"vkey": "snarkjs zkey export verificationkey build/zkCoupon_final.zkey public/verification_key.json",
"witness": "node build/zkCoupon_js/generate_witness.js build/zkCoupon_js/zkCoupon.wasm inputs/input.json build/witness.wtns",
"prove": "snarkjs groth16 prove build/zkCoupon_final.zkey build/witness.wtns public/proof.json public/publicSignals.json",
"verify": "snarkjs groth16 verify public/verification_key.json public/publicSignals.json public/proof.json",
"sol": "snarkjs zkey export solidityverifier build/zkCoupon_final.zkey contracts/Verifier.sol"
}
}

# Compile & Ceremony:

- npm run compile

> compile
> circom circuits/zkCoupon.circom --r1cs --wasm --sym -o build

template instances: 143
non-linear constraints: 4395
linear constraints: 4889
public inputs: 3
private inputs: 33
public outputs: 0
wires: 9303
labels: 13835
Written successfully: build/zkCoupon.r1cs
Written successfully: build/zkCoupon.sym
Written successfully: build/zkCoupon_js/zkCoupon.wasm
Everything went okay

- npm run ptau:new

> ptau:new
> snarkjs powersoftau new bn128 16 build/pot16_0000.ptau

[INFO] snarkJS: First Contribution Hash:
e27d7e51 abd16bb3 c46609c7 5e963b5f
dbe25b00 c0b93a4c 528b569a d4b50fda
d9926ff2 781f4bae fac213db 214f30af
e681f7be 5c1f973c c567c817 e871f958

- npm run ptau:contribute

> ptau:contribute
> snarkjs powersoftau contribute build/pot16_0000.ptau build/pot16_0001.ptau -e="zk-coupon"

[INFO] snarkJS: Contribution Response Hash imported:
48d82851 a5586534 aa869a7e 018ecafd
abf97a42 c01d35d3 694ed286 9398f1ef
dfa39976 d30177f9 ca9c8f65 f1dc24a8
1bae0bc8 df83cd18 3a867a4d 8ea0485f
[INFO] snarkJS: Next Challenge Hash:
3e280527 e89bdbf4 8124c291 6e408c32
e1825617 fd164324 6ce569fd 602732c5
494103fc 67ba88df e6c40865 97ddc61c
660dd28d 69a6b159 3543119f dec74761

- npm run ptau:phase2

> ptau:phase2
> snarkjs powersoftau prepare phase2 build/pot16_0001.ptau build/pot16_final.ptau

Phase 2 “hangs” happens sometimes with snarkjs even when the ptau is fine.

- get a precomputed final ptau for power 16
  mkdir -p build
  curl -L -o build/pot16_final.ptau https://raw.githubusercontent.com/iden3/snarkjs/master/ptau/powersOfTau28_hez_final_16.ptau

- verify it
  npx snarkjs@0.7.5 powersoftau verify build/pot16_final.ptau

# Artifacts to note:

- build/zkCoupon_js/zkCoupon.wasm (witness generator for browser/Node)
- build/zkCoupon_final.zkey (proving key)
- public/verification_key.json (for verification anywhere)

3. ## Build an allowlist root + user packs (Node)

We’ll:

- Generate N random secrets (give each user theirs).

- Compute leaves = poseidon(secret).

- Build a Poseidon Merkle tree.

- Export:

  - public/root.json (tree root for everyone).

  - Per-user inputs (path & selectors) so the user can prove locally.

scripts/buildTree.mjs
