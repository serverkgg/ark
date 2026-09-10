## The admin password

It is generated for you on the first start, and it lives in the **Controls** tab under "Admin access".

In game, press **Tab** to open the console and type `EnableCheats` followed by the password. Every admin command works from then on.

@[open](panel:controls)

> [!warning] This is also the RCON password. Share it only with people you trust, and rotate it from the same tab if it leaks — the new one goes live after a restart.

## Admin without a password

To make an account admin without typing the password every time, add its account id to the admins file — one id per line, and a restart after any edit.

@[open](files:ShooterGame/Saved/AllowedCheaterAccountIDs.txt)

Your own account id shows up in the players table once you have joined your server one time.

## Console commands

ARK's own console is RCON, so every line you type in the panel console reaches your server directly and its reply comes back to you.

See who is on right now:

@[command](ListPlayers)

Save your world before anything big:

@[command](SaveWorld)

@[open](console)

> [!note] You do not need to type `cheat` before a command in the panel console — we strip it if you do. ARK has hundreds of commands, and anything not in the list is sent through exactly as you wrote it.

## Kicks and bans

The players page kicks and bans in one click, and the account id is what the game acts on.

- A **kick** drops the player now, and they can walk straight back in
- A **ban** keeps the account out for good, and is lifted from the **Bans** table on the same players page

> [!note] ARK bans by account id, so a ban keeps holding even if the player changes their name.

## The whitelist

To close your server to a specific group of people:

1. Turn on **Exclusive join** in the Launch tab
2. Add the account ids to the whitelist file, one per line
3. Restart your server

@[open](files:ShooterGame/Binaries/Win64/PlayersExclusiveJoinList.txt)

> [!danger] Never turn exclusive join on with an empty list — nobody gets into your server, including you.
