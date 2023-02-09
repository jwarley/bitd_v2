import {LitElement, html, map, css} from './lit-all.min.js';

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
        .note .header .title {
            color: var(--text-color);
            font-weight: bold;
            font-size: 1.5rem;
            padding: 0.25rem 0.5rem;
            width: max-content;
        }
        .note .header .edit {
            background: var(--gray-text-color);
            color: var(--page-color);
            font-weight: bold;
            font-size: 1rem;
            padding: 0.5rem;
            margin-left: 0.5rem;
            width: max-content;
            cursor: pointer;
        }
        .note .desc {
            margin-top: 0.25rem;
            padding: 0.45rem;
            margin-bottom: 1.75rem;
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
    }

    constructor() {
        super();
    }

    _create_note() {
        // ...
    }

    _render_notes() {
        // const notes_ordered = Object.keys(this.notes).sort();
        return html `
            <div id="control_panel">
                <a @click=${this._create_note}>new note</a>

                <b>filter:</b>
                <select id="note_filter">
                </select>

                <b>sort:</b>
                <select id="note_sort">
                    <option value="date">date</option>
                    <option value="name">name</option>
                    <option value="type">type</option>
                </select>
            </div>

            <bitd-note
                title="idk"
                desc="something else"
                cat="misc">
            </bitd-note>
            <bitd-note
                title="tip from remy"
                desc="eliza's a killer"
                cat="person">
            </bitd-note>
            <bitd-note
                title="hroses"
                desc="the barn smells funky?!"
                cat="place">
            </bitd-note>
            <bitd-note
                title="a ghost"
                desc="spooky monters"
                cat="boogins">
            </bitd-note>
            <bitd-note
                title="swiss army man"
                desc="viktor's knife needs sharpening asap"
                cat="item">
            </bitd-note>
            <bitd-note
                title="nyoo hoo hoo math"
                desc="1 + 1 = 2"
                cat="concept">
            </bitd-note>
            <bitd-note
                title="brawl"
                desc="street fight sundown tomorrow at the riverbank but if you don't show up there's gon' be a reckoning"
                cat="event">
            </bitd-note>

        `;
    }

    render() {
        return html`
            <div id="noteswrapper">
                ${this._render_notes()}
            </div>
        `;
    }
}

customElements.define('bitd-notes-list', NotesList);
