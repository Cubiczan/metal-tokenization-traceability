import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function useSolanaBalance() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  return useQuery({
    queryKey: ["sol-balance", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    },
    enabled: connected && !!publicKey,
    refetchInterval: 30_000,
  });
}

export function useSolanaSlot() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["sol-slot"],
    queryFn: () => connection.getSlot(),
    refetchInterval: 5_000,
  });
}

export function useSolanaTPS() {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["sol-tps"],
    queryFn: async () => {
      const samples = await connection.getRecentPerformanceSamples(1);
      if (samples.length > 0) {
        return Math.round(samples[0].numTransactions / samples[0].samplePeriodSecs);
      }
      return null;
    },
    refetchInterval: 15_000,
  });
}
