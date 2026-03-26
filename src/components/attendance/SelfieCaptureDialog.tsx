import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { uploadFileToConvex } from "@/lib/convexUpload";
import { getErrorMessage } from "@/lib/errors";
import type { StorageId } from "@/lib/convexTypes";

interface SelfieCaptureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "clock_in" | "clock_out";
    onCaptureComplete: (imagePath?: StorageId, blob?: Blob) => void;
    onPermissionDenied?: () => void;
}


export function SelfieCaptureDialog({
    open,
    onOpenChange,
    type,
    onCaptureComplete,
    onPermissionDenied,
}: SelfieCaptureDialogProps) {
    const { user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const startCamera = useCallback(async () => {
        setErrorMsg("");
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setErrorMsg("Camera access denied or unavailable. Please enable camera permissions.");
            onPermissionDenied?.();
        }
    }, [onPermissionDenied]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Handle open/close side effects
    useEffect(() => {
        if (open) {
            if (!previewUrl) startCamera();
        } else {
            stopCamera();
            // Reset state on close
            setTimeout(() => {
                setPreviewUrl(null);
                setBlob(null);
                setUploading(false);
            }, 300);
        }
        return () => stopCamera();
    }, [open, startCamera, stopCamera, previewUrl]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((b) => {
                    if (b) {
                        setBlob(b);
                        const url = URL.createObjectURL(b);
                        setPreviewUrl(url);
                        stopCamera();
                    }
                }, "image/jpeg", 0.8);
            }
        }
    };

    const handleRetake = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setBlob(null);
        startCamera();
    };

    const handleConfirm = async () => {
        if (!blob || !user) return;
        setUploading(true);
        setErrorMsg("");

        if (!navigator.onLine) {
            onCaptureComplete(undefined, blob);
            setUploading(false);
            onOpenChange(false);
            return;
        }

        let attempt = 0;
        const maxAttempts = 3;
        
        while (attempt < maxAttempts) {
            try {
                const data = await uploadFileToConvex(blob, "attendance_selfie");
                onCaptureComplete(data.storageId);
                onOpenChange(false);
                return; // Success, exit
            } catch (error) {
                attempt++;
                console.error(`Selfie upload attempt ${attempt} failed:`, error);
                
                if (attempt >= maxAttempts) {
                    toast.error(getErrorMessage(error, "Failed to upload selfie after multiple attempts."));
                    setErrorMsg("Upload failed. Please check your connection and try again.");
                } else {
                    // Exponential backoff: 1s, 2s
                    const delay = Math.pow(2, attempt - 1) * 1000;
                    toast.warning(`Upload failed. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        setUploading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md flex flex-col items-center">
                <DialogHeader className="w-full text-center sm:text-left">
                    <DialogTitle>Verify Identity</DialogTitle>
                    <DialogDescription>
                        Please take a selfie to {type === "clock_in" ? "clock in" : "clock out"}.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative flex flex-col items-center justify-center w-full py-4 space-y-4">
                    {errorMsg ? (
                        <div className="w-full p-4 border rounded-md text-sm text-destructive bg-destructive/10 text-center">
                            {errorMsg}
                        </div>
                    ) : (
                        <div className="relative w-64 h-64 overflow-hidden rounded-full border-4 border-muted/50 bg-black flex items-center justify-center">
                            {!previewUrl ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover scale-x-[-1]" // mirror effect
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt="Selfie preview"
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />
                            )}
                        </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />

                    <div className="flex items-center justify-center gap-4 w-full mt-4">
                        {!previewUrl && !errorMsg && (
                            <Button onClick={handleCapture} className="w-full sm:w-auto gap-2">
                                <Camera className="h-4 w-4" />
                                Capture
                            </Button>
                        )}

                        {previewUrl && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleRetake}
                                    disabled={uploading}
                                    className="gap-2"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Retake
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    disabled={uploading}
                                    className="gap-2"
                                >
                                    {uploading ? "Uploading..." : "Confirm"}
                                    {!uploading && <Check className="h-4 w-4" />}
                                </Button>
                            </>
                        )}

                        {errorMsg && (
                            <Button onClick={() => onOpenChange(false)} variant="outline">
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
