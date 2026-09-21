// Heavy half of the /shop intro: React + three.js + the gallery. Loaded as
// a separate chunk by shop-gallery.tsx, only when the intro is shown.
import { createRoot } from 'react-dom/client';
import InfiniteGallery from '../components/ui/3d-gallery-photography';

// 640 px copies of the shop's own photos (public/shop/gallery/). The full
// product photos are 1536 × 2048: twelve of those on the GPU at once cost
// ~150 MB of texture memory and ~4 MB of download for an intro.
const IMAGES = [
  ['amanita', 'Amanita muscaria spagyric extract'],
  ['temple-nectar', 'Temple Nectar'],
  ['forest-floor', 'Mushroom gills over moss and lichen'],
  ['chaga', 'Wild birch chaga extract'],
  ['lucid', 'Lucid'],
  ['blue-lotus-flower', 'Blue lotus flowers'],
  ['sleepy', 'Sleepy Sleepy'],
  ['amanita-harvest', 'A table of foraged fly agaric'],
  ['healthy-aging', 'Healthy Aging'],
  ['butterfly-pea', 'Butterfly pea flowers'],
  ['mineral-tonic', 'Mineral Tonic'],
  ['nervoussystem', 'Nervous System Tonic'],
  ['sacred-lavendula', 'Wild Anatolian lavender'],
  ['nettle', 'Nettle extract'],
  ['moon-support', 'Moon Support'],
  ['ruby-no7', 'Ruby No.7'],
].map(([name, alt]) => ({ src: `/shop/gallery/${name}.webp`, alt }));

export function mount(el: HTMLElement): () => void {
  const root = createRoot(el);
  root.render(
    <InfiniteGallery
      images={IMAGES}
      speed={1.2}
      visibleCount={12}
      style={{ width: '100%', height: '100%' }}
      className=""
    />
  );
  return () => root.unmount();
}
