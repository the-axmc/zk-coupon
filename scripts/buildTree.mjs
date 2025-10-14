import { poseidon } from "circomlibjs";
import fs from "fs";

const N_LEVELS = 16;
const N = 8; // demo; can be up to 2^N_LEVELS

function big(n){ return BigInt(n); }
function toHex(x){ return "0x" + BigInt(x).toString(16); }

// 1) generate secrets (in prod you’d provision them securely)
const secrets = Array.from({length:N}, () =>
  (BigInt.asUintN(254, BigInt("0x" + cryptoRandomHex(64)))));

function cryptoRandomHex(nBytes){
  // not cryptographically strong in Node <19 without WebCrypto; adequate for demo
  return [...crypto.getRandomValues(new Uint8Array(nBytes))]
    .map(b=>b.toString(16).padStart(2,"0")).join("");
}

// Quick polyfill for WebCrypto in Node if needed:
import { webcrypto as crypto } from "node:crypto";

// 2) leaves = poseidon(secret)
const leaves = await Promise.all(secrets.map(s => poseidon([s])));

// 3) Build flat Merkle tree (left-pad with zeros to next power-of-two)
const size = 1 << N_LEVELS;
const zero = 0n;
const level0 = Array(size).fill(zero);
leaves.forEach((leaf, i) => level0[i] = leaf);

const tree = [level0];
for (let l=0; l<N_LEVELS; l++){
  const cur = tree[l];
  const next = [];
  for (let i=0;i<cur.length;i+=2){
    const left = cur[i];
    const right = cur[i+1];
    next.push(await poseidon([left, right]));
  }
  tree.push(next);
}
const root = tree[N_LEVELS][0];

// 4) Export root
fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/root.json", JSON.stringify({ root: root.toString() }, null, 2));

// 5) Per-user paths
fs.mkdirSync("inputs/users", { recursive: true });

for (let idx=0; idx<leaves.length; idx++){
  const secret = secrets[idx];
  const pathElements = [];
  const pathIndex = [];

  let pos = idx; // position at level 0
  let cur = leaves[idx];

  for (let l=0; l<N_LEVELS; l++){
    const isRight = pos & 1;
    const siblingPos = isRight ? pos - 1 : pos + 1;
    pathElements.push(tree[l][siblingPos]);
    pathIndex.push(isRight); // 0 => cur on left, 1 => cur on right
    pos = pos >> 1;
  }

  // externalNullifier: pick per-event integer id (demo=12345)
  const externalNullifier = 12345n;
  const nullifierHash = await poseidon([secret, externalNullifier]);

  const userInput = {
    secret: secret.toString(),
    pathElements: pathElements.map(x => x.toString()),
    pathIndex,
    root: root.toString(),
    externalNullifier: externalNullifier.toString(),
    nullifierHash: nullifierHash.toString()
  };

  fs.writeFileSync(`inputs/users/user_${idx}.json`, JSON.stringify(userInput, null, 2));
}

console.log("Root:", root.toString());
console.log("Wrote:", "public/root.json and inputs/users/user_*.json");
