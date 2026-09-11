## How mods work in ARK

Every ARK: Survival Ascended mod comes from **CurseForge**, and there is no file for you to upload: we hand your server the mod ids at launch and it downloads them from CurseForge itself.

That means a mod you add or remove only takes effect after a restart, and the first start after adding new mods runs longer than usual because it is fetching them.

@[open](panel:mods)

> [!note] Players do not download anything by hand. ARK pushes the server's mods to their machine automatically when they join.

## Add a mod

1. Open the **Mods** tab and search for the mod by name
2. Hit install on the one you want
3. Restart your server

If you already know the mod's id you can add it straight from the **Load order** table — the id is the numeric **Project ID** in the **About** box on the mod's CurseForge page, not the name in the URL.

> [!warning] Make sure the mod says it supports **Ascended**. Mods built for the old game (Survival Evolved) never work on the new ARK.

## Order matters

Mods load in the order the table shows, and a later one can override an earlier one. The general rule:

- Mods that change core systems first
- Content and dino mods after them
- Interface and cosmetic mods last

Use **Up** and **Down** to arrange them, and restart after any change.

## Mod maps

A mod map takes two steps together:

1. Add the map's mod from the Mods tab like any other mod
2. Go to the **Launch** tab, pick "A map from a mod", and type the map name the mod author gives you — it always ends in `_WP`

@[open](panel:launch)

> [!warning] If the map name is wrong, your server does not start — it comes up and exits straight away. Put the right name from the mod's page back in the Launch tab, or switch back to an official map, and restart.

## Where the files land

Mods download into `ShooterGame/Binaries/Win64/ShooterGame/Mods/83374/`, one folder each, named `modId_fileId`. Do not edit them by hand — your server fetches them again on every start.

What we keep is the mod list itself, not the mod files, so a backup carries the list alone; restoring one has your server download the mods again on its first start, and a reset clears the list and starts you from nothing.

> [!danger] If you remove a mod that added items or dinos, everything your players built with it disappears from the world. Take a backup before any removal.

@[open](backups)
