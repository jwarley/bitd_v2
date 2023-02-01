import {LitElement, html, css, svg, map} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class Clock extends LitElement {
    static styles = css`
        .clock {
            text-align: center;
            margin: 0;
            padding: 0.5em;
        }
        p {
            margin: 0;
        }
        .pieces {
            margin: 1em;
            font-weight: bold;
            color: red;
        }
        .name {
            margin: 0.75rem 0 1rem;
        }
        .controls a {
            cursor: pointer;
            font-weight: bold;
        }
        .del a {
            margin: 5px;
            cursor: pointer;
            color: var(--text-color);
            background-color: var(--gray-button-color);
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
            border: 1px solid black;
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
            <circle cx="0" cy="0" r="1" fill="none" stroke="white" stroke-width=".03"/>
            ${map([...Array(this.slices).keys()], (i) => {
                return svg`<line
                    x1="0"
                    y1="0"
                    x2="${Math.cos((i * theta) - (Math.PI / 2))}"
                    y2="${Math.sin((i * theta) - (Math.PI / 2))}"
                    stroke="white" stroke-width=".03"
                />`
            })}
        `;

        return html`
            <div class="clock">
                <div class="pieces">
                    ${this.progress}&thinsp;/&thinsp;${this.slices}
                </div>
                <svg viewBox="-1.25 -1.25 2.5 2.5" height="100%" width="100%">${clock_face}</svg>
                <div class="controls">
                    [&thinsp;<a @click=${this._decrement}>&minus;</a> / <a @click=${this._increment}>+</a>&thinsp;]
                </div>
                <div class="name">
                    ${this.task}
                </div>
                ${del_button}
            </div>
        `;
    }
}

customElements.define('bitd-clock', Clock);
