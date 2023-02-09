import {LitElement, html, css} from './lit-all.min.js';

export class Note extends LitElement {
    static styles = css`
    `;

    static properties = {
        title: { type: String },
        desc: { type: String },
        cat: { type: String },
        uuid: { type: String },
    }

    constructor() {
        super();
    }

    _edit(e) {
        // edit note this.uuid
    }

    render() {
        return html`
             <div class="note ${this.cat}" data-uuid="${this.uuid}">
                    <div class="header">
                        <div class="title">${this.title}</div>
                        <div class="edit" @click=${this._edit}>edit</div>
                    </div>
                    <div class="desc">
                        ${this.desc}
                    </div>
                    <div class="cat">${this.cat}</div>
                </div>
            </div>
        `;
    }

    createRenderRoot() {
        return this; // render without shadow DOM
    }
}

customElements.define('bitd-note', Note);
