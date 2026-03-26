import { useCallback, useEffect, useState } from "react";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import type { FunctionReturnType } from "convex/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Fingerprint, Plus, RefreshCw, Trash2, TestTube,
  Server, Globe, Shield, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { getErrorMessage } from "@/lib/errors";

type BiometricsConfig = NonNullable<FunctionReturnType<typeof api.admin.getBiometricsConfigs>>[number];
type BiometricsConfigId = BiometricsConfig["id"];
type Site = FunctionReturnType<typeof api.sites.listSites>[number];
type Vendor = BiometricsConfig["vendor"];
type VendorField = "api_url" | "api_key" | "api_secret" | "webhook_secret";
type VendorInfo = {
  label: string;
  description: string;
  icon: typeof Server;
  fields: VendorField[];
};

const vendorInfo: Record<Vendor, VendorInfo> = {
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

const isVendor = (value: string): value is Vendor => value in vendorInfo;

const BiometricsSettings = () => {
  const [configs, setConfigs] = useState<BiometricsConfig[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testingId, setTestingId] = useState<BiometricsConfigId | null>(null);
  const [syncingId, setSyncingId] = useState<BiometricsConfigId | null>(null);
  const [siteFilter, setSiteFilter] = useState("all");
  const { toast } = useToast();

  // Form state
  const [formVendor, setFormVendor] = useState<Vendor>("zkteco");
  const [formSiteId, setFormSiteId] = useState("");
  const [formName, setFormName] = useState("");
  const [formApiUrl, setFormApiUrl] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formApiSecret, setFormApiSecret] = useState("");
  const [formWebhookSecret, setFormWebhookSecret] = useState("");
  const [formDeviceSerial, setFormDeviceSerial] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formSyncFreq, setFormSyncFreq] = useState(30);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    const [data, sitesData] = await Promise.all([
      convex.query(api.admin.getBiometricsConfigs, { siteId: siteFilter === "all" ? undefined : siteFilter }),
      convex.query(api.sites.listSites, {}),
    ]);
    setConfigs(data ?? []);
    setSites(sitesData ?? []);
    setLoading(false);
  }, [siteFilter]);

  useEffect(() => { void fetchConfigs(); }, [fetchConfigs]);

  const resetForm = () => {
    setFormVendor("zkteco");
    setFormSiteId(siteFilter === "all" ? "" : siteFilter);
    setFormName("");
    setFormApiUrl("");
    setFormApiKey("");
    setFormApiSecret("");
    setFormWebhookSecret("");
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
    try {
      await convex.mutation(api.admin.saveBiometricsConfig, {
        vendor: formVendor,
        name: formName.trim(),
        siteId: formSiteId || undefined,
        apiUrl: formApiUrl.trim() || undefined,
        apiKey: formApiKey.trim() || undefined,
        apiSecret: formApiSecret.trim() || undefined,
        webhookSecret: formWebhookSecret.trim() || undefined,
        deviceSerial: formDeviceSerial.trim() || undefined,
        locationName: formLocation.trim() || undefined,
        syncFrequencyMinutes: formSyncFreq,
      });
      toast({ title: "Device added", description: "Test the connection before enabling sync." });
      resetForm();
      setDialogOpen(false);
      fetchConfigs();
    } catch (error) {
      toast({ title: "Failed to add device", description: getErrorMessage(error, "Failed to add device"), variant: "destructive" });
    }
    setSaving(false);
  };

  const handleTestConnection = async (configId: BiometricsConfigId) => {
    setTestingId(configId);
    try {
      const data = await convex.action(api.admin.testBiometricsConnection, { configId });
      if (data?.success) {
        toast({ title: "Connection successful", description: data.message });
      } else {
        toast({ title: "Connection failed", description: data?.message || "Unknown error", variant: "destructive" });
      }
      fetchConfigs();
    } catch (e) {
      toast({ title: "Test failed", description: getErrorMessage(e, "Test failed"), variant: "destructive" });
    }
    setTestingId(null);
  };

  const handleSync = async (configId: BiometricsConfigId) => {
    setSyncingId(configId);
    try {
      const data = await convex.action(api.admin.syncBiometrics, { configId });
      toast({
        title: "Sync complete",
        description: data?.message || `Synced ${data?.total_synced || 0} records`,
      });
      fetchConfigs();
    } catch (e) {
      toast({ title: "Sync failed", description: getErrorMessage(e, "Sync failed"), variant: "destructive" });
    }
    setSyncingId(null);
  };

  const handleToggleActive = async (config: BiometricsConfig) => {
    await convex.mutation(api.admin.toggleBiometricsConfig, { configId: config.id });
    fetchConfigs();
  };

  const handleDelete = async (configId: BiometricsConfigId) => {
    try {
      await convex.mutation(api.admin.deleteBiometricsConfig, { configId });
      toast({ title: "Device removed" });
      fetchConfigs();
    } catch (error) {
      toast({ title: "Delete failed", description: getErrorMessage(error, "Delete failed"), variant: "destructive" });
    }
  };

  const getStatusBadge = (config: BiometricsConfig) => {
    if (!config.last_sync_status) return <Badge variant="secondary">Not tested</Badge>;
    if (config.last_sync_status === "connected" || config.last_sync_status === "success")
      return <Badge variant="default">Connected</Badge>;
    return <Badge variant="destructive">Error</Badge>;
  };

  const webhookUrl = `${import.meta.env.VITE_CONVEX_SITE_URL}/biometrics/webhook`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">HR Admin</p>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Biometrics Integration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect biometrics devices for automatic attendance sync
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites.map((site) => (
                <SelectItem key={String(site._id)} value={String(site._id)}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <DialogDescription>
                Configure a biometrics device or webhook source before testing and enabling sync.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={formVendor} onValueChange={(value) => { if (isVendor(value)) setFormVendor(value); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(vendorInfo) as [Vendor, VendorInfo][]).map(([key, info]) => (
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
	                <Input name="deviceName" autoComplete="off" placeholder="e.g. Main Entrance, Floor 2" value={formName} onChange={(e) => setFormName(e.target.value)} />
	              </div>

	              <div className="space-y-2">
	                <Label>Site</Label>
	                <Select value={formSiteId || "none"} onValueChange={(value) => setFormSiteId(value === "none" ? "" : value)}>
	                  <SelectTrigger>
	                    <SelectValue placeholder="No site" />
	                  </SelectTrigger>
	                  <SelectContent>
	                    <SelectItem value="none">No site</SelectItem>
	                    {sites.map((site) => (
	                      <SelectItem key={String(site._id)} value={String(site._id)}>
	                        {site.name}
	                      </SelectItem>
	                    ))}
	                  </SelectContent>
	                </Select>
	              </div>

              {vendorInfo[formVendor].fields.includes("api_url") && (
                <div className="space-y-2">
                  <Label>API URL</Label>
                  <Input type="url" name="apiUrl" autoComplete="url" placeholder="https://your-device-ip-or-cloud-url" value={formApiUrl} onChange={(e) => setFormApiUrl(e.target.value)} />
                </div>
              )}

              {vendorInfo[formVendor].fields.includes("api_key") && (
                <div className="space-y-2">
                  <Label>{formVendor === "hikvision" ? "Username" : "API Key / Token"}</Label>
                  <Input type="password" name="apiKey" autoComplete="new-password" placeholder="Enter API key or token" value={formApiKey} onChange={(e) => setFormApiKey(e.target.value)} />
                </div>
              )}

              {vendorInfo[formVendor].fields.includes("api_secret") && (
                <div className="space-y-2">
                  <Label>Password / Secret</Label>
                  <Input type="password" name="apiSecret" autoComplete="new-password" placeholder="Enter password or secret" value={formApiSecret} onChange={(e) => setFormApiSecret(e.target.value)} />
                </div>
              )}

              {vendorInfo[formVendor].fields.includes("webhook_secret") && (
                <div className="space-y-2">
                  <Label>Webhook Secret (optional)</Label>
                  <Input name="webhookSecret" autoComplete="off" placeholder="For payload signature verification" value={formWebhookSecret} onChange={(e) => setFormWebhookSecret(e.target.value)} />
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-xs text-muted-foreground mb-1">Configure your device to POST events to:</p>
                    <code className="text-xs text-foreground break-all">{webhookUrl}</code>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Device Serial (optional)</Label>
                  <Input name="deviceSerial" autoComplete="off" placeholder="Serial number" value={formDeviceSerial} onChange={(e) => setFormDeviceSerial(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <Input name="deviceLocation" autoComplete="off" placeholder="Building A" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sync Frequency (minutes)</Label>
                <Input name="syncFrequencyMinutes" type="number" min={5} max={1440} value={formSyncFreq} onChange={(e) => setFormSyncFreq(Number(e.target.value))} />
              </div>

              <Button className="w-full" onClick={handleAdd} disabled={saving}>
                {saving ? "Adding..." : "Add Device"}
              </Button>
            </div>
          </DialogContent>
	        </Dialog>
        </div>
      </div>

      {/* Supported Vendors Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(vendorInfo) as [Vendor, VendorInfo][]).map(([key, info]) => {
          const count = configs.filter((c) => c.vendor === key).length;
          return (
            <Card key={key}>
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
              <Card key={config.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        <info.icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
	                        <div className="flex flex-wrap items-center gap-2">
	                          <p className="text-sm font-medium text-foreground">{config.name}</p>
	                          <Badge variant="outline" className="text-[10px]">{info.label}</Badge>
	                          {config.site_name ? <Badge variant="secondary" className="text-[10px]">{config.site_name}</Badge> : null}
	                          {getStatusBadge(config)}
	                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {config.location_name && <span>{config.location_name}</span>}
                          {config.api_url && <span className="max-w-full break-all xl:max-w-[200px]">{config.api_url}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Every {config.sync_frequency_minutes}m
                          </span>
                        </div>
                        {config.last_sync_at && (
                          <p className="text-[11px] text-muted-foreground/60 mt-1">
                            Last sync: {format(new Date(config.last_sync_at), "MMM d, h:mm a")}
                            {config.last_sync_records != null && ` - ${config.last_sync_records} records`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:shrink-0 xl:justify-end">
                      <Switch
                        checked={config.is_active}
                        onCheckedChange={() => handleToggleActive(config)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-w-[88px]"
                        onClick={() => handleTestConnection(config.id)}
                        disabled={testingId === config.id}
                      >
                        <TestTube className="h-3.5 w-3.5 mr-1" />
                        {testingId === config.id ? "Testing..." : "Test"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-w-[76px]"
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
