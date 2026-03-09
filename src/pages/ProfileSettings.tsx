import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { ProfileSkeleton } from "@/components/skeletons";

const MAX_NAME_LENGTH = 100;

const ProfileSettings = () => {
  const { user, hasRole } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, departments(name)")
        .eq("id", user.id)
        .single();
      if (profile) {
        setFullName(profile.full_name || "");
        setEmail(profile.email || "");
        setDepartmentName((profile as any).departments?.name || null);
        if (profile.avatar_url) {
          const { data } = await supabase.storage
            .from("avatars")
            .createSignedUrl(profile.avatar_url, 3600);
          setAvatarUrl(data?.signedUrl || null);
        }
      }
    };
    fetchProfile().finally(() => setPageLoading(false));
  }, [user]);

  if (pageLoading) return <ProfileSkeleton />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Avatar must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed"); return; }
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
    if (uploadError) { toast.error("Failed to upload avatar"); setUploading(false); return; }
    const { data: signedData } = await supabase.storage.from("avatars").createSignedUrl(filePath, 3600);
    setAvatarUrl(signedData?.signedUrl || null);
    await supabase.from("profiles").update({ avatar_url: filePath }).eq("id", user.id);
    toast.success("Avatar updated");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    const trimmed = fullName.trim();
    if (trimmed.length > MAX_NAME_LENGTH) { toast.error(`Name must be under ${MAX_NAME_LENGTH} characters`); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: trimmed || null }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated successfully");
    setSaving(false);
  };

  const initials = fullName ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avatar</CardTitle>
          <CardDescription>Upload a profile picture (max 5MB)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : <AvatarFallback className="text-lg bg-accent text-accent-foreground">{initials}</AvatarFallback>}
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="h-5 w-5 text-background" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
            </label>
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">{fullName || "No name set"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            {uploading && <p className="text-xs text-primary mt-1">Uploading...</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted/50 h-11" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="full-name">Full Name</Label>
              <span className="text-xs text-muted-foreground">{fullName.length}/{MAX_NAME_LENGTH}</span>
            </div>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              placeholder="Your full name"
              className="h-11"
              maxLength={MAX_NAME_LENGTH}
            />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Input value={departmentName || "Not assigned"} disabled className="bg-muted/50 h-11" />
            {!hasRole("hr_admin") && (
              <p className="text-xs text-muted-foreground">Contact HR to change your department assignment.</p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="h-11">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
