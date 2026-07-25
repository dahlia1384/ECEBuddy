import { ATTACHMENT_MIME_TYPES, type Attachment, type AttachmentMimeType } from "./api";

export const MAX_ATTACHMENTS = 4;
export const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB

function isSupportedMimeType(mimeType: string): mimeType is AttachmentMimeType {
  return (ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType);
}

export interface PendingAttachment extends Attachment {
  id: string;
  previewUrl?: string;
}

export async function fileToAttachment(file: File): Promise<PendingAttachment> {
  if (!isSupportedMimeType(file.type)) {
    throw new Error(`${file.name}: unsupported file type (${file.type || "unknown"})`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name}: file is too large (max 8MB)`);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const base64 = dataUrl.split(",")[1] ?? "";

  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    mimeType: file.type,
    data: base64,
    name: file.name,
    previewUrl: file.type.startsWith("image/") ? dataUrl : undefined,
  };
}
