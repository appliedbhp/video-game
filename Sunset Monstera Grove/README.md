# Sunset Monstera Grove

Oversized split-leaf monsteras, a low striped sun, and copper footbridges. Goldleaf Trail has continuous ground with optional elevated pickups. Sunset Canopy uses staggered bridges across gaps.

- `background_0.png` is a single 896 × 224 sunset backdrop. Center it behind the viewport. `background_1.png` and `background_2.png` repeat horizontally at the rates in the manifest.
- `tileset.png` uses the Moonbell Hollow pack’s 16 × 16 tile IDs. `props.png` includes two monstera sizes and a stone arch.
- `atlas.png` has four rows of six 32 × 24 frames for Sunseed, Duskwing, Leaf Crawler, and the pickup effect. `sprites.aseprite` contains the editable sequences.
- `world.json` describes asset regions, animation rates, and the four level files. Each level supplies tile grids, collision rectangles, spawn and exit points, and prop and entity placements. Tile IDs are zero-based, with −1 for empty cells. Coordinates are native pixels from the top-left. Props anchor at bottom center, and entities use the anchors from the world manifest.

Use nearest-neighbor sampling when scaling. The layouts are engine-neutral.

## Additional levels

- **Amber Overlook** climbs a series of terraces to a ridge, with optional high bridges along the way.
- **Rootwater Basin** offers a canopy route and a lower route through the roots, with Sunseeds on both paths.

See `grove-expansion-preview.png` for both layouts.
