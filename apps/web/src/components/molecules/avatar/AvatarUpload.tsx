"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/atoms/display/Avatar";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { CameraCaptureDialog } from "./CameraCaptureDialog";

interface AvatarUploadProps {
  avatarUrl: string | null | undefined;
  initials: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-28 w-28",
};

export function AvatarUpload({
  avatarUrl,
  initials,
  onUpload,
  onRemove,
  isUploading = false,
  size = "md",
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fullUrl = getAvatarUrl(avatarUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
    setMenuOpen(false);
  };

  const handleAvatarClick = () => {
    if (isUploading) return;
    setMenuOpen((prev) => !prev);
  };

  return (
    <div className="relative group inline-block">
      <Avatar
        className={cn(sizeClasses[size], "cursor-pointer")}
        onClick={handleAvatarClick}
      >
        {fullUrl && <AvatarImage src={fullUrl} alt="Avatar" />}
        <AvatarFallback className="text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Hover overlay */}
      <button
        type="button"
        onClick={handleAvatarClick}
        disabled={isUploading}
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
          isUploading && "opacity-100",
        )}
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
      </button>

      {/* Remove button */}
      {fullUrl && !isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
            setMenuOpen(false);
          }}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Dropdown menu */}
      {menuOpen && !isUploading && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[160px]">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setCameraOpen(true);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </button>
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload File
            </button>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />

      <CameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={onUpload}
      />
    </div>
  );
}
