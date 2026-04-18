import { mkdir, writeFile, unlink } from 'fs/promises'
import { join } from 'path'

export const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
export const PUBLIC_URL_PREFIX = '/uploads'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export function extForMime(mime: string): string {
  return MIME_EXT[mime] ?? 'bin'
}

export function publicUrl(filename: string): string {
  return `${PUBLIC_URL_PREFIX}/${filename}`
}

export async function saveUpload(bytes: Uint8Array, filename: string): Promise<void> {
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(join(UPLOAD_DIR, filename), bytes)
}

export async function removeUpload(filename: string): Promise<void> {
  try {
    await unlink(join(UPLOAD_DIR, filename))
  } catch (e) {
    const err = e as NodeJS.ErrnoException
    if (err.code !== 'ENOENT') throw e
  }
}
