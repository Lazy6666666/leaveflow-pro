import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { useAnalytics } from "@/hooks/useAnalytics";
import { normalizeAnalyticsError } from "@/lib/analytics";
import { getErrorMessage } from "@/lib/errors";

const AdminSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessionId, roleScope, surface, trackOnce, track } = useAnalytics();
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    void trackOnce("admin_setup_viewed", "admin_setup_viewed", {
      needs_admin_setup: true,
    }, { surface: "admin_setup", path: "/admin-setup" });
  }, [trackOnce]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || !user) return;
    setIsSubmitting(true);
    setResult(null);
    void track("admin_setup_submitted", {
      has_token: Boolean(token.trim()),
    }, { surface: "admin_setup", path: "/admin-setup" });

    try {
      const data = await convex.mutation(api.admin.bootstrapAdmin, {
        setupToken: token.trim(),
        analytics: {
          sessionId,
          roleScope,
          surface,
          path: "/admin-setup",
        },
      });
      setResult({ type: "success", message: data?.message || "Successfully promoted to HR Admin!" });
    } catch (error) {
      void track("admin_setup_failed", {
        error_type: normalizeAnalyticsError(getErrorMessage(error, "An unexpected error occurred.")),
      }, { surface: "admin_setup", path: "/admin-setup" });
      setResult({ type: "error", message: getErrorMessage(error, "An unexpected error occurred.") });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Admin Setup</CardTitle>
          <CardDescription>
            Bootstrap the first HR Admin account for this deployment. This can only be used once — before any admin exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result?.type === "success" ? (
            <div className="space-y-4">
              <Alert className="border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                  {result.message}
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setup-email">Logged in as</Label>
                <Input id="setup-email" value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-token">Setup Token</Label>
                <Input
                  id="setup-token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter the admin setup token"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is the secret token configured in your backend settings.
                </p>
              </div>

              {result?.type === "error" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting || !token.trim()}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                ) : (
                  <><ShieldCheck className="mr-2 h-4 w-4" /> Activate Admin</>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
