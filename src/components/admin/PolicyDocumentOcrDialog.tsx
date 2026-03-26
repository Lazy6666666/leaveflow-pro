import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFileToConvex } from "@/lib/convexUpload";
import { convex } from "@/lib/convex";
import { api } from "@/lib/convexApi";
import { getErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

type PolicyDocumentOcrDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIndexed: () => Promise<void>;
};

export function PolicyDocumentOcrDialog({ open, onOpenChange, onIndexed }: PolicyDocumentOcrDialogProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setTitle("");
    setFile(null);
  };

  const handleSubmit = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle || !file) {
      toast.error("Title and document file are required");
      return;
    }

    setUploading(true);
    try {
      const upload = await uploadFileToConvex(file, "policy_document");
      await convex.action(api.rag.ocrAndIndexPolicyDocument, {
        title: normalizedTitle,
        storageId: upload.storageId,
      });
      toast.success("Policy document indexed from OCR");
      onOpenChange(false);
      reset();
      await onIndexed();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to OCR and index policy document"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !uploading) {
          reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Policy Document</DialogTitle>
          <DialogDescription>
            Upload a PDF or image, run Mistral OCR, and index the extracted text into the policy knowledge base.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="policy-ocr-title">Title</Label>
            <Input
              id="policy-ocr-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Employee handbook - remote work"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy-ocr-file">Document</Label>
            <Input
              id="policy-ocr-file"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">Supported: PDF, PNG, JPG, JPEG, WEBP.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={uploading}>
            {uploading ? "Uploading & OCR..." : "Upload & OCR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
