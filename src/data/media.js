import sizes from './media.json'

export { sizes }

const base = import.meta.env.BASE_URL

export const url = (path) => base + path.split('/').map(encodeURIComponent).join('/')

// Every still knows its pixel size (written by scripts/optimize_media.py), so the page can
// reserve its space before it arrives.
export function img(path, extra) {
  const [width, height] = sizes[path] || []
  return { src: url(path), width, height, ...extra }
}

export function video(path, extra) {
  const poster = path.replace(/\.mp4$/, '.webp')
  const [width, height] = sizes[poster] || []
  return { type: 'video', src: url(path), poster: url(poster), width, height, ...extra }
}
