import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

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
        id: {},
        player_id: {},
        task: {},
        slices: {},
        progress: {},
    }

    constructor() {
        super();
        this.progress = 4;
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

    render() {
        return html`
            <div class="clock">
                <div class="pieces">
                    ${this.progress}&thinsp;/&thinsp;${this.slices}
                </div>
                <div class="controls">
                    [&thinsp;<a @click=${this._decrement}>&minus;</a> / <a @click=${this._increment}>+</a>&thinsp;]
                </div>
                <div class="name">
                    ${this.task}
                </div>
                <div class="del">
                    <a @click=${this._delete}>&#x2715;</a>
                </div>
            </div>
        `;
    }
}

customElements.define('bitd-clock', Clock);
