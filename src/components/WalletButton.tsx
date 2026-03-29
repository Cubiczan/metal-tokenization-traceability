import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function WalletButton() {
  const { publicKey, disconnect, connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (!connected) {
    return (
      <Button
        size="sm"
        onClick={() => setVisible(true)}
        disabled={connecting}
        className="gap-2 gradient-gold text-primary-foreground hover:opacity-90"
      >
        <Wallet className="w-4 h-4" />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  const address = publicKey?.toBase58() || "";
  const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="font-mono text-xs">{shortAddress}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => {
            navigator.clipboard.writeText(address);
            toast.success("Address copied");
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(`https://solscan.io/account/${address}`, "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Solscan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => disconnect()}>
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
