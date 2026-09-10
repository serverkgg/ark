## Create your server

On the **Create a server** page pick ARK: Survival Ascended. The game is heavy — 16GB is the smallest plan you can order it on, and it is also the comfortable experience.

Once you pay, your machine is prepared, and the moment it is ready your server pulls the latest ARK build from Steam and starts on its own. There is nothing to set up first.

> [!note] The first install is long — the game is close to 11GB, and the first start then takes a few extra minutes to build the map. Follow all of it from the Console tab.

@[open](console)

## Join the game

:::when server.address
Copy your server address:

@[field](server.address)

Then, inside ARK:

1. From the main menu hit **Join ARK**
2. Switch the filter to **Unofficial** and look for your server's name
3. Or faster: press **Tab** to open the console and type `open` followed by the address exactly as shown

:::else
Your server is still being prepared and has no address yet — it shows up here the moment the install finishes.
:::

> [!note] The name in the browser is the one in your settings. If it does not show up under Unofficial, the `open` command gets you straight in with no searching.

## Make yourself admin

The admin password is generated for you on the first start, and it lives in the **Controls** tab.

1. Open the Controls tab and copy the **admin password**
2. Join your server and press **Tab** to open the console
3. Type `EnableCheats` followed by the password, then Enter

@[open](panel:controls)

Every admin command works from then on. To become admin without typing a password each time, add your account id to the admins file — that is covered in "Admin and commands".

> [!warning] The admin password is also the RCON password. Share it only with people you trust, and rotate it from the same tab the moment it leaks.

## Pick your map and your slots

The **Launch** tab is where the map, the slot count and crossplay live.

- The default map is **The Island** — the right start if this is your first ARK
- Every map keeps a world of its own, so switching between them deletes nothing
- Fewer slots means more memory per player — keep the number close to how many friends actually play

@[open](panel:launch)

> [!note] Every change in the Launch tab needs a restart, and we do it for you when you apply.

## Your first week

- Mods come from CurseForge and your server downloads them itself — see "Mods from CurseForge"
- Your world is covered — we take backups automatically, and you can take one yourself before any big change
- ARK ships updates often, and your server pulls the latest build from Steam on every start
- If things get laggy, the first thing to try is **Respawn the wild dinos** from the Controls tab

@[open](backups)

> [!warning] After a major Studio Wildcard update, players cannot join until your server runs the same build. A restart is all it takes.
