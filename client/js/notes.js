import {LitElement, html, map, css} from './lit-all.min.js';

export function _render_notes() {
    return html`
        <div id="control_panel">
            <a>new note</a>

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

        <div class="note misc">
            <div class="header">
                <div class="title">idk</div>
                <div class="edit">edit</div>
            </div>
            <div class="desc">
                something else
            </div>
            <div class="cat">misc</div>
        </div>

        <div class="note person">
            <div class="header">
                <div class="title">tip from remy</div>
                <div class="edit">edit</div>
            </div>
            <div class="desc">
                eliza's a killer
            </div>
            <div class="cat">person</div>
        </div>

        <div class="note place">
            <div class="header">
                <div class="title">hroses</div>
                <div class="edit">edit</div>
            </div>
            <div class="desc">
                the barn smells funky?!
            </div>
            <div class="cat">place</div>
        </div>

        <div class="note boogins">
            <div class="header">
                <div class="title">a ghost</div>
                <div class="edit">edit</div>
            </div>
            <div class="desc">
                spooky monters
            </div>
            <div class="cat">boogins</div>
        </div>

        <div class="note item">
            <div class="header">
                <div class="title">swiss army man</div>
                <div class="edit">edit</div>
            </div>
            <div class="desc">
                viktor's knife needs sharpening asap
            </div>
            <div class="cat">item</div>
        </div>

        <div class="note concept">
            <div class="header">
                <div class="title">nyoo hoo hoo math</div>
                <div class="edit">edit</div>
            </div>
            <div class="desc">
                1 + 1 = 2
            </div>
            <div class="cat">concept</div>
        </div>

        <div class="note event">
            <div class="header">
                <div class="title">brawl</div>
                <div class="edit">edit</div>
            </div>
            <div class="desc">
                street fight sundown tomorrow at the riverbank but if you don't show up there's gon' be a reckoning
            </div>
            <div class="cat">event</div>
        </div>
    `;
}

