import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { wave3Api } from "@/lib/wave3Api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/errors";
import { PlugZap } from "lucide-react";
import { toast } from "sonner";

type IntegrationSetting = {
  configSummary: string;
  description: string;
  enabled: boolean;
  id: string | null;
  key: string;
  lastCheckedAt: string | null;
  name: string;
  status: "not_configured" | "attention" | "connected";
  updatedAt: string | null;
};

function statusVariant(status: IntegrationSetting["status"]) {
  if (status === "connected") {
    return "default" as const;
  }
  if (status === "attention") {
    return "destructive" as const;
  }
  return "secondary" as const;
}

export function IntegrationsStatusPanel() {
  const [drafts, setDrafts] = useState<Record<string, IntegrationSetting>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [settings, setSettings] = useState<IntegrationSetting[]>([]);

  const load = useCallback(async () => {
    const data = (await convex.query(wave3Api.integrations.getIntegrationSettings, {})) as IntegrationSetting[];
    setSettings(data);
    setDrafts(Object.fromEntries(data.map((setting) => [setting.key, setting])));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const updateDraft = (key: string, patch: Partial<IntegrationSetting>) => {
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  };

  const save = async (key: string) => {
    const draft = drafts[key];
    if (!draft) {
      return;
    }

    try {
      setSavingKey(key);
      await convex.mutation(wave3Api.integrations.saveIntegrationSetting, {
        configSummary: draft.configSummary,
        enabled: draft.enabled,
        providerKey: draft.key as "slack" | "teams" | "google_calendar" | "payroll_export",
        status: draft.status,
      });
      toast.success(`${draft.name} settings saved`);
      await load();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save integration setting"));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Wave 3</p>
        <h2 className="flex items-center gap-2 text-2xl font-serif font-semibold tracking-tight text-foreground">
          <PlugZap className="h-5 w-5" /> Integration Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Keep placeholder-backed integration settings and status visibility in one admin-only surface without enabling live external sync.
        </p>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading integrations…</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {settings.map((setting) => {
          const draft = drafts[setting.key] ?? setting;
          return (
            <Card key={setting.key}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{setting.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Badge variant={statusVariant(draft.status)}>{draft.status.replace("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${setting.key}-status`}>Status</Label>
                    <select
                      id={`${setting.key}-status`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={draft.status}
                      onChange={(event) => updateDraft(setting.key, { status: event.target.value as IntegrationSetting["status"] })}
                    >
                      <option value="not_configured">Not configured</option>
                      <option value="attention">Needs attention</option>
                      <option value="connected">Connected</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${setting.key}-enabled`}>Mode</Label>
                    <select
                      id={`${setting.key}-enabled`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={draft.enabled ? "enabled" : "disabled"}
                      onChange={(event) => updateDraft(setting.key, { enabled: event.target.value === "enabled" })}
                    >
                      <option value="disabled">Disabled</option>
                      <option value="enabled">Enabled</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${setting.key}-summary`}>Configuration summary</Label>
                  <Input
                    id={`${setting.key}-summary`}
                    value={draft.configSummary}
                    onChange={(event) => updateDraft(setting.key, { configSummary: event.target.value })}
                  />
                </div>
                <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                  {draft.lastCheckedAt ? `Last reviewed ${new Date(draft.lastCheckedAt).toLocaleString()}` : "Not reviewed yet"}
                </div>
                <Button onClick={() => void save(setting.key)} disabled={savingKey === setting.key}>
                  {savingKey === setting.key ? "Saving..." : `Save ${setting.name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
