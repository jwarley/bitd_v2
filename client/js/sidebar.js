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
        .section:not(:last-child) {
            border-bottom: 1px solid var(--text-color);
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
        .section#colorswap {
            background: var(--highlight-color);
            font-size: 1rem;
            cursor: pointer;
        }
        .section#colorswap a {
            font-weight: bold;
            color: var(--text-color);
            text-decoration: none;
        }
        .section#colorswap a::before {
            content: var(--symbol);
        }
        .section input {
            margin-bottom: 2rem;
        }
        #lastupdate {
            display: inline-block;
            background: var(--page-color);
            position: absolute;
            margin: 1rem 0 0;
            font-size: 0.8rem;
            width: 100%;
            line-height: 2rem;
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
    }

    constructor() {
        super();
    };

    render() {
        return html`
            <div id="sidebar">
                <div class="section">
                    <bitd-userswitcher players="${JSON.stringify(this.players)}"></bitd-userswitcher>
                </div>

                <div class="section">
                    <h3>&#x1F3B2; dice</h3>
                    <div class="dicerow">
                        <a href="#!" onClick="empty_dice()">0</a>
                        <a href="#!" onClick="delete_die()">&minus;</a>
                        <a href="#!" onClick="new_die()">+</a>
                    </div>
                    <div id="dice">
                        <div class="die" onClick="roll_die(0)" style="background-color: var(--dice-default-color);">⋯</div>
                    </div>
                    <div class="dicerow">
                        <a href="#!" onClick="roll_all_dice();" class="grow">roll all</a>
                        <a href="#!" onClick="change_dice_colors();" class="shrink">&#x1F308;</a>
                    </div>
                </div>

                <div class="section">
                    <h3>&#x1f5d2; memo pad</h3>
                    <textarea id="memopad" rows="10"></textarea>
                </div>

                <div class="section" id="colorswap" onClick="lights()">
                    <a href="#!">toggle dark mode</a>
                </div>

                <div class="section" id="bottom">
                    <form onSubmit="sign_out()">
                        <input type="submit" value="done playing" />
                    </form>

                    <div id="lastupdate">
                        <a href="#!">ver. 2023.02.03</a>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('bitd-sidebar', App);
