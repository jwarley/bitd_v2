var numdice = 1;

function new_die() {
    if (numdice <= 8) {
        let dicerow = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelector("#sidebar .section #dice");
        dicerow.innerHTML += '<div class="die" onClick="roll_die(' + numdice + ')" style="background-color: var(--dice-default-color);">⋯</div>';
        numdice += 1;
    }
};

function delete_die() {
    if (numdice >= 1) {
        let dice = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelectorAll("#sidebar .section #dice .die");

        let dicerow = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelector("#sidebar .section #dice");
        dicerow.innerHTML = '';

        for (var i = 0; i < numdice - 1; i++) {
            dicerow.innerHTML += dice[i].outerHTML;
        }
        numdice -= 1;
    }
};

function empty_dice() {
    numdice = 0;
    let dicerow = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelector("#sidebar .section #dice");
    dicerow.innerHTML = '';
}

function roll_die(num) {
    let dice = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelectorAll("#sidebar .section #dice .die");
    let oldnum = dice[num].innerHTML;

    let roll1 = Math.floor(Math.random()*6)+1;
    while (roll1 == oldnum) {
        roll1 = Math.floor(Math.random()*6)+1;
    }
    let roll2 = Math.floor(Math.random()*6)+1;
    while (roll2 == oldnum) {
        roll2 = Math.floor(Math.random()*6)+1;
    }
    let roll3 = Math.floor(Math.random()*6)+1;
    while (roll3 == oldnum) {
        roll3 = Math.floor(Math.random()*6)+1;
    }
    let roll4 = Math.floor(Math.random()*6)+1;
    while (roll4 == oldnum) {
        roll4 = Math.floor(Math.random()*6)+1;
    }
    setTimeout(function(){
        dice[num].innerHTML = roll1;
    }, 75);
    setTimeout(function(){
        dice[num].innerHTML = roll2;
    }, 150);
    setTimeout(function(){
        dice[num].innerHTML = roll3;
    }, 225);
    setTimeout(function(){
        dice[num].innerHTML = roll4;
    }, 300);

    let newnum = Math.floor(Math.random()*6)+1;
    dice[num].innerHTML = newnum;
}

function roll_all_dice() {
    for (var i = 0; i < numdice; i++) {
        roll_die(i);
    }
}

function change_dice_colors() {
    let dice = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelectorAll("#sidebar .section #dice .die");
    let num = dice.length;

    const colors = ["tomato", "orange", "dodgerblue", "greenyellow", "lawngreen", "lavenderblush",
    "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightpink", "lightskyblue",
    "lightsalmon", "navajowhite", "papayawhip", "paleturquoise", "powderblue", "thistle"];
    const bgcolor = colors[Math.floor(Math.random()*colors.length)];

    for (var i = 0; i < num; i++) {
        dice[i].style.backgroundColor = bgcolor;
    }
}
