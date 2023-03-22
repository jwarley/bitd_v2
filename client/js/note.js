import {LitElement, html, css, map} from './lit-all.min.js';

export class Note extends LitElement {
    CATEGORIES = [
        "Misc",
        "Person",
        "Place",
        "Boogins",
        "Item",
        "Concept",
        "Event",
    ];

    static styles = css`
    `;

    static properties = {
        id: { type: String },
        title: { type: String },
        desc: { type: String },
        cat: { type: String },
    }

    constructor() {
        super();
    }

    _spawn_edit_prompt() {
        let title = window.prompt("Edit title?", this.title);
        if (title == null) {
            title = this.title
        }
        title = title.trim();
        if (title === "") {
            title = this.title
        }

        let desc = window.prompt("Edit desc?", this.desc);
        if (desc == null) {
            desc = this.desc
        }
        desc = desc.trim();
        if (desc === "") {
            desc = this.desc
        }

        if (title != this.title || desc != this.desc) {
            this._edit(title, desc, this.cat);
        }
    }

    _edit(new_title, new_desc, new_cat) {
        const message = JSON.stringify({ "EditNote": [this.id, new_title, new_desc, new_cat] });
        this.dispatchEvent(new CustomEvent("edit_note", {detail: message, bubbles: true, composed: true }));
    }

    _delete() {
        const message = JSON.stringify({ "DeleteNote": this.id });
        this.dispatchEvent(new CustomEvent("delete_note", {detail: message, bubbles: true, composed: true }));
    }

    render() {
        return html`
             <div class="note ${this.cat.toLowerCase()}" data-id="${this.id}">
                    <div class="header">
                        <div class="title">${this.title}</div>
                        <div class="edit" @click=${this._spawn_edit_prompt}>edit</div>
                        <div class="edit" @click=${this._delete}>×</div>
                    </div>
                    <div class="desc">
                        ${this.desc}
                    </div>
                    <select style="text-transform: lowercase;" @change=${(e) => this._edit(this.title, this.desc, e.target.value)} class="cat">
                        ${map(this.CATEGORIES, (c) => c == this.cat
                            ? html`<option selected value=${c}>${c}</option>`
                            : html`<option value=${c}>${c}</option>`
                        )}
                    </select>
                </div>
            </div>
        `;
    }

    createRenderRoot() {
        return this; // render without shadow DOM
    }
}

customElements.define('bitd-note', Note);
