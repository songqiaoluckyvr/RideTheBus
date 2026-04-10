import { uiImageUrl } from '../lib/cardAssets'

/**
 * Full-screen background that slowly scrolls downward in a seamless loop.
 * Two copies of the image are stacked vertically; the animation translates
 * them from -50% to 0% so the seam is never visible.
 */
export function ScrollingBackground() {
  const src = uiImageUrl('background')
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="animate-scroll-down w-full" style={{ height: '200%' }}>
        <img src={src} alt="" aria-hidden className="w-full h-1/2 object-cover" />
        <img src={src} alt="" aria-hidden className="w-full h-1/2 object-cover" />
      </div>
    </div>
  )
}
