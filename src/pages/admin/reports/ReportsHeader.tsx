import { BarChart3, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ReportsHeaderProps = {
  onExport: () => void;
  siteFilter: string;
  sites: { id: string; name: string }[];
  onSiteFilterChange: (value: string) => void;
};

export function ReportsHeader({ onExport, siteFilter, sites, onSiteFilterChange }: ReportsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
        <h1 className="flex items-center gap-2 text-3xl font-serif font-semibold tracking-tight text-foreground">
          <BarChart3 className="h-6 w-6 text-foreground" /> Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Leave, payroll, burnout, and coverage insights in one admin view.</p>
      </div>
      <div className="flex flex-col gap-2 self-start sm:items-end">
        <Select value={siteFilter} onValueChange={onSiteFilterChange}>
          <SelectTrigger className="w-full min-w-[180px] sm:w-[220px]">
            <SelectValue placeholder="Filter by site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1 self-start sm:self-auto" onClick={onExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>
    </div>
  );
}
