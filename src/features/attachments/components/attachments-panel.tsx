"use client";

import { useState, useTransition, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { saveAttachmentMetadataAction, listAttachmentsForEntityAction } from "@/features/attachments/actions";
import { Button } from "@/components/ui/button";
import { Paperclip, File, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export function AttachmentsPanel({ entityType, entityId }: { entityType: "customer" | "lead" | "quote" | "order" | "work_order" | "delivery" | "payment", entityId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<Awaited<ReturnType<typeof listAttachmentsForEntityAction>>>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [isUploading, startUploading] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        setLoadingFiles(true);
        const data = await listAttachmentsForEntityAction(entityType, entityId);
        setFiles(data);
      } catch (e) {
        console.error("Error loading files", e);
      } finally {
        setLoadingFiles(false);
      }
    }
    loadFiles();
  }, [entityType, entityId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${entityType}/${entityId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

    startUploading(async () => {
      setUploadError(null);
      try {
        const supabase = supabaseBrowser();
        const { error } = await supabase.storage.from("files").upload(filePath, file);

        if (error) {
          throw new Error(error.message);
        }

        const metadata = await saveAttachmentMetadataAction({
          entityType,
          entityId,
          path: filePath,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size
        });

        setFiles([...files, metadata]);
        router.refresh();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setUploadError(err.message);
        } else {
          setUploadError("Failed to upload file");
        }
      }
    });
  };

  const handleDownload = async (path: string, fileName: string) => {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.storage.from("files").createSignedUrl(path, 60);

    if (error) {
      alert("Failed to download file");
      return;
    }

    if (data && data.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="rounded-xl border border-white/40 bg-white/60 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-zinc-900 flex items-center gap-2"><Paperclip className="h-4 w-4" /> Attachments</h3>

        <div>
          <label className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-zinc-100 hover:text-zinc-900 h-9 px-3">
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Upload File
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-b border-red-100">
          {uploadError}
        </div>
      )}

      <div className="p-4 flex-1 overflow-auto">
        {loadingFiles ? (
          <p className="text-sm text-zinc-500 animate-pulse text-center py-4">Loading files...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">No attachments uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {files.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 bg-zinc-100 rounded-md flex items-center justify-center shrink-0">
                    <File className="h-5 w-5 text-zinc-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-zinc-900 truncate" title={f.fileName}>{f.fileName}</p>
                    <p className="text-xs text-zinc-500 flex gap-2">
                      <span>{f.sizeBytes ? (f.sizeBytes / 1024 / 1024).toFixed(2) + " MB" : "Unknown size"}</span>
                      <span>•</span>
                      <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(f.path, f.fileName)}>
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}