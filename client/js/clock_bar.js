import {LitElement, html, map, css} from './lit-all.min.js';

export class ClockBar extends LitElement {
    static styles = css`
        bitd-clock {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .plusbutton {
            text-align: center;
            display: flex;
            justify-content: center;
            flex-direction: column;
            padding: 0.25rem 0.5rem;
            font-size: 1.5rem;
            color: var(--text-color);
            background-color: var(--button-color);
            cursor: pointer;
            z-index: 99;
            margin-right: 0.5rem;
        }
        .clockholder {
            display: flex;
            width: 100%;
        }
    `;

    static properties = {
        clocks: { type: Object },
        player_id: { type: String },
        clocktype: { type: String },
    }

    constructor() {
        super();
    }

    _add_clock() {
        let task = window.prompt("What is the clock for?");
        if (task == null) return;
        task = task.trim();
        if (task === "") return;

        let slices = parseInt(window.prompt("How many segments?", "4"));
        if (slices > 50) {
            window.alert("Can't make a clock with over 50 segments!");
        }
        else if (slices < 1) {
            window.alert("Can't make a clock with less than 1 segment!");
        }
        else {
            slices = slices == NaN ? 4 : slices;
            const message = JSON.stringify({ "AddClock": [this.player_id, task, slices] });
            this.dispatchEvent(new CustomEvent("add_clock", {detail: message, bubbles: true, composed: true }));
        }
    }

    render() {
        const clocks_ordered = Object.keys(this.clocks).sort().reduce(
            (obj, key) => {
                    obj[key] = this.clocks[key];
                    return obj;
                },
                {}
        );

        const worldclock_override = this.clocktype == "world" ? ' --clock-color: var(--world-clock-color);' : null;

        return html`
        <div style="display: flex;${worldclock_override}">
            <div class="plusbutton" @click="${this._add_clock}">+</div>
            <div class="clockholder">
                ${map(Object.entries(clocks_ordered), (c) => {
                    const id = c[0];
                    const clock = c[1];
                    return html`
                        <bitd-clock id="${id}" player_id="${this.player_id}" task="${clock.task}" progress="${clock.progress}" slices="${clock.slices}"></bitd-clock>
                    `})}
            </div>
        </div>
        `;
    }
}

customElements.define('bitd-clock-bar', ClockBar);
