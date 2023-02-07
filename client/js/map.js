import {LitElement, html, map, css} from './lit-all.min.js';

var MAP_URL = "img/doskvol_map.png";
var MAP_ALLOW_DETAILED_ZOOM = false;

export function _render_map() {
    return html`
        <img @click="${this._map_click}" @contextmenu=${this._map_rightclick} src="${MAP_URL}">
    `;
}

export function _switch_image(event, path) {
    var img = event.target;
    img.setAttribute('src', path);
    img.setAttribute('style', 'cursor: w-resize;');
    // var lms = document.getElementsByClassName("landmark");
    // for (var i = 0; i < lms.length; i++) {
        // lms[i].setAttribute('display', 'none');
    // }
}

export function _map_rightclick(event) {
    if (MAP_ALLOW_DETAILED_ZOOM == false) {
        return;
    } else {
        event.preventDefault();

        const currentmap = event.target;
        if (currentmap.getAttribute("src") !== MAP_URL) {
            currentmap.setAttribute("src", MAP_URL); // go back to home, undo _switch_img()
            currentmap.setAttribute('style', 'cursor: crosshair;');
            // var lms = document.getElementsByClassName("landmark");
            // for (var i = 0; i < lms.length; i++) {
                // lms[i].setAttribute('display', 'unset');
            // }
            return;
        }

        let rect = event.target.getBoundingClientRect();
        const x = event.offsetX / rect.width; // percentages, 0.0 - 1.0
        const y = event.offsetY / rect.height;

        if ((x > 0.5325497287522604) && (y > 0.8484486873508353) &&
            (x < 0.7956600361663653) && (y < 0.9248210023866349)) {
                _switch_image(event, "./img/maps/barrowcleft.png");
        } else if ((x > 0.1763110307414105) && (y > 0.220763723150358) &&
                    (x < 0.3462929475587703) && (y < 0.4904534606205251)) {
                _switch_image(event, "./img/maps/brightstone.png");
        } else if ((x > 0.5081374321880651) && (y > 0.5119331742243437) &&
                    (x < 0.6482820976491862) && (y < 0.665871121718377)) {
                _switch_image(event, "./img/maps/charhollow.png");
        } else if ((x > 0.3707052441229656) && (y > 0.2732696897374702) &&
                    (x < 0.5768535262206148) && (y < 0.4785202863961814)) {
                _switch_image(event, "./img/maps/charterhall.png");
        } else if ((x > 0.5858951175406871) && (y > 0.3138424821002387) &&
                    (x < 0.7848101265822784) && (y < 0.3902147971360382)) {
                _switch_image(event, "./img/maps/coalridge.png");
        } else if ((x > 0.3933092224231465) && (y > 0.5143198090692124) &&
                    (x < 0.5153707052441230) && (y < 0.6992840095465394)) {
                _switch_image(event, "./img/maps/crowsfoot.png");
        } else if ((x > 0.2613019891500904) && (y > 0.535799522673031) &&
                    (x < 0.3824593128390596) && (y < 0.720763723150358)) {
                _switch_image(event, "./img/maps/docks.png");
        } else if ((x > 0.6708860759493671) && (y > 0.4498806682577566) &&
                    (x < 0.8878842676311031) && (y < 0.6026252983293556)) {
                _switch_image(event, "./img/maps/dunslough.png");
        } else if ((x > 0.5307414104882460) && (y > 0.09307875894988067) &&
                    (x < 0.7097649186256781) && (y < 0.28878281622911695)) {
                _switch_image(event, "./img/maps/nightmarket.png");
        } else if ((x > 0.3833634719710669) && (y > 0.7183770883054893) &&
                    (x < 0.6229656419529838) && (y < 0.8293556085918854)) {
                _switch_image(event, "./img/maps/silkshore.png");
        } else if ((x > 0.3083182640144665) && (y > 0.13126491646778043) &&
                    (x < 0.5415913200723327) && (y < 0.25894988066825775)) {
                _switch_image(event, "./img/maps/sixtowers.png");
        } else if ((x > 0.01808318264014466) && (y > 0.4105011933174224) &&
                    (x < 0.24773960216998192) && (y < 0.8866348448687351)) {
                _switch_image(event, "./img/maps/whitecrown.png");
        }
        return;
    }
}

export function _map_click(event) {
    const currentmap = event.target;
    if (currentmap.getAttribute("src") !== MAP_URL) {
        _map_rightclick(event);
    }
    else {
        let name = window.prompt("Name of landmark?")
        if (name == null) return;
        name = name.trim();
        if (name === "") return;

        let rect = event.target.getBoundingClientRect();
        const x = event.offsetX / rect.width;
        const y = event.offsetY / rect.height;

        console.log("Creating \"" + name + "\" at " + x + ", " + y);
        // const message = JSON.stringify({ "AddLandmark": [name, x, y] });
        // this.dispatchEvent(new CustomEvent("add_landmark", {detail: message, bubbles: true, composed: true }));
    }
}