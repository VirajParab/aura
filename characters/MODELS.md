# Character VRM models

Launch characters use free **CC0** VRM avatars from [Open Source Avatars](https://opensourceavatars.com) (ToxSam 100Avatars series). No attribution required.

| Character | Stand-in model | Collection | License |
|-----------|----------------|------------|---------|
| Mochi 🐕 | DogoBurger | 100Avatars R3 | CC0 |
| Pixel 🦝 | MeganTheFox | 100Avatars R3 | CC0 |
| Sakura 🌸 | Rose | 100Avatars R1 | CC0 |
| Nova 🤖 | Cyberpal | 100Avatars R3 | CC0 |
| Ember 🐉 | FireEye | 100Avatars R3 | CC0 |

## Download / refresh

```bash
make models
```

Or:

```bash
node scripts/download-models.mjs
```

Files are saved as `characters/{id}/model.vrm`.

## Replace with your own

Drop any VRM 0.x or 1.x file at `characters/{id}/model.vrm` and restart the overlay. Browse more free models at [opensourceavatars.com](https://opensourceavatars.com).
