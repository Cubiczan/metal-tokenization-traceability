import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { loadProvenance, type ProvenanceResult } from "@/lib/provenance";

/**
 * Loads metal-batch provenance with the three-tier (live → cache → mock)
 * fallback. Always resolves with data, so the traceability UI never blanks
 * out — the returned `tier` tells the UI whether it is showing on-chain,
 * cached, or sample data.
 */
export function useProvenance() {
  const { connection } = useConnection();

  return useQuery<ProvenanceResult>({
    queryKey: ["provenance"],
    queryFn: () => loadProvenance(connection),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });
}
