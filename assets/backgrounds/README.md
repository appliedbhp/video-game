# Parallax backgrounds

Each landscape has a `-far.png` image with faded sky and distant scenery, plus a `-near.png` image with transparent foreground scenery.

The game draws the far image at 10% of camera speed and the near image at 32%. Adjacent copies are mirrored to join their edges. Levels in the same landscape share a pair.

The built-in image generator produced the backgrounds. Far prompts requested a wide, low-contrast pixel-art landscape with open sky. Near prompts requested a transparent row of landscape silhouettes in a richer matching palette. Olli’s pair contains woodland scenery, and the river animation is confined to the playable river cutaway.
