/**
 * Clipboard helpers for copying diagrams as PNG or SVG.
 *
 * Uses Tauri's native clipboard plugin (writeImage) so it works
 * reliably on both Windows and macOS for pasting into Word, Google Docs, etc.
 */

/**
 * Convert an SVG string to a PNG Uint8Array via off-screen canvas.
 */
export function svgToPngBytes(
  svgString: string,
  scale = 2
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // Convert SVG string to a data URL (more reliable than blob URL)
    const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;

      // White background (avoids transparent background issues in Word/Docs)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            blob.arrayBuffer().then(
              (buf) => resolve(new Uint8Array(buf)),
              reject
            );
          } else {
            reject(new Error("Canvas toBlob returned null"));
          }
        },
        "image/png"
      );
    };

    img.onerror = () => reject(new Error("Failed to load SVG as image"));
    img.src = dataUrl;
  });
}

/**
 * Copy a diagram SVG as a PNG image to the system clipboard
 * using Tauri's native clipboard-manager plugin.
 */
export async function copyPngToClipboard(svgString: string): Promise<void> {
  const pngBytes = await svgToPngBytes(svgString);
  const { writeImage } = await import(
    "@tauri-apps/plugin-clipboard-manager"
  );
  await writeImage(pngBytes);
}

/**
 * Copy an SVG string as text to the system clipboard.
 */
export async function copySvgToClipboard(svgString: string): Promise<void> {
  const { writeText } = await import(
    "@tauri-apps/plugin-clipboard-manager"
  );
  await writeText(svgString);
}
