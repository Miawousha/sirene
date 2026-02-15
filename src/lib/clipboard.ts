/**
 * Clipboard helpers for copying diagrams as PNG or SVG.
 *
 * Uses Tauri's native clipboard plugin (writeImage) so it works
 * reliably on both Windows and macOS for pasting into Word, Google Docs, etc.
 */

/**
 * Ensure the SVG has explicit width/height attributes (not just viewBox).
 * Without them the Image element may render at 0x0.
 */
function ensureSvgDimensions(svgString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return svgString;

  // If width/height are missing or set to 100%, derive from viewBox
  const w = svgEl.getAttribute("width");
  const h = svgEl.getAttribute("height");
  const viewBox = svgEl.getAttribute("viewBox");

  if ((!w || w === "100%" || !h || h === "100%") && viewBox) {
    const parts = viewBox.split(/[\s,]+/);
    if (parts.length === 4) {
      svgEl.setAttribute("width", parts[2]);
      svgEl.setAttribute("height", parts[3]);
    }
  }

  // Add xmlns if missing (required for Image loading)
  if (!svgEl.getAttribute("xmlns")) {
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }

  return new XMLSerializer().serializeToString(doc);
}

/**
 * Convert an SVG string to a PNG Uint8Array via off-screen canvas.
 */
export function svgToPngBytes(
  svgString: string,
  scale = 2
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const safeSvg = ensureSvgDimensions(svgString);

    // Try both approaches: data URL first, then blob URL as fallback
    // Data URL encodes SVG as base64 (works best in most webviews)
    const encodedSvg = encodeURIComponent(safeSvg);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

    const img = new Image();
    // Allow cross-origin so canvas isn't tainted
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Ensure we have valid dimensions
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      if (w === 0 || h === 0) {
        reject(new Error(`SVG has zero dimensions: ${w}x${h}`));
        return;
      }

      try {
        const canvas = document.createElement("canvas");
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas 2d context"));
          return;
        }

        // White background (avoids transparent background issues in Word/Docs)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (pngBlob) => {
            if (pngBlob) {
              pngBlob.arrayBuffer().then(
                (buf) => resolve(new Uint8Array(buf)),
                reject
              );
            } else {
              reject(new Error("Canvas toBlob returned null"));
            }
          },
          "image/png"
        );
      } catch (canvasErr) {
        reject(canvasErr);
      }
    };

    img.onerror = (_e) => {
      reject(new Error("Failed to load SVG into Image element"));
    };

    img.src = dataUrl;
  });
}

/**
 * Copy a diagram SVG as a PNG image to the system clipboard
 * using Tauri's native clipboard-manager plugin.
 */
export async function copyPngToClipboard(svgString: string): Promise<void> {
  const pngBytes = await svgToPngBytes(svgString);

  // Tauri writeImage expects an Image object, not raw PNG bytes.
  // Image.fromBytes() decodes PNG into the RGBA format Tauri needs.
  const { Image: TauriImage } = await import("@tauri-apps/api/image");
  const { writeImage } = await import(
    "@tauri-apps/plugin-clipboard-manager"
  );
  const tauriImg = await TauriImage.fromBytes(pngBytes);
  await writeImage(tauriImg);
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
