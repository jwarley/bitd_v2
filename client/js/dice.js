var numdice = 1;

function new_die() {
    if (numdice < 6) {
        let dicerow = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelector("#sidebar .section #dice");
        dicerow.innerHTML += '<div class="die" onClick="roll_die(' + numdice + ')" style="background-color: var(--dice-default-color);">⋯</div>';
        numdice += 1;
    }
}

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
}

function empty_dice() {
    numdice = 0;
    let dicerow = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelector("#sidebar .section #dice");
    dicerow.innerHTML = '';
}

function roll_die(num) {
    let dice = document.querySelector("bitd-app").shadowRoot.querySelector("bitd-sidebar").shadowRoot.querySelectorAll("#sidebar .section #dice .die");
    let oldnum = dice[num].innerHTML;

    var fake_choices = [1, 2, 3, 4, 5, 6];
    const index = fake_choices.indexOf(oldnum);
    if (index !== -1) {
        fake_choices.splice(index, 1);
    }

    // truly random fisher-yates shuffle
    for (let i = fake_choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = fake_choices[i];
        fake_choices[i] = fake_choices[j];
        fake_choices[j] = temp;
    }

    setTimeout(function(){
        dice[num].innerHTML = fake_choices[0];
    }, 75);
    setTimeout(function(){
        dice[num].innerHTML = fake_choices[1];
    }, 150);
    setTimeout(function(){
        dice[num].innerHTML = fake_choices[2];
    }, 225);
    setTimeout(function(){
        dice[num].innerHTML = fake_choices[3];
    }, 300);

    setTimeout(function(){
        let newnum = Math.floor(Math.random()*6)+1;
        dice[num].innerHTML = newnum;
    }, 375);
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
