import {LitElement, html, map, ifDefined} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
// import {LitElement, html, map, ifDefined} from './lit.js';


export class App extends LitElement {
    static properties = {
        _players: { state: true },
        _socket: {},
    }

    constructor() {
        super();
        this._socket = new WebSocket('ws://localhost:3000/ws');

        this._socket.addEventListener('open', (event) => {
            // this._socket.send('App opens websocket');
        });

        this.addEventListener('clock_increment', (event) => {
            this._socket.send('App increments clock');
        });

        this.addEventListener('add_clock', (event) => {
            console.log("heard add_clock");
            console.log(event.detail);
            this._socket.send(event.detail);
        });

        this._socket.addEventListener('message', (event) => {
            this.handle_server_message(event);
        });

        this._players = {};
    };

    handle_server_message(event) {
        const update = JSON.parse(event.data);

        if (update.Log) {
            console.log("INFO:", update.Log);
        }
        else if (update.FullSync) {
            console.log("Handling full sync....");
            console.log(update.FullSync)
            this._players = update.FullSync.players
            console.log(this._players)
        }
        else if (update.AllClocksUpdate) {
            const player_id = update.AllClocksUpdate[0];
            console.log("Updating clocks for player....", player_id);
            console.log(this._players)
            // this._players = update.FullSync.players
        }
        else if (update.PlayerUpdate) {
            console.log("Handling player update....");
            // this._players[update.PlayerUpdate[0]
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
            <button @click=${this.request_full_sync}>SYNC</button>
            <p> ${this.render_players(ifDefined(this._players))} </p>
        `;
    }
}

customElements.define('bitd-app', App);
