"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getApiUrl,
  getMutationErrorMessage,
  publishFlash,
} from "@/lib/sellora";

export function UploadLogo({ storeId, currentLogo }: { storeId: number, currentLogo?: string | null }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  
  const normalizedLogoPath = currentLogo?.replace(/\\/g, "/") ?? "";
  const logoUrl = normalizedLogoPath.includes("branding")
    ? getApiUrl(`/static/${normalizedLogoPath}`)
    : "";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(getApiUrl(`/stores/${storeId}/upload-logo`), {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        publishFlash({
          kind: "success",
          title: "Logo uploaded successfully.",
          body: "The store workspace branding now reflects your latest logo.",
        });
        startTransition(() => {
          router.refresh();
        });
      } else {
        throw new Error("Upload failed.");
      }
    } catch (err) {
      console.error(err);
      publishFlash({
        kind: "error",
        title: "Logo upload failed.",
        body: getMutationErrorMessage(err, "We could not upload the new store logo."),
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ position: "relative", cursor: "pointer" }}>
      <label htmlFor="logo-upload" style={{
        display: "block",
        width: "90px", 
        height: "90px", 
        borderRadius: "16px", 
        background: "var(--surface-3)", 
        border: "2px solid var(--glass-border)",
        overflow: "hidden",
        cursor: "pointer",
        position: "relative"
      }}>
        {logoUrl ? (
           // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Store Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "10px", color: "var(--text-secondary)" }}>
            {isUploading ? "..." : "Upload"}
          </div>
        )}
      </label>
      <input 
        id="logo-upload" 
        type="file" 
        accept="image/*" 
        style={{ display: "none" }} 
        onChange={handleUpload}
        disabled={isUploading}
      />
    </div>
  );
}
