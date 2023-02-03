import {LitElement, html, map, css, ifDefined} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class App extends LitElement {
    static styles = css`
        *:nth-of-type(1) {
            --clock-color: var(--world-clock-color);
        }
        .playername {
            font-size: 1.5rem;
            margin: 1rem 0;
        }
        .syncbtn {
            position: fixed;
            top: 5px;
            right: 5px;
            font-size: 0.75rem;
            color: var(--page-color);
            z-index: 99;
            cursor: pointer;
            font-weight: bold;
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
        _players: { state: true },
        _socket: {},
    }

    constructor() {
        super();
        this._socket = new WebSocket('ws://localhost:3000/ws');

        this._socket.addEventListener('open', (event) => {
            this.request_full_sync();
        });

        this.addEventListener('full_sync', (event) => {
            this.request_full_sync()
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

        this._socket.addEventListener('message', (event) => {
            this.handle_server_message(event);
        });

        this._players = {};
    };

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
    };

    request_full_sync() {
        this._socket.send(JSON.stringify("FullSync"));
    }

    render_clocks_of(player_tuple) {
        const id = player_tuple[0]
        const player = player_tuple[1]
        return html`
            <div class="playername">${player.name}</div>
            <bitd-clock-bar player_id=${id} clocks=${JSON.stringify(player.clocks)}></bitd-clock-bar>
        `;
    }

    render_players(players) {
        let allplayers = Object.entries(players);
        let player_list = [];
        let world_clock = [];

        for (const p of allplayers) {
            if (p[1].name == "world") {
                world_clock.push(p)
            } else {
                player_list.push(p);
            }
        }

        // sort based on who has the most clocks
        function player_sort(a, b) {
            const a_length = Object.keys(a[1].clocks).length;
            const b_length = Object.keys(b[1].clocks).length;
            return b_length - a_length; // negative: a before b; positive: b before a
        }
        player_list.sort(function(a, b){return player_sort(a, b)});

        const player_order = world_clock.concat(player_list);

        return map(player_order, this.render_clocks_of);
    }

    render() {
        return html`
            <div class="topbar">
                <a href="#!">⏱ clocks</a>
                <a class="disabled" href="#!">🗺 map</a>
                <a class="disabled" href="#!">📝 notes</a>
            </div>
            <div class="clocks">
                ${this.render_players(ifDefined(this._players))}
            </div>
            <a class="syncbtn" @click=${this.request_full_sync}>force sync</a>
        `;
    }
}

customElements.define('bitd-app', App);
