import {LitElement, html, map, css, ifDefined} from './lit-all.min.js';

export class UserSwitcher extends LitElement {
    static styles = css`
        select {
            color: var(--text-color);
            border: 10px outset var(--highlight-color);
            font-size: 2rem;
            text-align: center;
            text-align: -webkit-center;
            width: 100%;
            padding: 0.5rem 0;
            -webkit-appearance: none;
            -moz-appearance: none;
            background: transparent;
            direction rtl;
        }
        select:focus-visible {
            outline: 0;
        }
        select.selected {
            border-style: groove;
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

        // save current player selection in localstorage
        localStorage.setItem('i_am', userpicker.value);

         // remove the dropdown text
        for (var i = 0; i < userpicker.length; i++) {
            if (userpicker.options[i].value == "select player...") {
                userpicker.remove(i);
                break;
            }
        }

        // re-style to show a selection has been made
        userpicker.style.borderStyle = "groove";
    }

    _user_selected(uuid) {
        if (localStorage.getItem("i_am") == uuid) {
            this.dispatchEvent(new CustomEvent("select_player", {detail: uuid, bubbles: true, composed: true }));
            return "selected";
        } else {
            return null;
        }
    }

    render() {
        if (this.players == null) {
            return html``;
        } else {
            const loaded_uuid = localStorage.getItem("i_am");
            const valid_player = Object.keys(this.players).includes(loaded_uuid) ? true : false;
            if (loaded_uuid && valid_player) { // don't render the "select player..." dropdown in the first place
                return html`
                    <select class="selected" @change="${this._select_player}" id="userpicker">
                        ${map(Object.entries(this.players), (p) => {
                            if (p[1].name != "world") { // 'selected' is a boolean attribute - don't render if it's not the one we want
                                return html`
                                    <option value="${p[0]}" selected="${ifDefined(this._user_selected(p[0]))}">${p[1].name}</option>
                                `;
                            }
                        })}
                    </select>
                `;
            } else {
                return html`
                    <select @change="${this._select_player}" id="userpicker">
                        <option disabled selected>select player...</option>
                        ${map(Object.entries(this.players), (p) => {
                            if (p[1].name != "world") { // we know none of the options should be pre-selected
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
}

customElements.define('bitd-userswitcher', UserSwitcher);
