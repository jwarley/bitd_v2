import {LitElement, html} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js';
// import {LitElement, html, map, ifDefined} from './lit.js';

export class Clock extends LitElement {
    static properties = {
        task: {},
        slices: {},
        progress: {},
    }

    constructor() {
        super();
        this.progress = 4;
    }

    _increment() {
        const e = new CustomEvent('clock_increment', {bubbles: true, composed: true});
        this.dispatchEvent(e)
    }

    render() {
        return html`
        <p>${this.task}</p>
        <p>Progress: ${this.progress}/${this.slices}</p>
        <button @click=${this._increment}>Increment</button>
        `;
    }
}

customElements.define('bitd-clock', Clock);
