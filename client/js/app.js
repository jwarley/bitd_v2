import {LitElement, html, map, ifDefined} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class App extends LitElement {
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
            <b>${player.name}</b>
            <bitd-clock-bar player_id=${id} clocks=${JSON.stringify(player.clocks)}></bitd-clock-bar>
        `;
    }

    render_players(players) {
        return map(Object.entries(players), this.render_clocks_of)
    }

    render() {
        return html`
            <button @click=${this.request_full_sync}>Force Sync</button>
            <p> ${this.render_players(ifDefined(this._players))} </p>
        `;
    }
}

customElements.define('bitd-app', App);
