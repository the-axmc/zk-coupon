// scripts/buildTree.mjs  (ESM; Node 20+)
import fs from "fs";
import { webcrypto as crypto } from "node:crypto";
import { buildPoseidon } from "circomlibjs";

const N_LEVELS = 16;      // tree height
const N = 8;              // how many demo users to generate (<= 2^N_LEVELS)

// helpers
const big = (n) => BigInt(n);
const toDecStr = (x) => big(x).toString();

// cryptographically-strong random 32 bytes -> hex
function cryptoRandomHex(nBytes = 32) {
  const arr = new Uint8Array(nBytes);
  crypto.getRandomValues(arr);
  return [...arr].map(b => b.toString(16).padStart(2, "0")).join("");
}

(async () => {
  // 0) build Poseidon
  const P = await buildPoseidon();
  const H1 = (x) => P.F.toObject(P([x]));            // leaf hash: Poseidon(secret)
  const H2 = (a, b) => P.F.toObject(P([a, b]));      // internal node
  const Nullifier = (s, ext) => P.F.toObject(P([s, ext]));

  // 1) generate secrets
  const secrets = Array.from({ length: N }, () =>
    BigInt.asUintN(254, BigInt("0x" + cryptoRandomHex(32)))
  );

  // 2) leaves
  const leaves = secrets.map((s) => H1(s));

  // 3) build a power-of-two Merkle tree of height N_LEVELS
  const size = 1 << N_LEVELS;
  const zero = 0n;
  const level0 = Array(size).fill(zero);
  leaves.forEach((leaf, i) => (level0[i] = leaf));

  const tree = [level0];
  for (let l = 0; l < N_LEVELS; l++) {
    const cur = tree[l];
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      const left = cur[i];
      const right = cur[i + 1];
      next.push(H2(left, right));
    }
    tree.push(next);
  }
  const root = tree[N_LEVELS][0];

  // 4) write root for the frontend
  fs.mkdirSync("public", { recursive: true });
  fs.writeFileSync(
    "public/root.json",
    JSON.stringify({ root: toDecStr(root) }, null, 2)
  );

  // 5) per-user inputs
  fs.mkdirSync("inputs/users", { recursive: true });

  for (let idx = 0; idx < leaves.length; idx++) {
    const secret = secrets[idx];
    const pathElements = [];
    const pathIndex = [];

    let pos = idx;
    for (let l = 0; l < N_LEVELS; l++) {
      const isRight = pos & 1;
      const siblingPos = isRight ? pos - 1 : pos + 1;
      pathElements.push(tree[l][siblingPos] ?? zero);
      pathIndex.push(isRight); // 0 => cur on left, 1 => cur on right
      pos >>= 1;
    }

    const externalNullifier = 12345n; // event-specific id
    const nullifierHash = Nullifier(secret, externalNullifier);

    const userInput = {
      secret: toDecStr(secret),
      pathElements: pathElements.map(toDecStr),
      pathIndex,                                // numbers 0/1
      root: toDecStr(root),
      externalNullifier: toDecStr(externalNullifier),
      nullifierHash: toDecStr(nullifierHash),
    };

    fs.writeFileSync(
      `inputs/users/user_${idx}.json`,
      JSON.stringify(userInput, null, 2)
    );
  }

  console.log("Root:", toDecStr(root));
  console.log("Wrote public/root.json and inputs/users/user_*.json");
})();
