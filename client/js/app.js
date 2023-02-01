import {LitElement, html, map, css, ifDefined} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class App extends LitElement {
    static styles = css`
        .playername {
            font-size: 1.5rem;
            margin: 1rem 0;
        }
        .syncbtn {
            margin-top: 1.5rem;
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
        .topbar a:not(:first-child) {
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
        return map(Object.entries(players), this.render_clocks_of)
    }

    render() {
        return html`
            <div class="topbar">
                <a href="#!">⏱ clocks</a>
                <a href="#!">🗺 map</a>
                <a href="#!">📝 notes</a>
            </div>
            ${this.render_players(ifDefined(this._players))}
            <button class="syncbtn" @click=${this.request_full_sync}>force sync</button>
        `;
    }
}

customElements.define('bitd-app', App);
