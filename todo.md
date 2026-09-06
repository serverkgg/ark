# ARK: Survival Ascended: not started

Windows-only server (Proton-GE), out of scope by decision on 2026-09-06. Nitrado's hosting exclusivity was reviewed and dismissed: competitors sell it, Serverk sells it, not to be raised again.

## Research to keep

- Steam app 2430930, anonymous SteamCMD with `+@sSteamCmdForcePlatformType windows`; about 11 GiB installed, 12 to 16 GB RAM per map. Proton-GE, no Xvfb; the `protonCommand` helper in `@serverkgg/bridge/wine` produces the `env` prefix (`STEAM_COMPAT_CLIENT_INSTALL_PATH`, `STEAM_COMPAT_DATA_PATH`).
- Start `ArkAscendedServer.exe TheIsland_WP?listen?SessionName=..?Port=7777?RCONPort=27020?ServerPassword=..?ServerAdminPassword=.. -WinLiveMaxPlayers=70 -mods=1,2 -servergamelog -oldconsole`; `?ServerAdminPassword` must be last. Port `game` udp 7777 mirrored (dev block 9000); RCON loopback 27020; the server browser is EOS, so counts come from RCON `ListPlayers`, not A2S.
- Control: Source RCON (`ListPlayers`, `KickPlayer`, `BanPlayer`, `Broadcast`, `SaveWorld`, `DoExit`) through `context.rcon.source`.
- Config `ShooterGame/Saved/Config/WindowsServer/GameUserSettings.ini` and `Game.ini` through `context.codec.ini`; saves under `ShooterGame/Saved/SavedArks/<map>/`.
- Mods: CurseForge, the server self-downloads `-mods=` ids; the catalog through `createCurseforgeCatalog` in `@serverkgg/bridge/catalogs` once ASA's CurseForge game id is confirmed.
- Host needs `vm.max_map_count` at least 262144 (already in `agent.sh`); `container.runtime.platform: wine`, `shmMb` 512 or more, `pidsLimit` 2048, `installBudgetMinutes` 60 or more; `backup.only` limited to `ShooterGame/Saved/**`.
