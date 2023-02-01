import {LitElement, html, css, svg, map} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class Clock extends LitElement {
    static styles = css`
        .clock {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 10rem;
        }
        .pieces {
            margin: 0.5rem;
            font-weight: bold;
            color: red;
        }
        .controls {
            color: var(--text-color);
        }
        .controls a {
            cursor: pointer;
            font-weight: bold;
        }
        .name {
            margin: 0.75rem 0 1rem;
            text-align: center;
        }
        .del {
            width: 1.5rem;
            height: 1.5rem;
            line-height: 1.5rem;
            text-align: center;
            cursor: pointer;
            color: var(--text-color);
            background-color: var(--gray-button-color);
            font-size: 0.875rem;
            border: 1px solid var(--text-color);
        }
        svg {
            overflow: visible;
            display: block;
        }
    `;

    static properties = {
        id: { type: String },
        player_id: { type: String },
        task: { type: String },
        slices: { type: Number },
        progress: { type: Number },
        _delete_unlocked: { state: true },
    }

    constructor() {
        super();
        this._delete_unlocked = false;
        this.onclick = (evt) => {
            this._increment();
        }
        this.oncontextmenu = (evt) => {
            this._decrement();
            return false;
        }
    }

    _increment() {
        const message = JSON.stringify({ "IncrementClock": [this.player_id, this.id] });
        this.dispatchEvent(new CustomEvent("increment_clock", {detail: message, bubbles: true, composed: true }));
    }

    _decrement() {
        const message = JSON.stringify({ "DecrementClock": [this.player_id, this.id] });
        this.dispatchEvent(new CustomEvent("decrement_clock", {detail: message, bubbles: true, composed: true }));
    }

    _delete() {
        this._delete_unlocked = false;
        const message = JSON.stringify({ "DeleteClock": [this.player_id, this.id] });
        this.dispatchEvent(new CustomEvent("delete_clock", {detail: message, bubbles: true, composed: true }));
    }

    _unlock_delete() {
        this._delete_unlocked = true;
        setTimeout(() => {
            this._delete_unlocked = false;
        }, 2000);
    }

    render() {
        // Construct the delete button depending on unlocked state
        const del_button = this._delete_unlocked ? html`
            <div class="del">
                <a @click=${this._delete}>?</a>
            </div>
        ` : html`
            <div class="del">
                <a @click=${this._unlock_delete}>&#x2715;</a>
            </div>
        `;

        // Render the clock face
        const theta = 2 * Math.PI / this.slices;
        const clock_face = svg`
            <circle cx="0" cy="0" r="1" fill="none" stroke="var(--text-color)" stroke-width="0.03"/>
            ${map([...Array(this.slices).keys()], (i) => {
                return svg`<line
                    x1="0"
                    y1="0"
                    x2="${Math.cos((i * theta) - (Math.PI / 2))}"
                    y2="${Math.sin((i * theta) - (Math.PI / 2))}"
                    stroke="var(--text-color)" stroke-width="0.03"
                />`
            })}
        `;

        return html`
            <div class="clock">
                <div class="pieces">
                    ${this.progress}&thinsp;/&thinsp;${this.slices}
                </div>
                <svg viewBox="-1.25 -1.25 2.5 2.5" height="100%" width="100%">${clock_face}</svg>
                <div class="name">
                    ${this.task}
                </div>
                ${del_button}
            </div>
        `;
    }
}

customElements.define('bitd-clock', Clock);
