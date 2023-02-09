import {LitElement, html, map, css} from './lit-all.min.js';
import * as map_tab from "./map.js";

export class App extends LitElement {
    static styles = css`
        #main {
            display: flex;
            flex-direction: column;
            width: calc(80% - 1rem);
            height: 100%;
            padding: 0.5rem;
        }
        .playername:first-child {
            font-size: 1.5rem;
            margin: calc(1rem - 4px) 0 1rem 0;
        }
        .playername:not(:first-child) {
            font-size: 1.5rem;
            margin: 1rem 0;
        }
        .playername[data-clocktype="world"] {
            font-variant: small-caps;
        }
        #topbar {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
        }
        #topbar a {
            color: #000;
            flex: 1 1 auto;
            margin: 0;
            padding: 0.25rem 0.25rem;
            color: var(--text-color);
            background-color: var(--button-color);
            text-align: center;
            font-size: 1.5rem;
            text-decoration: none;
            cursor: pointer;
        }
        #topbar a:not(:first-child):not(:last-child) {
            margin: 0 0.5rem;
        }
        #topbar a.disabled {
            color: var(--gray-text-color);
            text-decoration: line-through;
            cursor: not-allowed;
            filter: grayscale(100%);
            -webkit-filter: grayscale(100%);
        }
        button {
            background-color: var(--page-color);
            color: var(--text-color);
            border: 1px solid var(--text-color);
            border-radius: 2px;
            padding: 3px 8px;
        }

        #map {
            display: none;
            width: 100%;
        }
        #map img {
            display: block;
            margin: 0.5rem 0;
            width: 100%;
            cursor: crosshair;
        }
        #notes {
            display: block;
            margin-top: 0.5rem;
        }
    `;

    static properties = {
        _players: { type: Object, state: true },
        _current_player_uuid: { type: String, state: true },
        _socket: {},
    }

    constructor() {
        super();
        this._socket = new WebSocket('ws://localhost:3000/ws');

        this._socket.addEventListener('open', (event) => {
            this._request_full_sync();
            const tab_num = localStorage.getItem("last_tab") || 1;
            this._show_tab(tab_num);
        });

        this.addEventListener('full_sync', (event) => {
            this._request_full_sync()
        });

        this.addEventListener('add_clock', (event) => {
            this._socket.send(event.detail);
        });

        this.addEventListener('delete_clock', (event) => {
            this._socket.send(event.detail);
        });

        this.addEventListener('increment_clock', (event) => {
            this._socket.send(event.detail);
        });

        this.addEventListener('decrement_clock', (event) => {
            this._socket.send(event.detail);
        });

        this.addEventListener('select_player', (event) => {
            this._current_player_uuid = event.detail;
        });

        this._socket.addEventListener('message', (event) => {
            this.handle_server_message(event);
        });

        // until a user selects, whoever has most clocks will be on top (besides world)
        this._current_player_uuid = "";

        // this is a great idea, do not email me
        window.add_player = (name) => {
            name = name.toString().trim();
            if (name == "") {
                console.log("Cannot add a player with a blank name.")
                return;
            }
            if (name.toLowerCase() == "world" &&
                Object.entries(this._players).filter((p) => {return p[1].name == "world"}).length > 0) {
                    console.log("World player already exists!");
                    return;
            }
            this._socket.send(JSON.stringify({ "AddPlayer": name }));
        }
        window.remove_player = (id) => {
            this._socket.send(JSON.stringify({ "RemovePlayer": id }));
        }
        window.rename_player = (id, name) => {
            name = name.toString().trim();
            if (name.toLowerCase() == "world" &&
                Object.entries(this._players).filter((p) => {return p[1].name == "world"}).length > 0) {
                    console.log("Look at me I'm so cool I'm gonna break the website LOL ok dude");
                    return;
            } else if (name == "") {
                console.log("Cannot use a blank name for a player.")
                return;
            }
            this._socket.send(JSON.stringify({ "RenamePlayer": [id, name] }));
        }
    }

    handle_server_message(event) {
        const update = JSON.parse(event.data);

        if (update.type == "Log") {
            console.log("INFO:", update);
        }
        else if (update.type == "Full") {
            let {type: _, ...players} = update
            this._players = players
        }
        else if (update.type == "Clock") {
            this._players[update.player_id].clocks[update.clock_id] = update.clock;
            this.requestUpdate();
        }
        else if (update.type == "DeleteClock") {
            delete this._players[update.player_id].clocks[update.clock_id];
            this.requestUpdate();
        }
        else if (update.type == "Player") {
            console.log("Added new player", update);
            this._players[update.player_id] = update.player_data;
            this.requestUpdate();
        }
        else if (update.type == "PlayerName") {
            console.log("Renaming player", update);
            this._players[update.player_id]["name"] = update.player_name;
            this.requestUpdate();
        }
        else if (update.type == "RemovePlayer") {
            delete this._players[update.player_id];
            this.requestUpdate();
        }
        else {
            console.log("Unknown update packet received:")
            console.log(update)
        }
    }

    _request_full_sync() {
        this._socket.send(JSON.stringify("FullSync"));
    }

    _render_clocks_of(player_tuple) { // why can we not use lit @events or other ${this._functions()} inside here???
        const id = player_tuple[0]
        const player = player_tuple[1]
        if (player.name == "world") {
            return html`
                <div
                    data-clocktype="world"
                    class="playername"
                    oncontextmenu="navigator.clipboard.writeText('${id}'); return false;">
                    ${player.name}
                </div>
                <bitd-clock-bar clocktype="world" player_id="${id}" clocks="${JSON.stringify(player.clocks)}"></bitd-clock-bar>
            `;
        }
        else {
            return html`
                <div
                    class="playername"
                    oncontextmenu="navigator.clipboard.writeText('${id}'); return false;">
                    ${player.name}
                </div>
                <bitd-clock-bar player_id="${id}" clocks="${JSON.stringify(player.clocks)}"></bitd-clock-bar>
            `;
        }
    }

    _player_sort(a, b) { // sort based on who has the most clocks
        let sort_value = 0;
        if (a[1].name == "world") { // world clock always first
            sort_value = Number.NEGATIVE_INFINITY;
        } else if (b[1].name == "world") {
            sort_value = Number.POSITIVE_INFINITY;
        } else if (a[0] == this._current_player_uuid) { // current player always second
            sort_value = Number.NEGATIVE_INFINITY;
        } else if (b[0] == this._current_player_uuid) {
            sort_value = Number.POSITIVE_INFINITY;
        } else {
            const a_length = Object.keys(a[1].clocks).length;
            const b_length = Object.keys(b[1].clocks).length;
            sort_value = b_length - a_length; // negative: a before b; positive: b before a
        }
        return sort_value;
    }

    _render_players(players) {
        if (players == null || this._current_player_uuid == null) {
            return html``
        }

        let allplayers = Object.entries(players);
        allplayers.sort(this._player_sort.bind(this));
        return map(allplayers, this._render_clocks_of);
    }

    _show_tab(num) {
        const root = document.querySelector("bitd-app").shadowRoot;

        const clocks = root.getElementById("clocks");
        clocks.style.display = num == 1 ? "block" : "none";

        const map = root.getElementById("map");
        map.style.display = num == 2 ? "block" : "none";

        const notes = root.getElementById("notes");
        notes.style.display = num == 3 ? "block" : "none";

        localStorage.setItem('last_tab', num);
    }

    render() {
        return html`
            <div id="main">
                <div id="topbar">
                    <a @click="${(e) => this._show_tab(1)}">&#9201; clocks</a>
                    <a @click="${(e) => this._show_tab(2)}">&#x1f5fa; map</a>
                    <a @click="${(e) => this._show_tab(3)}">&#x1f4dd; notes</a>
                </div>
                <div id="clocks">
                    ${this._render_players(this._players)}
                </div>
                <div id="map">
                    ${map_tab._render_map()}
                </div>
                <div id="notes">
                    <bitd-notes-list></bitd-notes-list>
                </div>
            </div>
            <bitd-sidebar players="${JSON.stringify(this._players)}"></bitd-sidebar>
        `;
    }
}

customElements.define('bitd-app', App);
