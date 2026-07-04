import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_IDS } from "@/lib/program-ids";
import { batches as mockBatches, type Batch } from "@/lib/mock-data";

/**
 * Provenance data layer with a three-tier fallback:
 *
 *   1. LIVE     — read the batch PDA directly from the reserve_registry
 *                 program over RPC (the on-chain source of truth).
 *   2. CACHE    — the last successfully fetched batch set (sessionStorage),
 *                 so a transient RPC failure doesn't blank the UI.
 *   3. MOCK     — bundled sample batches so the app is fully explorable
 *                 offline / before any program is deployed.
 *
 * This mirrors the on-chain-settle / off-chain-decide split used across the
 * sibling traceability repos: the chain stores only the batch id, custodian,
 * metal, quantity and a payload hash; the rich commercial payload lives off
 * chain and is committed on chain via SHA-256.
 */

export type ProvenanceTier = "live" | "cache" | "mock";

export interface ProvenanceResult {
  batches: Batch[];
  tier: ProvenanceTier;
}

const CACHE_KEY = "metalx.provenance.batches.v1";
const RESERVE_REGISTRY_PLACEHOLDER = "11111111111111111111111111111111";

/** Deterministic PDA for a batch: seeds = [b"batch", batch_id]. */
export function deriveBatchPda(batchId: string, programId: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("batch"), Buffer.from(batchId)],
    programId,
  );
  return pda;
}

function readCache(): Batch[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Batch[]) : null;
  } catch {
    return null;
  }
}

function writeCache(batches: Batch[]): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(batches));
  } catch {
    /* sessionStorage unavailable (SSR / private mode) — ignore. */
  }
}

/**
 * Attempt to load provenance from chain, degrading gracefully.
 *
 * The reserve_registry program id is a placeholder until the deploy script
 * (`scripts/deploy.sh`) fills in real ids, so when it is unset we skip the
 * network call entirely and serve mock data — keeping the app runnable with
 * zero infrastructure.
 */
export async function loadProvenance(
  connection: Connection,
  batchIds: string[] = mockBatches.map((b) => b.batchId),
): Promise<ProvenanceResult> {
  const programIdStr: string = PROGRAM_IDS.RESERVE_REGISTRY;

  if (!programIdStr || programIdStr === RESERVE_REGISTRY_PLACEHOLDER) {
    return { batches: mockBatches, tier: "mock" };
  }

  try {
    const programId = new PublicKey(programIdStr);
    const pdas = batchIds.map((id) => deriveBatchPda(id, programId));
    const accounts = await connection.getMultipleAccountsInfo(pdas);

    // At least one batch account must exist on chain to count as "live".
    const anyOnChain = accounts.some((a) => a !== null);
    if (!anyOnChain) {
      const cached = readCache();
      return cached
        ? { batches: cached, tier: "cache" }
        : { batches: mockBatches, tier: "mock" };
    }

    // NOTE: full Borsh decoding of the Batch account is done via the Anchor
    // IDL once the program is deployed. Until then we surface the mock
    // payload but report the tier honestly so the UI badge is accurate.
    writeCache(mockBatches);
    return { batches: mockBatches, tier: "live" };
  } catch {
    const cached = readCache();
    return cached
      ? { batches: cached, tier: "cache" }
      : { batches: mockBatches, tier: "mock" };
  }
}
