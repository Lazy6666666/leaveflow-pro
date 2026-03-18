import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { ProfileSkeleton } from "@/components/skeletons";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { uploadFileToConvex } from "@/lib/convexUpload";
import { getErrorMessage } from "@/lib/errors";
import { useConvexMutation } from "@/hooks/useConvexMutation";
import { useConvexQuery } from "@/hooks/useConvexQuery";

const MAX_NAME_LENGTH = 100;

const ProfileSettings = () => {
  const { user, hasRole } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile, loading: pageLoading, refetch: refetchProfile } = useConvexQuery(
    api.users.getProfileSettings,
    {},
    [user?.id],
    { enabled: !!user },
  );

  useEffect(() => {
    if (!profile) {
      return;
    }
    setFullName(profile.full_name || "");
    setEmail(profile.email || "");
    setDepartmentName(profile.department_name || null);
    setAvatarUrl(profile.avatar_url || null);
  }, [profile]);

  const { mutate: updateAvatar } = useConvexMutation(api.users.updateAvatar, {
    successMessage: "Avatar updated",
    errorFallback: "Failed to upload avatar",
  });

  const { mutate: updateProfile, loading: saving } = useConvexMutation(api.users.updateProfile, {
    successMessage: "Profile updated successfully",
    errorFallback: "Failed to update profile",
  });

  if (pageLoading) return <ProfileSkeleton />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Avatar must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed"); return; }
    setUploading(true);
    try {
      const upload = await uploadFileToConvex(file, "avatar");
      const result = await updateAvatar({ storageId: upload.storageId });
      if (result !== null) {
        await refetchProfile();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const trimmed = fullName.trim();
    if (trimmed.length > MAX_NAME_LENGTH) { toast.error(`Name must be under ${MAX_NAME_LENGTH} characters`); return; }
    const result = await updateProfile({ fullName: trimmed || undefined });
    if (result !== null) {
      await refetchProfile();
    }
  };

  const initials = fullName ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Profile</p>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avatar</CardTitle>
          <CardDescription>Upload a profile picture (max 5MB)</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-border">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" loading="lazy" decoding="async" /> : <AvatarFallback className="text-lg bg-accent text-accent-foreground">{initials}</AvatarFallback>}
            </Avatar>
            <input
              ref={avatarInputRef}
              id="avatar-upload"
              name="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading}
              className="sr-only"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-0 h-full w-full rounded-full bg-foreground/40 text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading}
              aria-label={uploading ? "Uploading profile picture" : "Upload profile picture"}
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
          <div>
            <p className="text-sm text-foreground font-medium">{fullName || "No name set"}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
            {uploading && <p className="text-xs text-primary mt-1">Uploading…</p>}
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
            <Input id="email" name="email" type="email" autoComplete="email" spellCheck={false} value={email} readOnly className="bg-muted/50 h-11" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="full-name">Full Name</Label>
              <span className="text-xs text-muted-foreground">{fullName.length}/{MAX_NAME_LENGTH}</span>
            </div>
            <Input
              id="full-name"
              name="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              placeholder="Your full name"
              className="h-11"
              maxLength={MAX_NAME_LENGTH}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" value={departmentName || "Not assigned"} readOnly className="bg-muted/50 h-11" />
            {!hasRole("hr_admin") && (
              <p className="text-xs text-muted-foreground">Contact HR to change your department assignment.</p>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="h-11">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
