// @vitest-environment node
//
// PDA derivation in @solana/web3.js needs a Node-compatible crypto/Buffer;
// jsdom's shims break findProgramAddressSync, so this file runs under node.
import { describe, it, expect } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { deriveBatchPda, loadProvenance } from "@/lib/provenance";
import { batches, getBatch } from "@/lib/mock-data";
import { PROGRAM_IDS } from "@/lib/program-ids";

// The reserve_registry program id (an executable program address, i.e. off
// the ed25519 curve) — required for PDA derivation to find a valid nonce.
const DUMMY_PROGRAM = new PublicKey(PROGRAM_IDS.RESERVE_REGISTRY);

describe("batch PDA derivation", () => {
  it("is deterministic for a given batch id", () => {
    const a = deriveBatchPda("BAT-GLD-0001", DUMMY_PROGRAM);
    const b = deriveBatchPda("BAT-GLD-0001", DUMMY_PROGRAM);
    expect(a.toBase58()).toBe(b.toBase58());
  });

  it("produces distinct PDAs for distinct batch ids", () => {
    const a = deriveBatchPda("BAT-GLD-0001", DUMMY_PROGRAM);
    const b = deriveBatchPda("BAT-SLV-0007", DUMMY_PROGRAM);
    expect(a.toBase58()).not.toBe(b.toBase58());
  });
});

describe("provenance three-tier fallback", () => {
  it("serves mock data when the program id is the placeholder", async () => {
    // No connection is touched on the mock path, so a stub is safe.
    const result = await loadProvenance({} as never);
    expect(result.tier).toBe("mock");
    expect(result.batches).toEqual(batches);
  });
});

describe("mock provenance invariants", () => {
  it("has custody chains that start at hop 0 and increase by 1", () => {
    for (const batch of batches) {
      batch.custody.forEach((event, idx) => {
        expect(event.hop).toBe(idx);
      });
    }
  });

  it("keeps transfer_count consistent with the number of custody hops", () => {
    for (const batch of batches) {
      // transferCount is the number of hops after genesis (hop 0).
      expect(batch.transferCount).toBe(batch.custody.length - 1);
    }
  });

  it("resolves a known batch by id", () => {
    expect(getBatch("BAT-GLD-0001")?.metal).toBe("Gold");
    expect(getBatch("does-not-exist")).toBeUndefined();
  });
});
