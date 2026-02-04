import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { Poppler } from "node-poppler"; // correct import for node-poppler

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const prerender = false;
export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const rawPdfSrc = url.searchParams.get("src");
  const width = parseInt(url.searchParams.get("width") || "720", 10);
  const height = parseInt(url.searchParams.get("height") || "360", 10);

  if (!rawPdfSrc) {
    return new Response("Falta el paràmetre src", { status: 400 });
  }

  // decode the src (client encoded it)
  let decodedSrc: string;
  try {
    decodedSrc = decodeURIComponent(rawPdfSrc);
  } catch (e) {
    return new Response("Paràmetre src malformat", { status: 400 });
  }

  // Base directory where PDFs live (adjust as needed)
  const publicDir = path.resolve(process.cwd(), "public");
  const cacheDir = path.join(publicDir, "portades");

  // stable cache key using decoded src so same logical file maps to same key
  const cacheKeyInput = `${decodedSrc}_${width}_${height}`;
  const hash = Buffer.from(cacheKeyInput).toString("base64url");
  const finalImage = path.join(cacheDir, `${hash}.webp`);

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // manual override check
  const manualOverride = path.join(cacheDir, `${hash}.manual.webp`);
  if (fs.existsSync(manualOverride)) {
    return new Response(fs.readFileSync(manualOverride), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=2678400",
      },
    });
  }

  // serve cached auto-generated result
  if (fs.existsSync(finalImage)) {
    return new Response(fs.readFileSync(finalImage), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=2678400",
      },
    });
  }

  // create a tmp dir for processing
  const tmpDir = path.join(cacheDir, `.tmp_${hash}`);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // ensure cleanup in finally
  try {
    let pdfPathOnDisk: string;

    // If decodedSrc looks like an absolute/relative path under /documents, treat as local
    if (!/^https?:\/\//i.test(decodedSrc)) {
      // strip any leading slash so path.join behaves as relative to publicDir
      const rel = decodedSrc.replace(/^\/+/, "");

      // resolve to absolute path inside public dir
      pdfPathOnDisk = path.resolve(publicDir, rel);

      // security: path must be inside publicDir
      if (!pdfPathOnDisk.startsWith(publicDir)) {
        return new Response("Ruta no permesa", { status: 403 });
      }

      if (!fs.existsSync(pdfPathOnDisk)) {
        return new Response(`PDF no trobat: ${decodedSrc}`, { status: 404 });
      }
    } else {
      // remote URL — download to tmp
      const res = await fetch(decodedSrc);
      if (!res.ok) {
        return new Response("Recuperació del PDF fallida", { status: 502 });
      }
      pdfPathOnDisk = path.join(tmpDir, "document.pdf");
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(pdfPathOnDisk, Buffer.from(arrayBuffer));
    }

    // Use Poppler to render first page to PNG
    const poppler = new Poppler(); // expects system poppler-utils present
    const outputPrefix = path.join(tmpDir, "page"); // poppler will create page-1.png or page.png depending on options
    const options: Record<string, any> = {
      firstPageToConvert: 1,
      lastPageToConvert: 1,
      singleFile: true,
      pngFile: true,
    };

    await poppler.pdfToPpm(pdfPathOnDisk, outputPrefix, options);

    // find generated png file in tmpDir
    const pngFile = fs.readdirSync(tmpDir).find((f) => f.endsWith(".png"));
    if (!pngFile) throw new Error("No s'ha generat cap PNG des del PDF");

    const pngPath = path.join(tmpDir, pngFile);

    // convert/resize to webp (cover) — keep the 'top' gravity roughly like your original 'position: top'
    await sharp(pngPath)
      .resize(width, height, { fit: "cover", position: "north" })
      .webp({ quality: 80 })
      .toFile(finalImage);

    // return generated file
    return new Response(fs.readFileSync(finalImage), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=2678400",
      },
    });
  } catch (err) {
    console.error("Error generant la portada:", err);
    return new Response(
      `Error generant la portada: ${err instanceof Error ? err.message : String(err)}`,
      { status: 500 }
    );
  } finally {
    // cleanup temp dir if present
    try {
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn("No s'ha pogut eliminar el tmp dir:", cleanupErr);
    }
  }
}
