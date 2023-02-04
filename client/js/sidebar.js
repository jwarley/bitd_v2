import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js';

export class App extends LitElement {
    static styles = css`
        #sidebar {
            display: flex;
            flex-direction: column;
            background: var(--page-color);
            width: 20%;
            height: 100vh;
            position: fixed;
            right: 0;
            top: 0;
            border-left: 1px solid var(--text-color);
        }
        h3 {
            margin: 0 0 0.5rem 0;
            color: var(--text-color);
        }

        .section {
            padding: 1rem 0.25rem;
            text-align: center;
        }
        .section:nth-child(2),
        .section:nth-child(4),
        .section:nth-child(5),
        .section:nth-child(6),
        .section:nth-child(7) {
            border-top: 1px solid var(--text-color);
            border-bottom: 1px solid var(--text-color);
        }
        .section:first-child {
            padding: 0.4rem 0 0.5rem;
            border: 10px outset var(--highlight-color);
        }

        .dicerow {
            display: flex;
            justify-content: space-around;
        }
        .dicerow a {
            flex: 1 1 auto;
            min-width: 0;
            min-height: 0;
            background: var(--button-color);
            color: var(--text-color);
            font-size: 1.5rem;
            text-decoration: none;
            margin: 0 0.25rem;
            padding: 0.25rem 0.5rem;
            cursor: pointer;
        }
        .dicerow a.grow {
            flex: unset;
            flex-grow: 1;
            font-size: 1.25rem;
        }
        .dicerow a.shrink {
            flex: unset;
            flex-shrink: 1;
            font-size: 1.25rem;
        }

        #dice {
            margin: 0.25rem 0;
            display: flex; /* not block */
            flex-wrap: wrap;
            justify-content: space-around;
        }
        #dice .die {
            justify-content: center;
            display: flex;
            flex-direction: column;
            margin: 0.5rem;
            width: 4rem;
            height: 4rem;
            color: #000; /* stay as black */
            font-size: 2.25rem;
            border-width: 0.125rem;
            border-radius: 0.5rem;
            border-style: solid;
            cursor: pointer;
        }

        textarea {
            width: calc(100% - 1rem);
            font-size: 0.875rem;
            font-family: inherit;
        }
        input, select, textarea, button {
            background: var(--page-color);
            color: var(--text-color);
            border: 1px solid var(--text-color);
            border-radius: 2px;
        }
        input {
            padding: 3px 8px;
        }

        .section#tool1 {
            background: var(--highlight-color);
            font-size: 1rem;
            padding: 1rem 0.25rem;
            margin-bottom: 1.25rem;
            cursor: pointer;
        }
        .section#tool1 span {
            font-weight: bold;
        }
        .section#tool1 span::before {
            content: var(--symbol);
        }
        .section#tool2,
        .section#tool3,
        .section#tool4 {
            background: var(--highlight-color2);
            font-size: 0.875rem;
            padding: 0.5rem 0.25rem;
            margin-bottom: 0.75rem;
            cursor: pointer;
        }
        .section#tool3 {
            background: var(--highlight-color3);
        }
        .section#tool4 {
            background: var(--highlight-color4);
        }
        .section input {
            background: none;
            border: 0;
            cursor: pointer;
        }

        #showsidebar {
            display: none;
            position: fixed;
            right: 10px;
            bottom: 10px;
            font-size: 2rem;
            cursor: pointer;
            z-index: 999;
        }

        #lastupdate {
            display: inline-block;
            background: var(--page-color);
            position: absolute;
            text-align: center;
            margin: 1rem 0 0;
            font-size: 0.8rem;
            width: 100%;
            line-height: 1.75rem;
            bottom: 0px;
            vertical-align: bottom;
            left: 50%;
            transform: translateX(-50%);
            background-image: linear-gradient(to right, white 50%, rgba(255,255,255,0) 0%);
            background-position: top;
            background-size: 10px 1px;
            background-repeat: repeat-x;
        }
        #lastupdate a {
            color: var(--text-color);
            text-decoration: none;
        }
    `; // #lastupdate border code: https://stackoverflow.com/a/18064496

    static properties = {
        players: { type: Object },
        _socket: {},
    }

    constructor() {
        super();
        this._socket = new WebSocket('ws://localhost:3000/ws');
    }

    _request_full_sync() {
        this._socket.send(JSON.stringify("FullSync"));
        console.log("Forced a full sync with the server.")

        const syncbutton = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelector("#tool3 span");
        const old_label = syncbutton.innerHTML;
        syncbutton.innerHTML = "&check;";
        syncbutton.style.fontWeight = "bold";

        setTimeout(function(){
            syncbutton.innerHTML = old_label;
            syncbutton.style.fontWeight = "normal";
        }, 750);
    }

    _hide_sidebar() {
        // hide the sidebar
        const sidebar_root = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot;
        const sidebar = sidebar_root.getElementById("sidebar");
        sidebar.style.display = "none";

        // adjust width of the main app
        const app = document.querySelector("bitd-app").shadowRoot.getElementById("main");
        app.style.width = "calc(100% - 1rem)";

        // show the unhide button
        const showbutton = sidebar_root.getElementById("showsidebar");
        showbutton.style.display = "block";
    }

    _show_sidebar() {
        // show the sidebar
        const sidebar_root = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot;
        const sidebar = sidebar_root.getElementById("sidebar");
        sidebar.style.display = "unset";

        // adjust width of the main app
        const app = document.querySelector("bitd-app").shadowRoot.getElementById("main");
        app.style.width = "calc(80% - 1rem)";

        // hide the unhide button
        const showbutton = sidebar_root.getElementById("showsidebar");
        showbutton.style.display = "none";
    }

    render() {
        return html`
            <div id="sidebar">
                <div class="section">
                    <bitd-userswitcher players="${JSON.stringify(this.players)}"></bitd-userswitcher>
                </div>

                <div class="section">
                    <h3>&#x1F3B2; dice</h3>
                    <div class="dicerow">
                        <a onClick="empty_dice()">0</a>
                        <a onClick="delete_die()">&minus;</a>
                        <a onClick="new_die()">+</a>
                    </div>
                    <div id="dice">
                        <div class="die" onClick="roll_die(0)" style="background-color: var(--dice-default-color);">⋯</div>
                    </div>
                    <div class="dicerow">
                        <a onClick="roll_all_dice()" class="grow">roll all</a>
                        <a onClick="change_dice_colors()" class="shrink">&#x1F308;</a>
                    </div>
                </div>

                <div class="section">
                    <h3>&#x1f5d2; memo pad</h3>
                    <textarea id="memopad" rows="8"></textarea>
                </div>

                <div class="section" id="tool1" onClick="lights()">
                    <span>toggle dark mode</span>
                </div>

                <div class="section" id="tool2" @click="${this._hide_sidebar}">
                    <span>hide sidebar</span>
                </div>

                <div class="section" id="tool3" @click="${this._request_full_sync}">
                    <span>force sync</span>
                </div>

                <div class="section" id="tool4">
                    <form onSubmit="sign_out()">
                        <input type="submit" value="done playing" />
                    </form>
                </div>

                <div id="lastupdate">
                    <a href="https://github.com/jwarley/bitd_v2" target="_blank">ver. 2023.02.04</a>
                </div>
            </div>

            <div id="showsidebar" @click="${this._show_sidebar}">&laquo;</div>
        `;
    }
}

customElements.define('bitd-sidebar', App);
