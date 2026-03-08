import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { ProfileSkeleton } from "@/components/skeletons";

interface Department { id: string; name: string; }

const ProfileSettings = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const [{ data: profile }, { data: depts }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("departments").select("id, name").order("name"),
      ]);
      if (profile) {
        setFullName(profile.full_name || "");
        setEmail(profile.email || "");
        setDepartmentId(profile.department_id);
        // Generate signed URL for private avatar bucket
        if (profile.avatar_url) {
          const { data } = await supabase.storage
            .from("avatars")
            .createSignedUrl(profile.avatar_url, 3600);
          setAvatarUrl(data?.signedUrl || null);
        }
      }
      if (depts) setDepartments(depts);
    };
    fetchProfile().finally(() => setPageLoading(false));
  }, [user]);

  if (pageLoading) return <ProfileSkeleton />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
    if (uploadError) { toast.error("Failed to upload avatar"); setUploading(false); return; }
    // Store the path, not a public URL; use signed URLs to display
    const { data: signedData } = await supabase.storage.from("avatars").createSignedUrl(filePath, 3600);
    setAvatarUrl(signedData?.signedUrl || null);
    await supabase.from("profiles").update({ avatar_url: filePath }).eq("id", user.id);
    toast.success("Avatar updated");
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() || null, department_id: departmentId }).eq("id", user.id);
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
          <CardDescription>Upload a profile picture</CardDescription>
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
          <CardDescription>Update your name and department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted/50 h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={departmentId || ""} onValueChange={(v) => setDepartmentId(v || null)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
