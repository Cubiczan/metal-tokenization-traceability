import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Pickaxe, Plus, ArrowDownToLine, Package, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { metals, vaults, mintRequests, redeemRequests, formatNumber, formatUSD } from "@/lib/mock-data";
import { toast } from "sonner";

const inventoryData = [
  { metal: 'Gold', extracted: 1200, tokenized: 980, pending: 220 },
  { metal: 'Silver', extracted: 85000, tokenized: 72000, pending: 13000 },
  { metal: 'Platinum', extracted: 320, tokenized: 290, pending: 30 },
  { metal: 'Palladium', extracted: 180, tokenized: 155, pending: 25 },
];

export default function MineOperations() {
  const [mintOpen, setMintOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);

  const totalExtractedValue = inventoryData.reduce((s, i) => {
    const m = metals.find(m => m.metalType === i.metal);
    return s + (m ? i.extracted * m.spotPrice : 0);
  }, 0);

  const totalTokenizedValue = inventoryData.reduce((s, i) => {
    const m = metals.find(m => m.metalType === i.metal);
    return s + (m ? i.tokenized * m.spotPrice : 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pickaxe className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Mine Operations Portal</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage inventory, mint tokens, and track redemptions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={mintOpen} onOpenChange={setMintOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Mint Tokens</Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50">
              <DialogHeader>
                <DialogTitle>Create Mint Request</DialogTitle>
                <DialogDescription>Mint metal-backed tokens against verified reserves</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Metal</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select metal" /></SelectTrigger>
                    <SelectContent>{metals.map(m => <SelectItem key={m.symbol} value={m.symbol}>{m.symbol} - {m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (troy oz)</Label>
                  <Input type="number" placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>Vault</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select vault" /></SelectTrigger>
                    <SelectContent>{vaults.filter(v => v.status === 'Active').map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMintOpen(false)}>Cancel</Button>
                <Button onClick={() => { setMintOpen(false); toast.success("Mint request submitted"); }}>Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2"><ArrowDownToLine className="w-4 h-4" /> Redeem</Button>
            </DialogTrigger>
            <DialogContent className="glass border-border/50">
              <DialogHeader>
                <DialogTitle>Create Redeem Request</DialogTitle>
                <DialogDescription>Burn tokens and request physical delivery</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Metal</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select metal" /></SelectTrigger>
                    <SelectContent>{metals.map(m => <SelectItem key={m.symbol} value={m.symbol}>{m.symbol} - {m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (troy oz)</Label>
                  <Input type="number" placeholder="0.000" />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Preference</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar-1kg">Bar (1kg)</SelectItem>
                      <SelectItem value="bar-100g">Bar (100g)</SelectItem>
                      <SelectItem value="grain">Grain</SelectItem>
                      <SelectItem value="sheet">Sheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRedeemOpen(false)}>Cancel</Button>
                <Button onClick={() => { setRedeemOpen(false); toast.success("Redeem request submitted"); }}>Submit Request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Extracted Value" value={formatUSD(totalExtractedValue)} icon={Package} />
        <MetricCard title="Total Tokenized Value" value={formatUSD(totalTokenizedValue)} icon={DollarSign} />
        <MetricCard title="Active Mint Requests" value={mintRequests.filter(r => r.status === 'Pending' || r.status === 'Approved').length.toString()} subtitle="awaiting completion" icon={Plus} />
        <MetricCard title="Pending Redemptions" value={redeemRequests.filter(r => r.status !== 'Delivered').length.toString()} subtitle="in pipeline" icon={ArrowDownToLine} />
      </div>

      {/* Inventory Chart */}
      <Card className="glass border-border/50">
        <CardHeader><CardTitle className="text-base">Inventory Overview (troy oz)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,16%)" />
                <XAxis dataKey="metal" tick={{ fill: 'hsl(215,12%,50%)', fontSize: 12 }} axisLine={false} />
                <YAxis tick={{ fill: 'hsl(215,12%,50%)', fontSize: 12 }} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(220,18%,7%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="tokenized" name="Tokenized" fill="hsl(45,93%,58%)" radius={[4,4,0,0]} />
                <Bar dataKey="pending" name="Pending" fill="hsl(220,14%,30%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="mints" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="mints">Mint Requests</TabsTrigger>
          <TabsTrigger value="redeems">Redemptions</TabsTrigger>
        </TabsList>

        <TabsContent value="mints">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Metal</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Fee</TableHead>
                    <TableHead className="text-xs">Net</TableHead>
                    <TableHead className="text-xs">Vault</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mintRequests.map(r => (
                    <TableRow key={r.id} className="border-border/30">
                      <TableCell className="font-mono text-xs text-primary">{r.id}</TableCell>
                      <TableCell className="text-sm font-medium">{r.metal}</TableCell>
                      <TableCell className="text-sm font-mono">{formatNumber(r.amount, 2)}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{formatNumber(r.fee, 3)}</TableCell>
                      <TableCell className="text-sm font-mono">{formatNumber(r.netAmount, 3)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.vault}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redeems">
          <Card className="glass border-border/50">
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-xs">ID</TableHead>
                    <TableHead className="text-xs">Metal</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Vault</TableHead>
                    <TableHead className="text-xs">Delivery</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {redeemRequests.map(r => (
                    <TableRow key={r.id} className="border-border/30">
                      <TableCell className="font-mono text-xs text-primary">{r.id}</TableCell>
                      <TableCell className="text-sm font-medium">{r.metal}</TableCell>
                      <TableCell className="text-sm font-mono">{formatNumber(r.amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.vault}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.deliveryPreference}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
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
