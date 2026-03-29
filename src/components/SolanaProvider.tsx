import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import "@solana/wallet-adapter-react-ui/styles.css";

export const SOLANA_NETWORK = "mainnet-beta";

// Use a public RPC that doesn't rate-limit as aggressively
export const SOLANA_RPC_ENDPOINT =
  SOLANA_NETWORK === "mainnet-beta"
    ? "https://solana-mainnet.g.alchemy.com/v2/demo"
    : "https://api.devnet.solana.com";

interface Props {
  children: ReactNode;
}

export const SolanaProvider: FC<Props> = ({ children }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
