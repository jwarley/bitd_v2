import {LitElement, html, css, svg, map} from './lit-all.min.js';

export class Clock extends LitElement {
    static styles = css`
        .clock {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-width: 10rem;
            margin: 0 -0.75rem;
        }
        svg {
            overflow: visible;
            display: block;
        }
        .name {
            margin: 0.75rem 0 1rem;
            text-align: center;
        }
        .del {
            width: 1.5rem;
            height: 1.5rem;
            line-height: 1.5rem;
            text-align: center;
            cursor: pointer;
            color: var(--text-color);
            background-color: var(--gray-button-color);
            font-size: 0.875rem;
            border: 1px solid var(--text-color);
        }
    `;

    static properties = {
        id: { type: String },
        player_id: { type: String },
        task: { type: String },
        slices: { type: Number },
        progress: { type: Number },
        _delete_unlocked: { type: Boolean, state: true },
    }

    constructor() {
        super();
        this._delete_unlocked = false;
        // don't select text on double click, which we might do on clock faces
        document.addEventListener('mousedown', function(event) {
            if (event.detail > 1) {
                event.preventDefault();
            }
        }, false);
    }

    _increment() {
        const message = JSON.stringify({ "IncrementClock": [this.player_id, this.id] });
        this.dispatchEvent(new CustomEvent("increment_clock", {detail: message, bubbles: true, composed: true }));
    }

    _decrement(e) {
        e.preventDefault();
        const message = JSON.stringify({ "DecrementClock": [this.player_id, this.id] });
        this.dispatchEvent(new CustomEvent("decrement_clock", {detail: message, bubbles: true, composed: true }));
    }

    _delete() {
        this._delete_unlocked = false;
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
            <div @click="${this._delete}" class="del">
                ?
            </div>
        ` : html`
            <div @click="${this._unlock_delete}" class="del">
                &#x2715;
            </div>
        `;

        // Render the clock face
        const theta = 2 * Math.PI / this.slices;
        const overhalf = this.progress / this.slices > 0.5 ? 1 : 0;
        const allfull = this.progress == this.slices ? "var(--clock-color)" : "none";
        const clock_face = svg`
            <path
                d="M 0,-1
                   A 1 1 0 ${overhalf} 1 ${Math.cos(Math.PI/2 - (theta * this.progress))} ${-Math.sin(Math.PI/2 - (theta * this.progress))}
                   L 0 0 Z
                " fill="var(--clock-color)"
            />
            <circle cx="0" cy="0" r="1" fill="${allfull}" stroke="var(--text-color)" stroke-width="0.03"/>
            ${map([...Array(this.slices).keys()], (i) => {
                if (this.slices > 1) {
                    return svg`<line
                        x1="0"
                        y1="0"
                        x2="${Math.cos((i * theta) - (Math.PI / 2))}"
                        y2="${Math.sin((i * theta) - (Math.PI / 2))}"
                        stroke="var(--text-color)" stroke-width="0.03"
                    />`
                }
            })}
        `;

        return html`
            <div class="clock">
                <svg @click="${this._increment}" @contextmenu="${this._decrement}" viewBox="-1.25 -1.25 2.5 2.5" height="85%" width="85%">${clock_face}</svg>
                <div class="name">
                    ${this.task}
                </div>
                ${del_button}
            </div>
        `;
    }
}

customElements.define('bitd-clock', Clock);
