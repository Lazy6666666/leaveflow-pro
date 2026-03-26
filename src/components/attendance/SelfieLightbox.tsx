import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { getErrorMessage } from "@/lib/errors";
import type { StorageId } from "@/lib/convexTypes";

interface SelfieLightboxProps {
    path: StorageId | null;
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
                const url = await convex.query(api.files.getFileUrl, { storageId: path });
                if (!url) throw new Error("Could not generate URL");
                setImageUrl(url);
            } catch (err) {
                console.error("Error fetching selfie:", err);
                setError(getErrorMessage(err, "Failed to load image"));
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
