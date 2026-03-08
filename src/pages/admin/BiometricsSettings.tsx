import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Fingerprint, Plus, Wifi, WifiOff, RefreshCw, Trash2, TestTube,
  Server, Globe, Shield, Clock,
} from "lucide-react";
import { format } from "date-fns";

type Vendor = "zkteco" | "biotime" | "suprema" | "hikvision" | "generic_webhook";

interface BiometricsConfig {
  id: string;
  vendor: Vendor;
  name: string;
  api_url: string | null;
  api_key: string | null;
  api_secret: string | null;
  device_serial: string | null;
  location_name: string | null;
  sync_frequency_minutes: number;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_records: number | null;
  webhook_secret: string | null;
  extra_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const vendorInfo: Record<Vendor, { label: string; description: string; icon: typeof Server; fields: string[] }> = {
  zkteco: {
    label: "ZKTeco",
    description: "ZKTeco iClock / ZKBioAccess REST API integration",
    icon: Fingerprint,
    fields: ["api_url", "api_key"],
  },
  biotime: {
    label: "BioTime Cloud",
    description: "ZKTeco BioTime cloud attendance platform",
    icon: Globe,
    fields: ["api_url", "api_key"],
  },
  suprema: {
    label: "Suprema BioStar 2",
    description: "Suprema BioStar 2 access control & time attendance",
    icon: Shield,
    fields: ["api_url", "api_key"],
  },
  hikvision: {
    label: "HikVision",
    description: "HikVision ISAPI access control integration",
    icon: Server,
    fields: ["api_url", "api_key", "api_secret"],
  },
  generic_webhook: {
    label: "Generic Webhook",
    description: "Any vendor that can POST attendance events via webhook",
    icon: Globe,
    fields: ["webhook_secret"],
  },
};

const BiometricsSettings = () => {
  const [configs, setConfigs] = useState<BiometricsConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formVendor, setFormVendor] = useState<Vendor>("zkteco");
  const [formName, setFormName] = useState("");
  const [formApiUrl, setFormApiUrl] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formApiSecret, setFormApiSecret] = useState("");
  const [formDeviceSerial, setFormDeviceSerial] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formSyncFreq, setFormSyncFreq] = useState(30);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data } = await supabase.from("biometrics_config").select("*").order("created_at", { ascending: false });
    setConfigs((data as unknown as BiometricsConfig[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchConfigs(); }, []);

  const resetForm = () => {
    setFormVendor("zkteco");
    setFormName("");
    setFormApiUrl("");
    setFormApiKey("");
    setFormApiSecret("");
    setFormDeviceSerial("");
    setFormLocation("");
    setFormSyncFreq(30);
  };

  const handleAdd = async () => {
    if (!formName.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("biometrics_config").insert({
      vendor: formVendor,
      name: formName.trim(),
      api_url: formApiUrl.trim() || null,
      api_key: formApiKey.trim() || null,
      api_secret: formApiSecret.trim() || null,
      device_serial: formDeviceSerial.trim() || null,
      location_name: formLocation.trim() || null,
      sync_frequency_minutes: formSyncFreq,
      is_active: false,
    } as any);
    setSaving(false);

    if (error) {
      toast({ title: "Failed to add device", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Device added", description: "Test the connection before enabling sync." });
      resetForm();
      setDialogOpen(false);
      fetchConfigs();
    }
  };

  const handleTestConnection = async (configId: string) => {
    setTestingId(configId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-attendance", {
        body: { action: "test_connection", config_id: configId },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Connection successful", description: data.message });
      } else {
        toast({ title: "Connection failed", description: data?.message || "Unknown error", variant: "destructive" });
      }
      fetchConfigs();
    } catch (e: any) {
      toast({ title: "Test failed", description: e.message, variant: "destructive" });
    }
    setTestingId(null);
  };

  const handleSync = async (configId: string) => {
    setSyncingId(configId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-attendance", {
        body: { action: "sync", config_id: configId },
      });
      if (error) throw error;
      toast({
        title: "Sync complete",
        description: `Synced ${data?.total_synced || 0} records`,
      });
      fetchConfigs();
    } catch (e: any) {
      toast({ title: "Sync failed", description: e.message, variant: "destructive" });
    }
    setSyncingId(null);
  };

  const handleToggleActive = async (config: BiometricsConfig) => {
    await supabase.from("biometrics_config").update({ is_active: !config.is_active } as any).eq("id", config.id);
    fetchConfigs();
  };

  const handleDelete = async (configId: string) => {
    const { error } = await supabase.from("biometrics_config").delete().eq("id", configId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Device removed" });
      fetchConfigs();
    }
  };

  const getStatusBadge = (config: BiometricsConfig) => {
    if (!config.last_sync_status) return <Badge variant="secondary">Not tested</Badge>;
    if (config.last_sync_status === "connected" || config.last_sync_status === "success")
      return <Badge variant="default">Connected</Badge>;
    return <Badge variant="destructive">Error</Badge>;
  };

  const webhookUrl = `${window.location.origin}/functions/v1/sync-attendance`;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Biometrics Integration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect biometrics devices for automatic attendance sync
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Biometrics Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={formVendor} onValueChange={(v) => setFormVendor(v as Vendor)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(vendorInfo) as [Vendor, typeof vendorInfo[Vendor]][]).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <info.icon className="h-3.5 w-3.5" />
                          {info.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{vendorInfo[formVendor].description}</p>
              </div>

              <div className="space-y-2">
                <Label>Device Name</Label>
                <Input placeholder="e.g. Main Entrance, Floor 2" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>

              {vendorInfo[formVendor].fields.includes("api_url") && (
                <div className="space-y-2">
                  <Label>API URL</Label>
                  <Input placeholder="https://your-device-ip-or-cloud-url" value={formApiUrl} onChange={(e) => setFormApiUrl(e.target.value)} />
                </div>
              )}

              {vendorInfo[formVendor].fields.includes("api_key") && (
                <div className="space-y-2">
                  <Label>{formVendor === "hikvision" ? "Username" : "API Key / Token"}</Label>
                  <Input type="password" placeholder="Enter API key or token" value={formApiKey} onChange={(e) => setFormApiKey(e.target.value)} />
                </div>
              )}

              {vendorInfo[formVendor].fields.includes("api_secret") && (
                <div className="space-y-2">
                  <Label>Password / Secret</Label>
                  <Input type="password" placeholder="Enter password or secret" value={formApiSecret} onChange={(e) => setFormApiSecret(e.target.value)} />
                </div>
              )}

              {vendorInfo[formVendor].fields.includes("webhook_secret") && (
                <div className="space-y-2">
                  <Label>Webhook Secret (optional)</Label>
                  <Input placeholder="For payload signature verification" value={formApiKey} onChange={(e) => setFormApiKey(e.target.value)} />
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Configure your device to POST events to:</p>
                    <code className="text-xs text-foreground break-all">{webhookUrl}</code>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device Serial (optional)</Label>
                  <Input placeholder="Serial number" value={formDeviceSerial} onChange={(e) => setFormDeviceSerial(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <Input placeholder="Building A" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sync Frequency (minutes)</Label>
                <Input type="number" min={5} max={1440} value={formSyncFreq} onChange={(e) => setFormSyncFreq(Number(e.target.value))} />
              </div>

              <Button className="w-full" onClick={handleAdd} disabled={saving}>
                {saving ? "Adding..." : "Add Device"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Supported Vendors Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(vendorInfo) as [Vendor, typeof vendorInfo[Vendor]][]).map(([key, info]) => {
          const count = configs.filter((c) => c.vendor === key).length;
          return (
            <Card key={key} className="border border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                  <info.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{info.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {count > 0 ? `${count} device${count > 1 ? "s" : ""} configured` : "Not configured"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Device List */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Configured Devices</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : configs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Fingerprint className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No biometrics devices configured yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Device" to connect your first biometrics reader.</p>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => {
            const info = vendorInfo[config.vendor];
            return (
              <Card key={config.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        <info.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{config.name}</p>
                          <Badge variant="outline" className="text-[10px]">{info.label}</Badge>
                          {getStatusBadge(config)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {config.location_name && <span>{config.location_name}</span>}
                          {config.api_url && <span className="truncate max-w-[200px]">{config.api_url}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Every {config.sync_frequency_minutes}m
                          </span>
                        </div>
                        {config.last_sync_at && (
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            Last sync: {format(new Date(config.last_sync_at), "MMM d, h:mm a")}
                            {config.last_sync_records != null && ` · ${config.last_sync_records} records`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={() => handleToggleActive(config)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(config.id)}
                        disabled={testingId === config.id}
                      >
                        <TestTube className="h-3.5 w-3.5 mr-1" />
                        {testingId === config.id ? "Testing..." : "Test"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(config.id)}
                        disabled={syncingId === config.id || !config.is_active}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncingId === config.id ? "animate-spin" : ""}`} />
                        Sync
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(config.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BiometricsSettings;
