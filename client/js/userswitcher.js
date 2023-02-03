import {LitElement, html, map, css, ifDefined} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class App extends LitElement {
    static styles = css`
        select {
            background-color: var(--page-color);
            color: var(--text-color);
            border: 1px solid var(--text-color);
            border-radius: 2px;
            font-size: 0.95rem;
            min-width: 2rem;
        }
    `;

    static properties = {
        players: { type: Object }
    }

    constructor() {
        super();
    };

    render() {
        return html`
            i am: 
            <select id="userpicker">
                <option value=""></option>
            </select>
        `;
    }
}

customElements.define('bitd-userswitcher', App);
