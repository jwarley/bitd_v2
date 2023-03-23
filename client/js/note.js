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
        _delete_unlocked: { type: Boolean, state: true },
    }

    constructor() {
        super();
        this._delete_unlocked = false;
    }

    _edit_title() {
        let header_elt = this.getElementsByClassName("title")[0];
        let title = header_elt.value;
        if (title == null) return;
        title = title.trim();
        if (title === "") return;

        this._edit(title, this.desc, this.cat);
    }

    _edit_desc() {
        let desc = this.getElementsByClassName("desc")[0].value;
        if (desc == null) return;
        desc = desc.trim();
        if (desc === "") return;

        this.desc = desc;
        this._edit(this.title, this.desc, this.cat);
    }

    _edit(new_title, new_desc, new_cat) {
        const message = JSON.stringify({ "EditNote": [this.id, new_title, new_desc, new_cat] });
        this.dispatchEvent(new CustomEvent("edit_note", {detail: message, bubbles: true, composed: true }));
    }

    _delete() {
        this._delete_unlocked = false;
        const message = JSON.stringify({ "DeleteNote": this.id });
        this.dispatchEvent(new CustomEvent("delete_note", {detail: message, bubbles: true, composed: true }));
    }

    _unlock_delete() {
        this._delete_unlocked = true;
        setTimeout(() => {
            this._delete_unlocked = false;
        }, 2000);
    }

    render() {
        const del_button = this._delete_unlocked ? html`
            <div @click="${this._delete}" class="del">
                ?
            </div>
        ` : html`
            <div @click="${this._unlock_delete}" class="del">
                &times;
            </div>
        `;

        return html`
             <div class="note ${this.cat.toLowerCase()}" data-id="${this.id}">
                    <div class="header">
                        <input
                            @blur="${this._edit_title}"
                            class="title"
                            value="${this.title}"
                            spellcheck="false"
                            style="width: calc(14px * ${this.title.length});"
                            maxlength="40"
                        />
                        ${del_button}
                    </div>
                    <textarea
                        @blur="${this._edit_desc}"
                        class="desc"
                        spellcheck="false"
                        style="height: 120px;"
                    >${this.desc.trim()}</textarea>
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
