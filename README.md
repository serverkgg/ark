# آرك سيرفايفل أسندد (ARK: Survival Ascended)

حزمة آرك سيرفايفل أسندد على منصة سيرفرك (`serverk.gg`). هذا المستودع فيه كل شيء اللعبة تحتاجه عشان تشتغل على المنصة: ملف التعريف `serverk.yml`، الـ driver اللي يدير السيرفر، صورة الدوكر، والشروحات.

The ARK: Survival Ascended game package for the Serverk platform (`serverk.gg`). This repo holds everything the game needs to run on the platform: the `serverk.yml` manifest, the driver that manages the server, the Docker image, and the guides.

## Layout

- `serverk.yml` — the game manifest: metadata, resources, ports (`7777` udp mirrored for the game, `27020` tcp for RCON, published only while remote access is on), backup and reset rules, the presence shape, the notable files, and the guides.
- `src/` — the bridge driver: install (SteamCMD app `2430930`, Windows depot), lifecycle, events, query, backup, announce, terminal, and the panel modules.
- `image/Dockerfile` — the runtime image (Ubuntu 24.04, SteamCMD, GE-Proton, Xvfb); the compiled bridge binary is its entrypoint.
- `image/ark-start` — the wrapper the driver's command starts with.
- `assets/` — logo and banner (webp).
- `guides/` — player guides in Arabic and English.

## How a server runs

SteamCMD installs app `2430930` anonymously with `SteamcmdPlatform.Windows` — ASA ships no Linux server binary. The Windows depot is about **11 GiB**, so the first install is long and every later boot is a delta check; a full `validate` pass only runs while a game root is missing.

The server is `ShooterGame/Binaries/Win64/ArkAscendedServer.exe`, started through `/opt/serverk/ark-start` and then GE-Proton. The launch string is `<Map>?listen?SessionName=…?RCONPort=27020?RCONEnabled=True` followed by the flags (`-Port`, `-WinLiveMaxPlayers`, `-mods=`, `-servergamelog`, `-oldconsole`, `-nosteam`, and the crossplay, BattlEye and exclusive-join toggles). The game port rides `-Port=<n>` rather than the map string — the engine ignores a `?Port=` there and keeps listening on its default 7777.

**No password ever rides argv.** The engine echoes its own command line into `ShooterGame.log`, and the wrapper tails that log into the customer's console, so `ServerPassword` and `ServerAdminPassword` are carried only in `[ServerSettings]` of `GameUserSettings.ini`, written by `applyControlConfig` and the settings module before every start.

Measured on the dev stack, 2026-09-10, first boot on a 12 GB container: install 5.7 minutes, ready about 1 minute after that, 13.2 GB on disk, game RSS 10.3 GB at idle with the container at 11.6 GiB of its 12 GiB limit, 3 MB of `/dev/shm`, 169 pids at peak. Twelve gigabytes leaves no headroom, so `resources.minMemoryMb` is 16 GB.

## The Proton note

ASA is the first Serverk game whose manifest declares `container.runtime.platform: wine`. Three things make the headless boot work, and none of them replaces the others:

- **GE-Proton is pinned and checksummed** (`GE-Proton10-34`, sha512-verified, unpacked into `/opt/proton` in its own image layer). An unpinned Proton is a silent game-breaking change on every rebuild.
- **The engine refuses a headless boot without an SDL driver it accepts.** The driver passes `SDL_VIDEODRIVER=dummy`, `SDL_AUDIODRIVER=dummy`, `XDG_SESSION_TYPE=headless` and `XDG_RUNTIME_DIR=/tmp/serverk-xdg` through `protonCommand`, and the wrapper runs the game under `xvfb-run -a` on top.
- **ARK writes nothing useful to stdout under Proton.** The wrapper truncates `ShooterGame/Saved/Logs/ShooterGame.log` and tails it with `-F` into stdout before exec'ing the game, which is where the bridge reads the ready line, the events and the console output from. The tail stays inside the process group and dies with the game.

BattlEye cannot run under Proton at all. The launch toggle exists for the day the engine can, and both the panel help and its warning say so — switching it on locks players out.

## The control channel

ARK speaks Source RCON on container port `27020`, driven through `context.rcon.source`. `mirroredIds` stays on: the game pushes unsolicited keep-alive frames, and turning the id filter off would let one of them answer the command in flight.

`ServerAdminPassword` **is** the RCON password. It lives in the install stamp as `adminPassword`, the value the running process was started with. Rotating from the panel stores the new one as `adminPasswordNext`; the boot path promotes it and writes it into `GameUserSettings.ini` before the process starts, so the panel and any external tool keep working on the old password until the restart. The shared card, toggle and copy come from `createRconAccess` and `rconAccessSections` in `@serverkgg/bridge/rcon`; the `rcon` manifest port is what the **Remote access** toggle (`RCON_EXPOSED`) publishes.

`ListPlayers`, `KickPlayer`, `BanPlayer`, `UnbanPlayer`, `ServerChat`, `Broadcast`, `ServerChatTo`, `SaveWorld`, `DoExit`, `DestroyWildDinos`, `GetGameLog` and `GetChat` are the commands the panel drives. The panel console is the game's own console, so any command without a handler is sent through exactly as it was typed, with a leading `cheat` stripped.

## Settings and the file the game rewrites

ARK loads `ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini` at start and writes it back **from memory** on every shutdown, so an edit made while the server is up is thrown away. The panel writes the file immediately — a stopped server is then correct at once — and, while the server is running, also parks the same patch in the install stamp under `settingsPending`. The boot path replays it after the previous process finished rewriting the file and before the next one reads it, and `settings.read` lays the parked values over the file so the panel never shows a rolled-back value.

`Game.ini` carries the breeding and engram overrides. It legitimately repeats the same key, so the codec only ever merges the keys the panel owns.

## Mods

Mods come from CurseForge (game id `83374`). Nothing is downloaded by the driver: the enabled ids are staged in the `.serverk-mods.json` sidecar, handed to the game as `-mods=` on the launch string, and the server fetches them itself into `ShooterGame/Binaries/Win64/ShooterGame/Mods/83374/<mod id>_<file id>/` on the next start. The catalog needs `CURSEFORGE_API_KEY`; without it search is off and the **Load order** table's add-by-id is the only way in.

## Develop

Everything runs on [Bun](https://bun.sh):

```sh
bun install
bun run check
bun run tsc
bun run test
bun run validate
bun run compile
```

`validate` checks the manifest, assets, and driver wiring with the exact validation the platform runs at publish. `compile` produces `dist/bridge`, an amd64 binary — serverk publishes game images for `linux/amd64` only.

The `.githooks/pre-commit` hook is the gate: it runs `fix`, `tsc`, `test`, `validate`, and `serverk-bridge schema --check` on every commit. `bun install` wires it up through the `prepare` script.

The driver is built on [`@serverkgg/bridge`](https://www.npmjs.com/package/@serverkgg/bridge). `postinstall` runs `serverk-bridge link`, which points `node_modules/@serverkgg/bridge` at the local `../serverk/modules/bridge` checkout — never commit a `file:` dependency.

## Contribute

- افتح issue لأي مشكلة أو اقتراح — بالعربي أو بالإنجليزي، كلها مرحّب فيها.
- Run `bun run check`, `bun run tsc`, `bun run test` and `bun run validate` before you open a pull request — the same checks the pre-commit hook runs.
- Releases are done by the Serverk team through the platform's central release pipeline; merged changes ride the next release.

## Arabic copy

الشروحات ونصوص اللوحة عربية أولًا. أي نص جديد يمشي على نفس الأسلوب: خليجي أبيض، جمل قصيرة، وكلمات اللاعبين زي «سيرفر» و«بنق» و«مود».
