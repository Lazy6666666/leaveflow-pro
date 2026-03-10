import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SelfieLightboxProps {
    path: string | null;
    onClose: () => void;
    title?: string;
}

export function SelfieLightbox({ path, onClose, title = "Selfie Verification" }: SelfieLightboxProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!path) {
            setImageUrl(null);
            setError("");
            return;
        }

        const fetchUrl = async () => {
            setLoading(true);
            setError("");
            try {
                const { data, error: signedUrlError } = await supabase.storage
                    .from("attendance-selfies")
                    .createSignedUrl(path, 3600); // 1 hour

                if (signedUrlError) throw signedUrlError;
                if (data?.signedUrl) {
                    setImageUrl(data.signedUrl);
                } else {
                    throw new Error("Could not generate URL");
                }
            } catch (err: any) {
                console.error("Error fetching selfie:", err);
                setError("Failed to load image");
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();
    }, [path]);

    return (
        <Dialog open={!!path} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="hidden">Selfie image</DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4 min-h-[300px]">
                    {loading ? (
                        <p className="text-sm text-muted-foreground animate-pulse">Loading image...</p>
                    ) : error ? (
                        <p className="text-sm text-destructive bg-destructive/10 p-4 rounded-md">{error}</p>
                    ) : imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Clock in/out selfie"
                            className="max-w-full max-h-[60vh] object-contain rounded-md shadow-sm border"
                        />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
