let bgcolor = "yellow";
var numdice = 1;

function new_die() {
    if (numdice <= 8) {
        let dicerow = document.querySelector("#sidebar .section #dice");
        dicerow.innerHTML += '<div class="die" onClick="roll_die(' + numdice + ')" style="background-color:' + bgcolor + ';">⋯</div>';
        numdice += 1;
    }
};

function delete_die() {
    if (numdice >= 1) {
        let dice = document.querySelectorAll("#sidebar .section #dice .die");

        let dicerow = document.querySelector("#sidebar .section #dice");
        dicerow.innerHTML = '';

        for (var i = 0; i < numdice - 1; i++) {
            dicerow.innerHTML += dice[i].outerHTML;
        }
        numdice -= 1;
    }
};

function empty_dice() {
    numdice = 0;
    let dicerow = document.querySelector("#sidebar .section #dice");
    dicerow.innerHTML = '';
}

function roll_die(num) {
    let dice = document.querySelectorAll("#sidebar .section #dice .die");
    dice[num].innerHTML = Math.floor(Math.random()*6)+1;
}

function roll_all_dice() {
    for (var i = 0; i < numdice; i++) {
        roll_die(i);
    }
}

function change_dice_colors() {
    let dice = document.querySelectorAll("#sidebar .section #dice .die");
    let num = dice.length;

    const colors = ["tomato", "orange", "dodgerblue", "greenyellow", "lawngreen", "lavenderblush",
    "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightpink", "lightskyblue",
    "lightsalmon", "navajowhite", "papayawhip", "paleturquoise", "powderblue", "thistle"];
    bgcolor = colors[Math.floor(Math.random()*colors.length)];

    for (var i = 0; i < num; i++) {
        dice[i].style.backgroundColor = bgcolor;
    }
}
