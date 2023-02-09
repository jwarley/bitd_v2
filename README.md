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

## Use

### Basic setup & Clocks tab

The main screen of the HUD displays a game's [progress clocks](https://bladesinthedark.com/progress-clocks), grouped by player. Left clicking a clock adds a segment to it; right clicking removes a segment. All clocks are public and changes are immediately visible to all players.

The following functions can be run from your browser's [Console](https://developer.chrome.com/docs/devtools/console/javascript/) to set up a game:

* **`add_player("Maile")`**, to add a player named `Maile`.
  * Adding a player named `world` will create a section for world clocks that are styled differently from player clocks and always displayed at the top of the list.
* **`remove_player("uuid")`**, to remove a player with the [ID](https://en.wikipedia.org/wiki/Universally_unique_identifier#Format) `uuid`.
  * A player's ID can be copied to the clipboard by right-clicking the player name, above their list of clocks.
* **`rename_player("uuid", "Ezra")`**, to change a player with ID `uuid` to be named `Ezra`.
  * ~~A player can also be renamed by double-clicking the player name.~~

After adding players to a game, select your role using the user switcher at the top of the sidebar and begin playing.

### Map tab

~~Left click a point on the map to add a landmark there. Click on an existing landmark to rename it or change its color.~~

The map image can be customized in `client/js/map.js`, along with other settings.

### Notes tab

~~Notes can be created, sorted, filtered, and classified into the following categories:~~
 * ...
<!--   * misc
  * person
  * place
  * boogins (enemies)
  * item
  * concept
  * event -->

### Sidebar

Various functionalities are available through the sidebar: the user switcher, up to 6 rollable dice, a private/personal memo pad, a toggle for dark mode and hiding the sidebar, and other tools. All information is preserved between sessions and saved in the browser's [localStorage](https://developer.chrome.com/docs/devtools/storage/localstorage/).

## License

... to add