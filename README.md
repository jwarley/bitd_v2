# blades-hud (v2)

A [HUD](https://en.wikipedia.org/wiki/Head-up_display)-like dashboard and party info tracker for playing John Harper's *[Blades in the Dark](https://en.wikipedia.org/wiki/Blades_in_the_Dark)* remotely.

## Testing & deployment

1. Install [Rust](https://www.rust-lang.org/tools/install) and clone the repo.
2. Run the server:
    ```fish
    $ cd server/ && cargo run
    ```
2. Browse to [http://localhost:3000/](http://localhost:3000/) (in multiple tabs if you want to test syncing)

For usage online (for an actual game/campaign), install Rust on a web server, clone the repo & upload it there, create a .sh file containing the command above, and set it up to run as a daemon process.

## Use

### Clocks tab & basic setup

The main screen of the HUD displays a game's [progress clocks](https://bladesinthedark.com/progress-clocks), grouped by player. Left clicking a clock ticks a segment on it; right clicking removes a segment. All clocks are public and changes are immediately visible to all players.

The following functions can be run from your browser's [Console](https://developer.chrome.com/docs/devtools/console/javascript/) to set up a game:

* **`add_player("name")`**, to add a player named `name`.
  * Adding a player named `world` will create a section for world clocks that are styled differently from player clocks and which always display at the top.
* **`remove_player("uuid")`**, to remove a player with the ID `uuid`.
  * A player's ID can be copied to the clipboard by right-clicking their name (above their list of clocks).
* **`rename_player("uuid", "newname")`**, to change a player with ID `uuid` to be named `newname`.
  * A player can also be renamed by double-clicking their name.

After adding players to a game, select your role using the user switcher in the top right and begin playing.

### Map tab

~~Left click a point on the map to add a landmark there. Click on an existing landmark to rename it or change its color.~~

The map image can be customized in `client/js/map.js`, along with other settings.

### Notes tab

Notes can be sorted into and filtered by the following categories: `misc`, `person`, `place`, `boogins` (enemies), `item`, `concept`, `event`.

After creation, note titles and descriptions can be edited simply by clicking on the existing text.

### Sidebar

Various functionalities are available through the sidebar: the user switcher, rollable dice, a private/personal memo pad, toggles for dark mode and hiding the sidebar, and other tools. All information is preserved between sessions and saved in the browser's [localStorage](https://developer.chrome.com/docs/devtools/storage/localstorage/).

## License

[GPLv3](https://www.gnu.org/licenses/gpl-3.0.html)