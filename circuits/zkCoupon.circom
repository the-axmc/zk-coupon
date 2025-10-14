pragma circom 2.1.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

// Non-branching Merkle update using a 0/1 selector.
template MerkleUpdate() {
    signal input cur;
    signal input sib;
    signal input isRight; // 0 => cur on left, 1 => cur on right

    // boolean constrain selector
    isRight * (isRight - 1) === 0;

    signal left;
    signal right;

    // One product per equation (valid R1CS)
    signal t1;
    t1 <== sib - cur;
    left  <== cur + isRight * t1;

    signal t2;
    t2 <== cur - sib;
    right <== sib + isRight * t2;

    component p = Poseidon(2);
    p.inputs[0] <== left;
    p.inputs[1] <== right;

    signal output out;
    out <== p.out;
}

// Merkle inclusion with Poseidon for fixed height.
template MerkleProof(nLevels) {
    signal input leaf;                // private by default
    signal input root;                // becomes public if main exposes it
    signal input pathElements[nLevels];
    signal input pathIndex[nLevels];  // 0/1

    // thread the current hash through levels
    signal level[nLevels + 1];
    level[0] <== leaf;

    // predeclare components outside the loop
    component mu[nLevels];

    for (var i = 0; i < nLevels; i++) {
        mu[i] = MerkleUpdate();
        mu[i].cur     <== level[i];
        mu[i].sib     <== pathElements[i];
        mu[i].isRight <== pathIndex[i];
        level[i + 1]  <== mu[i].out;
    }

    // Enforce inclusion
    level[nLevels] === root;
}

// Main circuit: leaf = Poseidon(secret)
// And nullifierHash = Poseidon(secret, externalNullifier)
template ZKCoupon(nLevels) {
    // Private inputs
    signal input secret;
    signal input pathElements[nLevels];
    signal input pathIndex[nLevels];

    // Inputs we intend to make public (via main)
    signal input root;
    signal input externalNullifier;
    signal input nullifierHash;

    // leaf commitment
    component h1 = Poseidon(1);
    h1.inputs[0] <== secret;

    // membership
    component mp = MerkleProof(nLevels);
    mp.leaf <== h1.out;
    mp.root <== root;
    for (var i = 0; i < nLevels; i++) {
        mp.pathElements[i] <== pathElements[i];
        mp.pathIndex[i]   <== pathIndex[i];
    }

    // nullifier
    component h2 = Poseidon(2);
    h2.inputs[0] <== secret;
    h2.inputs[1] <== externalNullifier;

    // enforce nullifier match
    h2.out === nullifierHash;
}

// Expose publics here (inputs are private unless listed)
component main { public [root, externalNullifier, nullifierHash] } = ZKCoupon(16);
