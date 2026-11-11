# HexaFlex · The Star Trail

Open `index.html` in a browser. The game runs offline and uses the images in `assets/`. Open **Demo** to start a fresh test run on any landscape. **Restart** replays that landscape. The Demo menu also lets you start the campaign again from Level 1.

- Use Left and Right or A and D to jog. At 50% dopamine or higher, hold Shift to run and press Jump again in midair to double jump. The brain icon shows the current percentage.
- Press Space, Up, or W to jump and Down to drop through ledges. On touch screens, use the on-screen arrows, Run, Jump, and Drop.
- Dopamine starts at 60% and falls slowly while moving. Apples, carrots, berries, and peas add 20 percentage points to the base meter.
- Donuts, soda, and candy add 30 temporary percentage points for six seconds, increase movement speed by 10%, delay movement, jump, and drop inputs by about 100 milliseconds, and cost one heart. Another treat restarts the timer. If a treat uses your last heart, take a breath to continue with one heart.
- The first six levels each use one landscape and finish with an explicit **Next level** screen.
  1. **Bob · Sunnyland** teaches cognitive defusion. Find the notebook and respond to four increasingly fast thought clouds.
  2. **Shelly · Tidepool Beach** teaches acceptance. One tidal wave at a time appears at random intervals after you meet her. A wave that catches Scratchy opens an acceptance question.
  3. **Ace · Amber Dunes** teaches committed action. Pick a concrete plan and reach the shade marker before the exit.
  4. **Olli · Willow River** teaches mindfulness. Scratchy crosses on platforms and wades at the river’s edge. The lesson asks what he can see, hear, and feel there. Swimming is planned for a later version.
  5. **Barnaby · Hushwood Forest** teaches self-as-context above a snowy forest, with frosted ledges, icy caves, and falling snow.
  6. **Fargo · Copperbrush Meadow** teaches values. Choose a way to put kindness into action.
- Each of the four character worlds has a 3,600-pixel trail and 35 stars. Scratchy explores the worlds and meets their guides.
- After the six introductions, choose **Explore more** to enter Stringstar Fields, Monstera Gardens, and Yellowstone Highlands. Every collectible uses the same gold star sprite.
- In Stringstar Fields, three thought clouds offer more practice. A wrong answer during a thought-cloud encounter costs one heart and sends Scratchy back into play. Each miss darkens the sky, increases the rain, and makes stopping and turning harder. The cloud can strike again for another try. If you run out, take a breath to refill your hearts and try again.
- Thought-cloud exercises draw from a shuffled set of mild worries, unhelpful reactions, and defusion techniques. The notebook’s familiar response always works. Recognizing the new technique earns two bonus points, separate from stars and heart upgrades. Wrong answers keep the same question for the next encounter.
- Collect stars to earn a new heart slot every ten stars. You start with three slots and can earn up to ten. Stars appear along the trail and above platforms. Jump over obstacles and gaps, use gold trampolines for high stars, and move quickly off cracked ledges.
- Every level has an animated checkpoint near its midpoint. Walk or jump past it to light it. After that, falling or running out of hearts returns Scratchy to the checkpoint. Before reaching it, falls return him to his last safe footing and running out of hearts returns him to the start of the current level. Pickups and lesson progress carry through recovery.
- Music starts with the first interaction. Sunnyland uses Pascal Belisle’s original loop. Stringstar Fields uses Abstraction’s “Distant Skyline — City Lights,” and the storm uses “Dust Bowl — Hope of Rain.” Browsers without Ogg Vorbis support use the original MP3. Sound on/off controls music and effects.
- Restart sends Scratchy back to the start and resets checkpoints, pickups, dopamine, and hearts.

Scratchy’s walk and run animations come from the supplied Male, Light sprite set. The jump uses the supplied somersault sprite sheet. The environments use art from the supplied Sunnyland and Stringstar Fields folders, with new layouts. The supplied Sunnyland license identifies Luis Zuno (Ansimuz) as the artist and marks the art CC0.

The level-art manifest sets food and scenery placements. The transparent trees, arch, and breaking wave are in `assets/scenery/`. Each background prop has a source rectangle, a bottom-center placement, and a display height. A prop at the same horizontal position as an older tree or authored prop takes its place.

The food atlas in `assets/food-pickups.png` uses 16 × 16 cells, ordered apple, carrot, berries, peas, donut, soda, candy, and brain.

The trail sheets in `assets/trail/` provide checkpoint animations, wayfinding and lesson props, river and ledge tiles, and small effects. The swim sheet contains paddle, tread, dive, and climb-out poses for the future swimming update.

The wooden signs mark halfway points, the next level, return paths, and trail ends. Floating hearts drift away as Scratchy approaches. Get close enough to restore one missing heart. Trampolines compress and rebound on landing.

In Frostpine Heights, Barnaby swoops down, grabs Scratchy, and carries him above the ice platforms before the bird’s-eye-view practice. Old Faithful cycles through steam, a rising jet, eruption, and settling behind the foreground.

Willow River has an eight-frame current animation and a cutaway at Olli’s shallow river edge. The cross section shows grassy banks, the riverbed, submerged stones, and bubbles under the moving surface. Its sprite sheet is in `assets/river/`.

The imported levels and level-art manifest are bundled in `worlds.js` for offline play. After editing their JSON, regenerate the bundle with `python3 tools/build-worlds.py` from the game folder.

Each landscape uses two generated backgrounds from `assets/backgrounds/`. The faded far layer moves at 10% of camera speed, and the nearer transparent layer moves at 32%. The paired layers are assigned through the level-art manifest.

Guides introduce their landscape’s obstacle before its encounter. Shelly’s waves begin after her introduction is acknowledged. Olli’s river has a lower bed so Scratchy stands inside the cutaway, with animated transparent water drawn over his submerged body. Move close to a bank and jump to leave the river. Frame-specific foot anchors align grounded characters with the terrain.

The old Sunset Monstera Grove levels are retired from the playable route. Monstera Gardens has two new layouts, Variegated Canopy and Silverleaf Rain Garden, using ten separately generated transparent plant PNGs.

Personal landmarks appear along the trail. Frostpine Heights includes Utah State’s Old Main, Amber Dunes includes Delicate Arch, Copperbrush Meadow includes Bunker Hill Monument, and Tidepool Beach includes the California Tower and dome from the supplied San Diego photograph. Yellowstone Highlands adds Geyser Ridge, a 3,600-pixel mountain route with 35 collectibles, a midpoint checkpoint, and Old Faithful. The five transparent landmark sprites and their in-game previews are in `assets/landmarks/`.
