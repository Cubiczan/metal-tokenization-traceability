import { useState } from "react";
import { Building2, FileCheck2, Package, Plus, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { vaults, attestations, metals, redeemRequests, formatNumber, formatUSD } from "@/lib/mock-data";
import { toast } from "sonner";

export default function VaultDashboard() {
  const [attestOpen, setAttestOpen] = useState(false);

  const totalHoldings = vaults.reduce((s, v) =>
    s + v.balances.reduce((bs, b) => bs + b.amount * (metals.find(m => m.metalType === b.metal)?.spotPrice || 0), 0), 0
  );

  const pendingDeliveries = redeemRequests.filter(r => r.status !== 'Delivered').length;
  const expiringSoon = attestations.filter(a => {
    const exp = new Date(a.expiresAt).getTime();
    return a.status === 'Active' && exp - Date.now() < 6 * 3600 * 1000;
  }).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Vault Operator Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage attestations, balances, and delivery logistics</p>
        </div>
        <Dialog open={attestOpen} onOpenChange={setAttestOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><FileCheck2 className="w-4 h-4" /> Submit Attestation</Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/50">
            <DialogHeader>
              <DialogTitle>New Attestation</DialogTitle>
              <DialogDescription>Submit a reserve attestation with MPC threshold signatures</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Vault</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select vault" /></SelectTrigger>
                  <SelectContent>{vaults.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Metal</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select metal" /></SelectTrigger>
                  <SelectContent>{metals.map(m => <SelectItem key={m.symbol} value={m.symbol}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (troy oz)</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Bar Count</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Inventory Hash (SHA-256)</Label>
                <Input placeholder="0x..." className="font-mono text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAttestOpen(false)}>Cancel</Button>
              <Button onClick={() => { setAttestOpen(false); toast.success("Attestation submitted for MPC signing"); }}>Submit for Signing</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Holdings Value" value={formatUSD(totalHoldings)} icon={Package} />
        <MetricCard title="Active Attestations" value={attestations.filter(a => a.status === 'Active').length.toString()} icon={FileCheck2} />
        <MetricCard title="Pending Deliveries" value={pendingDeliveries.toString()} subtitle="physical redemptions" icon={Building2} />
        {expiringSoon > 0 ? (
          <MetricCard title="Expiring Soon" value={expiringSoon.toString()} subtitle="< 6 hours remaining" icon={AlertTriangle} className="border-warning/30" />
        ) : (
          <MetricCard title="Expiring Soon" value="0" subtitle="all attestations healthy" icon={AlertTriangle} />
        )}
      </div>

      {/* Vault Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {vaults.map(v => (
          <Card key={v.id} className="glass border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{v.name}</CardTitle>
                <StatusBadge status={v.status} />
              </div>
              <p className="text-xs text-muted-foreground">{v.location} · {v.custodian} · {v.license}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {v.balances.map(b => {
                const pct = (b.amount / b.capacity) * 100;
                return (
                  <div key={b.metal} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{b.metal}</span>
                      <span className="font-mono">{formatNumber(b.amount)} / {formatNumber(b.capacity)} oz ({pct.toFixed(1)}%)</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30">
                <span>Last attestation: {new Date(v.lastAttestation).toLocaleString()}</span>
                <StatusBadge status={v.attestationStatus} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="attestations" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="attestations">Attestations</TabsTrigger>
          <TabsTrigger value="deliveries">Pending Deliveries</TabsTrigger>
        </TabsList>

        <TabsContent value="attestations">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
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
                  {attestations.map(a => (
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
        </TabsContent>

        <TabsContent value="deliveries">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Metal</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Vault</TableHead>
                    <TableHead className="text-xs">Form</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Requester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redeemRequests.filter(r => r.status !== 'Delivered').map(r => (
                    <TableRow key={r.id} className="border-border/30">
                      <TableCell className="font-mono text-xs text-primary">{r.id}</TableCell>
                      <TableCell className="text-sm font-medium">{r.metal}</TableCell>
                      <TableCell className="text-sm font-mono">{formatNumber(r.amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.vault}</TableCell>
                      <TableCell className="text-sm">{r.deliveryPreference}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{r.requester}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
