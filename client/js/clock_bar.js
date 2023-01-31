import {LitElement, html, map} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class ClockBar extends LitElement {
    static properties = {
        clocks: { type: Object },
        player_id: {},
    }

    constructor() {
        super();
    }

    _add_clock() {
        const task = window.prompt("What is the clock for?");
        let slices = parseInt(window.prompt("How many slices?", "4"));
        slices = slices == NaN ? 4 : slices;
        const message = JSON.stringify({ "AddClock": [this.player_id, task, slices] });
        this.dispatchEvent(new CustomEvent("add_clock", {detail: message, bubbles: true, composed: true }));
    }

    _delete_clock(clock_id) {
        const message = JSON.stringify({ "DeleteClock": [this.player_id, clock_id] });
        this.dispatchEvent(new CustomEvent("delete_clock", {detail: message, bubbles: true, composed: true }));
    }

    render() {
        return html`
            <button @click=${this._add_clock}>Add Clock</button>
            <ul>${map(Object.entries(this.clocks), (c) => {
                const id = c[0];
                const clock = c[1];
                return html`
                    <bitd-clock id=${id} player_id=${this.player_id} task=${clock.task} progress=${clock.progress} slices=${clock.slices}></bitd-clock>
                    <button @click=${() => this._delete_clock(id)}>belpo</button>
                `})}
            </ul>
        `;
    }
}

customElements.define('bitd-clock-bar', ClockBar);
