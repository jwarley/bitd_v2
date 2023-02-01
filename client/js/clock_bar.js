import {LitElement, html, map, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class ClockBar extends LitElement {
    static styles = css`
        .plusbutton {
            text-align: center;
            display: flex;
            justify-content: center;
            flex-direction: column;
            padding: 0.25rem 0.5rem;
            font-size: 1.5rem;
            color: var(--text-color);
            background-color: var(--button-color);
        }
        .clockholder {
            display: flex;
            width: 100%;
        }
    `;

    static properties = {
        clocks: { type: Object },
        player_id: { type: String },
    }

    constructor() {
        super();
    }

    _add_clock() {
        const task = window.prompt("What is the clock for?");
        let slices = parseInt(window.prompt("How many slices?", "4"));
        if (slices > 50) {
            window.alert("Can't make a clock with over 50 slices!");
        }
        else if (slices < 1) {
            window.alert("Can't make a clock with less than 1 slice!");
        }
        else {
            slices = slices == NaN ? 4 : slices;
            const message = JSON.stringify({ "AddClock": [this.player_id, task, slices] });
            this.dispatchEvent(new CustomEvent("add_clock", {detail: message, bubbles: true, composed: true }));
        }
    }

    render() {
        return html`
        <div style="display: flex;">
            <div class="plusbutton" @click=${this._add_clock}>+</div>
            <div class="clockholder">
                ${map(Object.entries(this.clocks), (c) => {
                    const id = c[0];
                    const clock = c[1];
                    return html`
                        <bitd-clock id=${id} player_id=${this.player_id} task=${clock.task} progress=${clock.progress} slices=${clock.slices}></bitd-clock>
                    `})}
            </div>
        </div>
        `;
    }
}

customElements.define('bitd-clock-bar', ClockBar);
