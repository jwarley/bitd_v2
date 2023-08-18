import {LitElement, html, map, css, repeat} from './lit-all.min.js';

export class NotesList extends LitElement {
    static styles = css`
        bitd-note {
            display: flex;
        }
        #noteswrapper {
            display: flex;
            flex-wrap: wrap;
        }
        select {
            background: var(--page-color);
            color: var(--text-color);
            border: 1px solid var(--page-color);
            border-radius: 2px;
            font-size: 1rem;
            margin-top: 0.25rem;
        }
        select:focus-visible {
            outline: 0;
        }

        #control_panel {
            margin: 0.25rem 0.5rem 0.25rem 0.25rem;
            padding: 0.5rem;
            width: 6rem;
            background: gold;
            display: flex;
            flex-direction: column;
            color: #000;
            border: 1px solid var(--text-color);
            border-radius: 3px;
            min-height: 12rem;
        }
        #control_panel a {
            font-size: 1rem;
            text-align: center;
            padding: 0.25rem 0.5rem;
            background: #ffb700;
            border: 1px solid #000;
            border-radius: 2px;
            cursor: pointer;
        }
        #control_panel b {
            display: block;
            margin-top: 1rem;
        }
        .note {
            display: flex;
            flex-direction: column;
            margin: 0.25rem 0.5rem 0.25rem 0.25rem;
            border: 1px solid var(--text-color);
            border-radius: 2px;
            min-width: 10rem;
            max-width: 32rem;
            width: min-content;
            word-break: break-word;
            overflow: auto;
            position: relative;
        }
        .note .header {
            display: flex;
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
        }
        .note .header input.title {
            color: var(--text-color);
            background: transparent;
            border: 0;
            font-weight: bold;
            font-size: 1.5rem;
            font-weight: bold;
            font-size: 1.5rem;
            padding: 0.25rem 0.5rem;
            width: 150px;
            min-width: 150px;
        }
        input:focus {
            outline: 0;
        }
        .note .header .del {
            background: rgba(51, 51, 51, 0.35);
            color: var(--text-color);
            font-weight: bold;
            font-size: 1rem;
            padding: 0.5rem;
            width: 11px;
            text-align: center;
            cursor: pointer;
        }
        .note textarea.desc {
            margin-top: 0.25rem;
            padding: 0.45rem;
            margin-bottom: 1.75rem;
            background: transparent;
            color: var(--text-color);
            border: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Avenir Next", Avenir, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
            font-size: 12pt;
            resize: none;
        }
        textarea:focus {
            outline: 0;
        }
        .note .cat {
            color: var(--text-color);
            font-weight: bold;
            font-size: 1.2rem;
            position: absolute;
            bottom: 0.25rem;
            right: 0.25rem;
            padding: 0.1rem 0.35rem;
            border-radius: 2px;
        }

        .note.misc .header,
        .note.misc .cat {
            background: var(--note-misc);
        }
        .note.person .header,
        .note.person .cat {
            background: var(--note-person);
        }
        .note.place .header,
        .note.place .cat {
            background: var(--note-place);
        }
        .note.boogins .header,
        .note.boogins .cat {
            background: var(--note-boogins);
        }
        .note.item .header,
        .note.item .cat {
            background: var(--note-item);
        }
        .note.concept .header,
        .note.concept .cat {
            background: var(--note-concept);
        }
        .note.event .header,
        .note.event .cat {
            background: var(--note-event);
        }
    `;

    static properties = {
        notes: { type: Object },
        _sort_type: { type: String },
    }

    constructor() {
        super();
        this._sort_type = "date";
    }

    _add_note() {
        const name = "note"
        let content = "..."

        const message = JSON.stringify({ "AddNote": [name, content, "Misc"] });
        this.dispatchEvent(new CustomEvent("add_note", {detail: message, bubbles: true, composed: true }));
    }

    _return_sorted_notes() {
        const notes_ordered = Object.entries(this.notes).sort((a, b) => {
            switch (this._sort_type) {
                case "date":
                    return a[0].localeCompare(b[0]); // uuids in sortable order
                case "name":
                    return a[1].title.localeCompare(b[1].title);
                case "type":
                    return a[1].cat.localeCompare(b[1].cat);
            }
        });

        return notes_ordered;
    }

    render() {
        const notes_html = this.notes === null ? html`` : html`${repeat(this._return_sorted_notes(),
            (c) => c[0], // unique identifier for the item
            (c) => {
            const id = c[0];
            const note = c[1];
            return html`
                <bitd-note id="${id}" title="${note.title}" desc="${note.desc}" cat="${note.cat}"></bitd-note>
            `
        })}` ;

        return html`
            <div id="noteswrapper">
                <div id="control_panel">
                    <a @click=${this._add_note}>new note</a>

                    <b>filter:</b>
                    <select id="note_filter">
                    </select>

                    <b>sort:</b>
                    <select @change="${e => this._sort_type = e.target.value}" id="note_sort">
                        <option value="date">date</option>
                        <option value="name">name</option>
                        <option value="type">type</option>
                    </select>
                </div>

                ${notes_html}
            </div>
        `;
    }
}

customElements.define('bitd-notes-list', NotesList);
