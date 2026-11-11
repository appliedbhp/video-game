# Monstera Gardens

Two replacement levels for the retired Sunset Monstera Grove route.

- **Variegated Canopy** follows raised banks, root bridges, two trampolines, and an upper route.
- **Silverleaf Rain Garden** winds through low garden terraces, gaps, and breakaway ledges.

The levels use the same gold star rewards and heart rules as the rest of The Star Trail. Each has a checkpoint and two food pickups.

Plant PNGs are in assets/monstera/ and assets/houseplants/. Their index records the opaque source region and display height used to anchor each base to the ground. Assets are original outputs from the built-in image-generation tool.

To rebuild the layouts and placements, run python3 tools/build-monstera-gardens.py and then python3 tools/build-worlds.py.


The sunlit jungle and moonlit waterfall backdrops are original image-generation outputs. All foliage is static. The six additional houseplants are fiddle-leaf fig, bird-of-paradise, calathea orbifolia, alocasia Polly, Boston fern, and golden pothos.
