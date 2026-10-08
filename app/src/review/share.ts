// A file out of the app (#193, #198): the share sheet where there is one (iOS: Save to Files, AirDrop,
// Anki), else a download. Safari allows a share only shortly after a tap; a file that took longer to build
// comes back as "blocked", and the caller offers a second tap to share it.

export type Shared = "shared" | "saved" | "cancelled" | "blocked";

export function download(file: File) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function shareOrDownload(file: File, title: string): Promise<Shared> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (e) {
      const name = (e as Error).name;
      if (name === "AbortError") return "cancelled";      // the share sheet was closed
      if (name === "NotAllowedError") return "blocked";   // the tap is too long ago
    }
  }
  download(file);
  return "saved";
}
