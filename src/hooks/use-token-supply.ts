import { useQuery } from "@tanstack/react-query";
import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_RPC_ENDPOINT } from "@/components/SolanaProvider";

// These are placeholder mint addresses for the MetalX tokens (Token-2022 program)
// In production, replace with actual deployed mint addresses
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

// Placeholder mint addresses — replace with real deployed mints
export const TOKEN_MINTS: Record<string, string> = {
  xGLD: "11111111111111111111111111111111", // placeholder
  xSLV: "11111111111111111111111111111111", // placeholder
  xPLT: "11111111111111111111111111111111", // placeholder
  xPLD: "11111111111111111111111111111111", // placeholder
};

export interface TokenSupplyInfo {
  symbol: string;
  supply: number | null;
  decimals: number;
  isLive: boolean;
}

async function fetchTokenSupplies(): Promise<TokenSupplyInfo[]> {
  const connection = new Connection(SOLANA_RPC_ENDPOINT, "confirmed");
  const results: TokenSupplyInfo[] = [];

  for (const [symbol, mintAddress] of Object.entries(TOKEN_MINTS)) {
    // Skip placeholder addresses
    if (mintAddress === "11111111111111111111111111111111") {
      results.push({ symbol, supply: null, decimals: 9, isLive: false });
      continue;
    }

    try {
      const mint = new PublicKey(mintAddress);
      const supplyResponse = await connection.getTokenSupply(mint);
      const supply = Number(supplyResponse.value.amount) / Math.pow(10, supplyResponse.value.decimals);
      results.push({
        symbol,
        supply,
        decimals: supplyResponse.value.decimals,
        isLive: true,
      });
    } catch (err) {
      console.warn(`Failed to fetch supply for ${symbol}:`, err);
      results.push({ symbol, supply: null, decimals: 9, isLive: false });
    }
  }

  return results;
}

export function useTokenSupplies() {
  return useQuery({
    queryKey: ["token-supplies"],
    queryFn: fetchTokenSupplies,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });
}
