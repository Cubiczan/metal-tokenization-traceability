import { useMemo, useState } from "react";
import { GitBranch, Wifi, WifiOff, Database, MapPin, Hash, ArrowRight, Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MetricCard from "@/components/MetricCard";
import { formatNumber } from "@/lib/mock-data";
import { useProvenance } from "@/hooks/use-provenance";

const tierMeta = {
  live: { label: "On-Chain Provenance", Icon: Wifi, cls: "text-success" },
  cache: { label: "Cached Provenance", Icon: Database, cls: "text-warning" },
  mock: { label: "Sample Provenance · Deploy program to activate", Icon: WifiOff, cls: "text-muted-foreground" },
} as const;

export default function Traceability() {
  const { data, isLoading } = useProvenance();
  const batches = data?.batches ?? [];
  const tier = data?.tier ?? "mock";
  const [selected, setSelected] = useState<string | null>(null);

  const active = useMemo(
    () => batches.find((b) => b.batchId === selected) ?? batches[0],
    [batches, selected],
  );

  const totalHops = batches.reduce((s, b) => s + b.custody.length, 0);
  const { label, Icon, cls } = tierMeta[tier];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${cls}`} />
          <span className={`text-xs font-medium uppercase tracking-wider ${cls}`}>
            {isLoading ? "Loading provenance..." : label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Metal Traceability</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          End-to-end chain of custody for every physical metal batch — from mine extraction
          through assay, transport and vaulting. Each hop is committed on-chain with a SHA-256
          hash of its off-chain assay and shipping payload.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Tracked Batches" value={batches.length.toString()} icon={Boxes} />
        <MetricCard title="Custody Events" value={totalHops.toString()} subtitle="append-only hops" icon={GitBranch} />
        <MetricCard
          title="Total Tracked (oz)"
          value={formatNumber(batches.reduce((s, b) => s + b.amountOz, 0))}
          icon={Hash}
        />
      </div>

      {/* Batch list */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Registered Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs">Batch ID</TableHead>
                <TableHead className="text-xs">Metal</TableHead>
                <TableHead className="text-xs">Amount (oz)</TableHead>
                <TableHead className="text-xs">Origin</TableHead>
                <TableHead className="text-xs">Custodian</TableHead>
                <TableHead className="text-xs">Hops</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow
                  key={b.batchId}
                  className={`border-border/30 cursor-pointer ${active?.batchId === b.batchId ? "bg-primary/5" : ""}`}
                  onClick={() => setSelected(b.batchId)}
                >
                  <TableCell className="font-mono text-xs text-primary">{b.batchId}</TableCell>
                  <TableCell className="text-sm">{b.metal}</TableCell>
                  <TableCell className="text-sm font-mono">{formatNumber(b.amountOz)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.origin}</TableCell>
                  <TableCell className="text-sm">{b.currentCustodian}</TableCell>
                  <TableCell className="text-sm font-mono">{b.transferCount + 1}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Custody timeline for selected batch */}
      {active && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Chain of Custody
              <span className="font-mono text-xs text-primary">· {active.batchId}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {active.custody.map((e, idx) => (
                <li key={e.hop} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {e.hop}
                    </div>
                    {idx < active.custody.length - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{e.type}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{e.custodian}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>
                      <span className="font-mono">{new Date(e.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-muted-foreground">
                      <Hash className="w-3 h-3" />
                      <span className="truncate">payload {e.payloadHash.slice(0, 24)}…</span>
                      <span className="text-primary/70 ml-2">tx {e.txSignature}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
