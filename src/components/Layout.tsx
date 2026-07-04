import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Activity, Building2, Globe, GitBranch, Menu, Pickaxe, Shield, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import WalletButton from "./WalletButton";
import { useSolanaTPS } from "@/hooks/use-solana";
import { SOLANA_NETWORK } from "./SolanaProvider";

const navigation = [
  { name: "Explorer", href: "/", icon: Globe },
  { name: "Mine Operations", href: "/mine", icon: Pickaxe },
  { name: "Vault Dashboard", href: "/vault", icon: Building2 },
  { name: "Traceability", href: "/traceability", icon: GitBranch },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: tps } = useSolanaTPS();

  const networkLabel = SOLANA_NETWORK === "mainnet-beta" ? "Mainnet" : "Devnet";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-foreground">MetalX</span>
                <span className="text-xs text-muted-foreground ml-1.5 hidden sm:inline">on Solana</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-muted-foreground">Solana {networkLabel}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs font-mono text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>{tps ? `${tps.toLocaleString()} TPS` : "..."}</span>
              </div>
              <WalletButton />
            </div>

            <div className="flex md:hidden items-center gap-2">
              <WalletButton />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 p-4 space-y-1">
            {navigation.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
