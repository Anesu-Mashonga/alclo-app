import { SAMPLE_BY_KEY } from '@/data/wardrobeItems';
import './AuthMosaic.scss';

// Garments picked for contrast in shape and colour; each key maps to a grid area in the SCSS.
const TILES = [
  { area: 'coat', key: 'burgundy-overcoat' },
  { area: 'hat', key: 'brown-cowboy-hat' },
  { area: 'jacket', key: 'black-leather-biker' },
  { area: 'knit', key: 'ivory-cable-knit' },
  { area: 'pants', key: 'olive-cargo-pants' },
  { area: 'boots', key: 'wheat-work-boots' },
  { area: 'bag', key: 'lilac-suede-belt-bag' },
].filter((tile) => SAMPLE_BY_KEY[tile.key]?.image);

/**
 * Lookbook panel for the sign-in pages: an asymmetric grid of garment photos in photo wells
 * on the sunken surface, with one line of copy underneath. The photos are decorative.
 */
export default function AuthMosaic() {
  return (
    <div className="auth-mosaic">
      <div className="auth-mosaic__grid" aria-hidden="true">
        {TILES.map((tile) => (
          <div key={tile.key} className={`auth-mosaic__tile auth-mosaic__tile--${tile.area}`}>
            <img
              className="auth-mosaic__img"
              src={SAMPLE_BY_KEY[tile.key].image}
              alt=""
              decoding="async"
              draggable={false}
            />
          </div>
        ))}
      </div>
      <p className="auth-mosaic__caption">Plan outfits from the clothes you already own.</p>
    </div>
  );
}
