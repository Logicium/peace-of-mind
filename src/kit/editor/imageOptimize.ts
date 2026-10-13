/**
 * Client-side image work: decode, downscale, re-encode.
 *
 * `deriveImage` is the primitive: a file in, a blob of a given spec out,
 * with the dimensions it was read at. `optimizeImage` sits on top for the
 * editor and add-on uploads, which post base64 and only want a WebP when it
 * actually wins (a naive canvas re-encode of an already-tight camera JPEG
 * can come out larger; in that case the original bytes are kept). SVG and
 * GIF pass through untouched (vector / animation).
 */

/**
 * The server rejects base64 media above 25 MB, and base64 of 25 MB is 33 MB
 * against a 40 MB body limit, so the server is right and this agrees with it.
 * Gallery uploads do not go through this limit; they never touch the server.
 */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024

const MAX_EDGE = 2560
const WEBP_QUALITY = 0.84

export interface OptimizedUpload {
  filename: string
  contentType: string
  /** raw base64 (no data: prefix) */
  base64: string
  bytes: number
  converted: boolean
}

export interface DeriveSpec {
  /** the longest side, in pixels; smaller images are never upscaled */
  maxEdge: number
  /** 'image/webp' or 'image/jpeg' */
  type: string
  quality: number
}

export interface DerivedImage {
  blob: Blob
  /** the derivative's size */
  width: number
  height: number
  /** the source's size, read at decode */
  sourceWidth: number
  sourceHeight: number
}

export function validateUploadSize(file: File): void {
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)
    throw new Error(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${mb} MB. Export a smaller copy and try again.`,
    )
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader()
    fr.onload = () => res((fr.result as string).split(',')[1] ?? '')
    fr.onerror = rej
    fr.readAsDataURL(blob)
  })
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file)
    } catch {
      /* fall through to <img> */
    }
  }
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      res(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      rej(e)
    }
    img.src = url
  })
}

function sizeOf(source: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  return {
    w: 'naturalWidth' in source ? source.naturalWidth : source.width,
    h: 'naturalHeight' in source ? source.naturalHeight : source.height,
  }
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob(res, type, quality))
}

function swapExt(name: string, ext: string): string {
  return name.replace(/\.[a-z0-9]+$/i, '') + ext
}

/** The pixel size of an image file, without keeping the decode. */
export async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const source = await decode(file)
    const { w, h } = sizeOf(source)
    if ('close' in source) source.close()
    return w && h ? { width: w, height: h } : null
  } catch {
    return null
  }
}

/**
 * One derivative of an image, to a spec. Throws when the file cannot be
 * decoded; callers that can fall back to the original bytes catch it.
 */
export async function deriveImage(file: File, spec: DeriveSpec): Promise<DerivedImage> {
  const source = await decode(file)
  const { w, h } = sizeOf(source)
  if (!w || !h) {
    if ('close' in source) source.close()
    throw new Error('That image could not be read.')
  }
  const scale = Math.min(1, spec.maxEdge / Math.max(w, h))
  const outW = Math.max(1, Math.round(w * scale))
  const outH = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    if ('close' in source) source.close()
    throw new Error('Could not draw that image.')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, outW, outH)
  if ('close' in source) source.close()

  const blob = await encode(canvas, spec.type, spec.quality)
  // release the backing store now rather than when the GC gets round to it;
  // four hundred of these in a queue is how a tab runs out of memory
  canvas.width = 0
  canvas.height = 0
  if (!blob) throw new Error('Could not encode that image.')
  return { blob, width: outW, height: outH, sourceWidth: w, sourceHeight: h }
}

export async function optimizeImage(file: File): Promise<OptimizedUpload> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.')
  validateUploadSize(file)

  const passthrough = async (): Promise<OptimizedUpload> => ({
    filename: file.name,
    contentType: file.type || 'image/jpeg',
    base64: await blobToBase64(file),
    bytes: file.size,
    converted: false,
  })

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return passthrough()

  let derived: DerivedImage
  try {
    derived = await deriveImage(file, { maxEdge: MAX_EDGE, type: 'image/webp', quality: WEBP_QUALITY })
  } catch {
    return passthrough()
  }

  const downscaled = derived.width < derived.sourceWidth || derived.height < derived.sourceHeight
  if (!downscaled && derived.blob.size >= file.size) return passthrough()

  return {
    filename: swapExt(file.name, '.webp'),
    contentType: 'image/webp',
    base64: await blobToBase64(derived.blob),
    bytes: derived.blob.size,
    converted: true,
  }
}
