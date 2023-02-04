import {LitElement, html, map, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class App extends LitElement {
    static styles = css`
        select {
            color: var(--text-color);
            border: 1px solid transparent;
            border-radius: 2px;
            font-size: 2rem;
            text-align: center;
            text-align: -webkit-center;
            width: 95%;
            -webkit-appearance: none;
            -moz-appearance: none;
            background: transparent;
            padding: 0 1rem;
            direction rtl;
        }
        select:focus-visible {
            outline: 0;
        }
    `;

    static properties = {
        players: { type: Object },
    }

    constructor() {
        super();
    }

    _select_player(event) {
        const sidebar = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot;
        const userpicker = sidebar.querySelector("#sidebar bitd-userswitcher").shadowRoot.getElementById("userpicker");
        this.dispatchEvent(new CustomEvent("select_player", {detail: userpicker.value, bubbles: true, composed: true }));

         // needed for some browsers like safari
        for (var i = 0; i < userpicker.length; i++) {
            if (userpicker.options[i].value == "select player...") {
                userpicker.remove(i);
            }
        }

        // re-style to show it's been selected
        const topsection = sidebar.querySelector("#sidebar .section");
        topsection.style.borderStyle = "groove";
    }

    render() {
        if (this.players == null) {
            return html``;
        } else {
            return html`
                <select @change="${this._select_player}" id="userpicker">
                    <option disabled selected>select player...</option>
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
