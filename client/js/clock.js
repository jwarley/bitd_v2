import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';

export class Clock extends LitElement {
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

    render() {
        return html`
        <p>${this.task}</p>
        <p>Progress: ${this.progress}/${this.slices}</p>
        <button @click=${this._increment}>Increment</button>
        <button @click=${this._decrement}>Decrement</button>
        `;
    }
}

customElements.define('bitd-clock', Clock);
