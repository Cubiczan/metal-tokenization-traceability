import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success border-success/20",
  Completed: "bg-success/10 text-success border-success/20",
  Delivered: "bg-success/10 text-success border-success/20",
  Ready: "bg-success/10 text-success border-success/20",
  Approved: "bg-primary/10 text-primary border-primary/20",
  Pending: "bg-warning/10 text-warning border-warning/20",
  Processing: "bg-primary/10 text-primary border-primary/20",
  Suspended: "bg-destructive/10 text-destructive border-destructive/20",
  Rejected: "bg-destructive/10 text-destructive border-destructive/20",
  Expired: "bg-muted text-muted-foreground border-border",
  Revoked: "bg-destructive/10 text-destructive border-destructive/20",
  Draining: "bg-warning/10 text-warning border-warning/20",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", statusStyles[status] || "bg-muted text-muted-foreground border-border")}>
      {status}
    </span>
  );
}
