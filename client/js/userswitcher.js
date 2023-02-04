import {LitElement, html, map, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

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
        players: { type: Object },
    }

    constructor() {
        super();
    };

    _select_player(event) {
        const user = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelector("#sidebar bitd-userswitcher").shadowRoot.getElementById("userpicker").value;
        this.dispatchEvent(new CustomEvent("select_player", {detail: user, bubbles: true, composed: true }));
    };

    render() {
        if (this.players == null) {
            return html``;
        } else {
            return html`
                i am:
                <select @change="${this._select_player}" id="userpicker">
                    ${map(Object.entries(this.players), (p) => {
                        if (p[1].name != "world") {
                            return html`
                                <option value="${p[0]}">${p[1].name}</option>
                            `;
                        }
                    })}
                </select>
            `;
        }
    }
}

customElements.define('bitd-userswitcher', App);
