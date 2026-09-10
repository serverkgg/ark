## The official maps

ARK: Survival Ascended ships ten official maps, and all of them come with the game — there is nothing extra to download:

- The Island — `TheIsland_WP`
- Scorched Earth — `ScorchedEarth_WP`
- The Center — `TheCenter_WP`
- Aberration — `Aberration_WP`
- Extinction — `Extinction_WP`
- Ragnarok — `Ragnarok_WP`
- Astraeos — `Astraeos_WP`
- Valguero — `Valguero_WP`
- Lost Colony — `LostColony_WP`
- Genesis — `Genesis_WP`

If this is your first ARK, start on **The Island**.

@[open](panel:launch)

## Switch the map

Pick the map in the **Launch** tab and apply — we restart your server onto it.

> [!note] Switching deletes nothing. Every map keeps a world of its own, so going back to the old map gives you your characters and buildings exactly as you left them.

## A map from a mod

1. Add the map's mod from the Mods tab
2. In the Launch tab pick "A map from a mod" and type the map name — it ends in `_WP`
3. Apply, and the first start takes longer while the mod downloads

> [!warning] The map name is not the mod id. You need both: the mod brings the files, and the name tells your server which map to run.

## Where each map's world lives

Every map has a folder inside `ShooterGame/Saved/SavedArks/`, named after the map. Inside it sits the world file plus the character and tribe files.

@[open](files:ShooterGame/Saved/SavedArks)

> [!danger] Never delete a map folder while the server is up, and never upload over its files. To roll a world back, stop your server and use the backups.

## Wiping and backups

- Take a backup from the Backups tab before any wipe or big switch
- To start a map fresh, stop your server and hit **Wipe the world** on its row in the **Your saved worlds** table under the Controls tab — the next start builds a new world
- Our backups cover every map folder together, so a restore brings all of them back

@[open](backups)
