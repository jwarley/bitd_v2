import {LitElement, html, map} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';
// import {LitElement, html, map, ifDefined} from './lit.js';

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
        console.log("finished adding");
    }

    render() {
        return html`
            <button @click=${this._add_clock}>Add Clock</button>
            <ul>${map(this.clocks, (c) =>
                html`
                    <bitd-clock task=${c.task} progress=${c.progress} slices=${c.slices}></bitd-clock>
                `)}
            </ul>
        `;
    }
}

customElements.define('bitd-clock-bar', ClockBar);
