"""Build the two Monstera Gardens layouts and their native pixel terrain."""
import json
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
out = root / "Monstera Gardens"
out.mkdir(exist_ok=True)

def save(image, name):
    image.save(out / name, optimize=True)

for night, name in [(False, "canopy-background.png"), (True, "rain-garden-background.png")]:
    image = Image.new("RGBA", (512, 250))
    ink = ImageDraw.Draw(image)
    top, bottom = ((38, 59, 78), (93, 155, 139)) if not night else ((34, 34, 65), (105, 101, 141))
    for y in range(250):
        factor = (y // 4 * 4) / 249
        ink.line((0, y, 511, y), fill=tuple(round(a + (b-a)*factor) for a,b in zip(top,bottom)))
    ink.ellipse((369, 30, 408, 69), fill="#a9d7ba" if not night else "#e2dcbf")
    for layer, color in enumerate(("#6c9d91", "#416e6a", "#294f52") if not night else ("#797a9b", "#535b7c", "#354765")):
        for x in range(512):
            y = 130 + layer*28 + int(8*math.sin(math.tau*(x+layer*37)/128))
            ink.line((x, y, x, 249), fill=color)
        rng = random.Random(32+layer)
        for x in range(-20, 540, 37):
            y = 150+layer*24 + rng.randrange(-18, 12)
            ink.line((x,y,x+3,249), fill=color, width=4)
            for side in (-1,1):
                ink.polygon([(x,y-15),(x+side*17,y-30),(x+side*30,y-24),
                             (x+side*22,y-7),(x+side*11,y)], fill=color)
    for x in range(16,512,61):
        ink.line((x, 39+x%37, x+40, 39+x%37), fill="#769f9b" if not night else "#9f9ab2")
    save(image, name)

tiles = Image.new("RGBA", (128,48))
for index in range(24):
    tile = Image.new("RGBA",(16,16))
    d = ImageDraw.Draw(tile)
    if index < 8:
        d.rectangle((0,0,15,15),fill="#324846")
        d.rectangle((0,0,15,2),fill="#8aab72")
        d.line((0,0,15,0),fill="#b2c98a")
        d.rectangle((0,3,15,5),fill="#587a53")
        d.line((2,9,9,9),fill="#647568")
        d.line((8,13,14,13),fill="#4a615a")
    elif index < 16:
        d.rectangle((0,0,15,15),fill="#273e40")
        d.line((0,3,7,3),fill="#46615c")
        d.line((9,8,15,8),fill="#405651")
        d.line((3,13,11,13),fill="#566458")
    elif index < 19:
        d.rectangle((0,0,15,8),fill="#554c47")
        d.rectangle((0,0,15,2),fill="#b29a6c")
        d.line((1,4,14,4),fill="#7d7055")
        d.line((5,2,5,7),fill="#3d4941")
        if index == 17:
            d.line([(9,0),(7,2),(10,4),(8,7)],fill="#d2b078")
    else:
        d.line((3,15,5,8),fill="#7c9d70")
        d.line((8,15,11,6),fill="#a2b777")
    tiles.alpha_composite(tile, (index%8*16,index//8*16))
save(tiles,"tileset.png")
save(Image.new("RGBA",(1,1)),"props.png")
save(Image.new("RGBA",(16,16)),"atlas.png")

specs = [
    ("variegated-canopy", "Variegated Canopy", 2112,
     [(0,528,208),(592,1056,208),(1120,1600,192),(1664,2112,208)],
     [(240,160,80),(400,112,80),(680,160,80),(840,112,80),(970,64,80),
      (1200,144,80),(1380,96,80),(1680,160,80),(1840,112,96)],
     [(800,200,38),(1760,200,38)]),
    ("silverleaf-rain-garden","Silverleaf Rain Garden",2368,
     [(0,464,208),(528,976,192),(1040,1536,208),(1600,1904,192),(1968,2368,208)],
     [(208,160,80),(352,112,80),(592,144,80),(752,96,80),(960,128,80),
      (1184,160,80),(1328,112,80),(1490,64,80),(1680,144,80),
      (1830,96,80),(2080,160,80),(2210,112,80)],
     [(1220,200,38),(2040,200,38)]),
]
levels = []
for slug, name, width, sections, bridges, springs in specs:
    terrain=[[-1]*(width//16) for _ in range(15)]
    collision=[]
    for start,end,top in sections:
        collision.append({"kind":"solid","rect":[start,top,end-start,240-top]})
        for row in range(top//16,15):
            for col in range(start//16,end//16):
                terrain[row][col]=col%4 if row==top//16 else 8+(row+col)%4
    # Explicit platform rendering follows these rectangles, including off-grid ledges.
    for i,(x,y,w) in enumerate(bridges):
        collision.append({"kind":"oneWay","rect":[x,y,w,8],"behavior":"crumbly" if i%3==1 else "ledge"})
    for x,y,w in springs:
        collision.append({"kind":"spring","rect":[x,y,w,8]})
    entities=[]
    for start,end,top in sections:
        for x in range(start+94,end-35,140):
            entities.append({"type":"seed","x":x,"y":top-24})
    entities += [{"type":"seed","x":x+w//2,"y":y-24} for x,y,w in bridges]
    level={"name":name,"size":[width,240],"start":[24,208],"exit":[width-24,208],
           "terrain":terrain,"decor":[[-1]*(width//16) for _ in range(15)],
           "collision":collision,"props":[],"entities":entities}
    (out/(slug+".json")).write_text(json.dumps(level,indent=2)+"\n")
    generated_background = "sunlit-jungle.png" if slug == "variegated-canopy" else "moonlit-rain-garden.png"
    background = generated_background if (out / generated_background).exists() else (
        "canopy-background.png" if slug == "variegated-canopy" else "rain-garden-background.png")
    levels.append({"name":name,"layout":slug+".json","background":background,
                   "backgroundFit": "cover" if (out / generated_background).exists() else "repeat"})

world={"world":"Monstera Gardens","pickup":"seed","tileSize":16,"viewport":[480,250],"visiblePlatforms":True,
       "backgrounds":[{"image":"canopy-background.png","scrollFactor":0.12}],
       "tileset":{"image":"tileset.png","columns":8},
       "props":{"image":"props.png","rects":{}},
       "sprites":{"image":"atlas.png","animations":{"seed":{"fps":1,"anchor":[8,8],"frames":[[0,0,16,16]]}}},
       "levels":levels}
(out/"world.json").write_text(json.dumps(world,indent=2)+"\n")

art_path=root/"assets/level-art/manifest.json"
art=json.loads(art_path.read_text())
for old in ("Goldleaf Trail","Sunset Canopy","Amber Overlook","Rootwater Basin"):
    art.pop(old,None)
for slug,name,width,sections,bridges,springs in specs:
    start,end,top=sections[len(sections)//2]
    art[name]={"food":[[2,200,185],[3,width-280,185]],"backgroundProps":[],
               "checkpoint":{"x":start+96,"y":top,"style":5},"trailProps":[]}
plant_index = root / "assets/monstera/index.json"
if plant_index.exists():
    plants = [{**plant, "folder": "monstera"} for plant in json.loads(plant_index.read_text())]
    houseplant_index = root / "assets/houseplants/index.json"
    if houseplant_index.exists():
        houseplants = [{**plant, "folder": "houseplants"} for plant in json.loads(houseplant_index.read_text())]
        mixed = []
        for i in range(max(len(plants), len(houseplants))):
            if i < len(plants):
                mixed.append(plants[i])
            if i < len(houseplants):
                mixed.append(houseplants[i])
        plants = mixed
    for level_number, (_, name, width, sections, _, _) in enumerate(specs):
        placements = []
        xs = list(range(120, width - 65, 174))
        for i, x in enumerate(xs):
            floor = next((top for start, end, top in sections if start + 30 <= x <= end - 30), None)
            if floor is None:
                continue
            plant = plants[(len(placements) + level_number * 4) % len(plants)]
            placements.append({
                "sprite": plant["id"], "folder": plant["folder"],
                "source": plant["source"],
                "x": x, "y": floor + 4, "height": plant["displayHeight"],
            })
        art[name]["backgroundProps"] = placements

art_path.write_text(json.dumps(art,indent=2)+"\n")
