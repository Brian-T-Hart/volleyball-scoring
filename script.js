let scores = {
    A: 0,
    B: 0
};

const teams = document.querySelectorAll(".team");

function updateScore(team, amount) {

    scores[team] += amount;

    // Don't allow a negative score.
    if (scores[team] < 0) {
        scores[team] = 0;
    }

    document.getElementById(`score${team}`).textContent = scores[team];

    showFeedback(team, amount);
}


function showFeedback(team, amount) {

    const feedback = document.getElementById(`feedback${team}`);

    feedback.textContent = amount > 0 ? "+1" : "−1";

    feedback.classList.remove("show");

    // Force animation to restart.
    void feedback.offsetWidth;

    feedback.classList.add("show");
}


/*
 * Swipe detection
 */

teams.forEach(teamElement => {

    let startY = 0;
    let startX = 0;
    let pointerDown = false;

    teamElement.addEventListener("pointerdown", event => {

        pointerDown = true;
        startY = event.clientY;
        startX = event.clientX;

        teamElement.setPointerCapture(event.pointerId);
    });


    teamElement.addEventListener("pointerup", event => {

        if (!pointerDown) {
            return;
        }

        pointerDown = false;

        const endY = event.clientY;
        const endX = event.clientX;

        const deltaY = endY - startY;
        const deltaX = endX - startX;

        const team = teamElement.dataset.team;

        /*
         * Only treat it as a swipe if the
         * vertical movement is larger than
         * the horizontal movement.
         */

        if (
            Math.abs(deltaY) > 50 &&
            Math.abs(deltaY) > Math.abs(deltaX)
        ) {

            // Swipe up = +1
            if (deltaY < 0) {
                updateScore(team, 1);
            }

            // Swipe down = -1
            else {
                updateScore(team, -1);
            }
        }

    });

});


/*
 * New Game
 */

document.getElementById("newGame").addEventListener("click", () => {

    const confirmed = confirm(
        "Start a new game? Both scores will be reset to 0."
    );

    if (!confirmed) {
        return;
    }

    scores.A = 0;
    scores.B = 0;

    document.getElementById("scoreA").textContent = "0";
    document.getElementById("scoreB").textContent = "0";
});