if (localStorage.getItem('darkmode') == 'true') {
    document.addEventListener("DOMContentLoaded", function(event) {
        lights(false);
        var lightsbanner = document.querySelector("#sidebar .section#colorswap #lightsbanner");
        lightsbanner.innerHTML = lightsbanner.innerHTML.replace("\u2600", "\u263e");
    });
    // setTimeout(function(){
    //  // wait before doing something
    // },500);
}

function lights(toggle = true) {
    document.body.classList.toggle("dark-mode");
    document.querySelector("#sidebar .section#colorswap").classList.toggle("dark-mode");
    document.querySelector("#sidebar textarea").classList.toggle("dark-mode");
    document.querySelector("#sidebar input").classList.toggle("dark-mode");
    var dicerows = document.querySelectorAll("#sidebar .dicerow");this
    for (var i = 0; i < dicerows.length; i++) {
        dicerows[i].classList.toggle("dark-mode");
    }

    var lightsbanner = document.querySelector("#sidebar .section#colorswap #lightsbanner");
    if (toggle) { // if clicking (not on pageload automatically)
        if (localStorage.getItem('darkmode') == 'true') {
            localStorage.setItem('darkmode', 'false');
            lightsbanner.innerHTML = lightsbanner.innerHTML.replace("\u263e", "\u2600");
        } else {
            localStorage.setItem('darkmode', 'true');
            lightsbanner.innerHTML = lightsbanner.innerHTML.replace("\u2600", "\u263e");
        };
    };
};