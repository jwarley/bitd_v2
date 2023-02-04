import {LitElement, html, map, css, ifDefined} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class App extends LitElement {
    static styles = css`
        #main {
            display: flex;
            flex-direction: column;
            width: calc(80% - 1rem);
            padding: 0.5rem;
        }
        bitd-clock-bar:nth-of-type(1) {
            --clock-color: var(--world-clock-color);
        }
        .playername {
            font-size: 1.5rem;
            margin: 1rem 0;
        }
        .playername:first-child {
            font-variant: small-caps;
        }
        .topbar {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
        }
        .topbar a {
            color: #000;
            text-align: center;
            font-size: 1.5rem;
            text-decoration: none;
            color: var(--text-color);
            background-color: var(--button-color);
            margin: 0;
            padding: 0.25rem 0.25rem;
            flex: 1 1 auto;
        }
        .topbar a:not(:first-child):not(:last-child) {
            margin: 0 0.5rem;
        }
        .topbar a.disabled {
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
    }

    handle_server_message(event) {
        const update = JSON.parse(event.data);

        if (update.type == "Log") {
            console.log("INFO:", update);
        }
        else if (update.type == "FullUpdate") {
            let {type: _, ...players} = update
            this._players = players
        }
        else if (update.type == "ClockUpdate") {
            this._players[update.player_id].clocks[update.clock_id] = update.clock;
            this.requestUpdate();
        }
        else if (update.type == "DeleteClockUpdate") {
            delete this._players[update.player_id].clocks[update.clock_id];
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

    _render_clocks_of(player_tuple) {
        const id = player_tuple[0]
        const player = player_tuple[1]
        return html`
            <div class="playername">${player.name}</div>
            <bitd-clock-bar player_id="${id}" clocks="${JSON.stringify(player.clocks)}"></bitd-clock-bar>
        `;
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

    render() {
        return html`
            <div id="main">
                <div class="topbar">
                    <a href="#!">⏱ clocks</a>
                    <a class="disabled" href="#!">🗺 map</a>
                    <a class="disabled" href="#!">📝 notes</a>
                </div>
                <div class="clocks">
                    ${this._render_players(this._players)}
                </div>
            </div>

            <bitd-sidebar players="${JSON.stringify(this._players)}""></bitd-sidebar>
        `;
    }
}

customElements.define('bitd-app', App);
