# blades-hud

An online dashboard/[HUD](https://en.wikipedia.org/wiki/Head-up_display) to play John Harper's *[Blades in the Dark](https://en.wikipedia.org/wiki/Blades_in_the_Dark)* TTRPG remotely, written from scratch.

## Testing & deployment

1. Install [Rust](https://www.rust-lang.org/tools/install) and clone the repo.
2. Run the server:
    ```fish
    $ cd server/ && cargo run
    ```
2. Browse to [http://localhost:3000/](http://localhost:3000/) (in multiple tabs if you want to test syncing)

For usage online (for an actual game/campaign), install Rust on a web server, clone the repo & upload it there, create a .sh file containing the command above, and set it up to run as a daemon process.

### Functions

To add a player, open your browser's [Console](https://developer.chrome.com/docs/devtools/console/javascript/) and type **`add_player("name")`**. Adding a player named `world` will create a section for world clocks that are styled differently from player clocks and always displayed at the top of the list.

Removing and renaming players will be supported soon, and currently must be done by editing the .toml files in `server/players/`.