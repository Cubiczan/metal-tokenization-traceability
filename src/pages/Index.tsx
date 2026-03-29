import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shield, TrendingUp, Vault, BarChart3, CheckCircle2, Globe, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { metals as mockMetals, vaults, supplyHistory, attestations, formatNumber, formatUSD } from "@/lib/mock-data";
import { usePythPrices } from "@/hooks/use-pyth-prices";

const PIE_COLORS = ["hsl(45,93%,58%)", "hsl(210,10%,72%)", "hsl(200,15%,78%)", "hsl(35,20%,65%)"];

export default function Explorer() {
  const { data: pythPrices, isLoading: pythLoading, isError: pythError } = usePythPrices();

  // Merge live Pyth prices with mock metal data
  const metals = useMemo(() => {
    return mockMetals.map((m) => {
      const live = pythPrices?.find((p) => p.metal === m.metalType);
      if (live && live.price > 0) {
        const change = ((live.price - m.spotPrice) / m.spotPrice) * 100;
        return { ...m, spotPrice: live.price, change24h: change };
      }
      return m;
    });
  }, [pythPrices]);

  const isLive = !pythLoading && !pythError && !!pythPrices;

  const getTotalMarketCap = () => metals.reduce((s, m) => s + m.totalSupply * m.spotPrice, 0);

  const vaultPieData = vaults.filter(v => v.status === 'Active').map(v => ({
    name: v.name.split(' ')[0],
    value: v.balances.reduce((s, b) => s + b.amount * (metals.find(m => m.metalType === b.metal)?.spotPrice || 0), 0),
  }));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-success font-medium uppercase tracking-wider">Live Pyth Feeds · Proof of Reserves</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-warning" />
                <span className="text-xs text-warning font-medium uppercase tracking-wider">{pythLoading ? "Connecting to Pyth..." : "Mock Data · Pyth Unavailable"}</span>
              </>
            )}
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Metal-Backed Token <span className="text-primary">Explorer</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Real-time transparency into the 1:1 physical metal backing of all tokenized assets on Solana.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Market Cap" value={formatUSD(getTotalMarketCap())} icon={TrendingUp} trend={1.05} />
        <MetricCard title="Backing Ratio" value="1.000 : 1" subtitle="All metals fully backed" icon={Shield} />
        <MetricCard title="Active Vaults" value={vaults.filter(v => v.status === 'Active').length.toString()} subtitle={`${vaults.length} total registered`} icon={Vault} />
        <MetricCard title="Active Attestations" value={attestations.filter(a => a.status === 'Active').length.toString()} subtitle="3/5 threshold verified" icon={CheckCircle2} />
      </div>

      {/* Token Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metals.map((m) => (
          <Card key={m.symbol} className="glass border-border/50 hover:border-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: `hsl(var(--${m.color}))` }} />
                  <span className="font-bold">{m.symbol}</span>
                </div>
                <span className={`text-xs font-medium ${m.change24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {m.change24h >= 0 ? '+' : ''}{m.change24h}%
                </span>
              </div>
              <p className="text-2xl font-bold">{formatUSD(m.spotPrice)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supply: {formatNumber(m.totalSupply)} oz · {formatUSD(m.totalSupply * m.spotPrice)}
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-success" />
                <span className="text-xs text-success font-medium">100% Backed</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supply Growth */}
        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Token Supply Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={supplyHistory}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(45,93%,58%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(45,93%,58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,16%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 12 }} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220,18%,7%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="xGLD" stroke="hsl(45,93%,58%)" fill="url(#goldGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="xPLT" stroke="hsl(200,15%,78%)" fill="transparent" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="xPLD" stroke="hsl(35,20%,65%)" fill="transparent" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vault Distribution */}
        <Card className="glass border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Vault Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vaultPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {vaultPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220,18%,7%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => formatUSD(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {vaultPieData.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-muted-foreground">{v.name}</span>
                  </div>
                  <span className="font-mono">{formatUSD(v.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vault Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Registered Vaults</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs">Vault</TableHead>
                <TableHead className="text-xs">Location</TableHead>
                <TableHead className="text-xs">Custodian</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Last Attestation</TableHead>
                <TableHead className="text-xs text-right">Holdings (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vaults.map((v) => (
                <TableRow key={v.id} className="border-border/30">
                  <TableCell className="font-medium text-sm">{v.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{v.custodian}</TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{new Date(v.lastAttestation).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatUSD(v.balances.reduce((s, b) => s + b.amount * (metals.find(m => m.metalType === b.metal)?.spotPrice || 0), 0))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Latest Attestations */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Latest Attestations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Vault</TableHead>
                <TableHead className="text-xs">Metal</TableHead>
                <TableHead className="text-xs">Amount (oz)</TableHead>
                <TableHead className="text-xs">Bars</TableHead>
                <TableHead className="text-xs">Signers</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attestations.map((a) => (
                <TableRow key={a.id} className="border-border/30">
                  <TableCell className="font-mono text-xs text-primary">{a.id}</TableCell>
                  <TableCell className="text-sm">{a.vaultName}</TableCell>
                  <TableCell className="text-sm">{a.metal}</TableCell>
                  <TableCell className="text-sm font-mono">{formatNumber(a.amount)}</TableCell>
                  <TableCell className="text-sm font-mono">{a.barCount}</TableCell>
                  <TableCell className="text-sm font-mono">{a.signers}/{a.threshold}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{new Date(a.expiresAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
