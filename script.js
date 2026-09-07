const STORAGE_KEY = "volleyballScoreboard";

const DEFAULT_STATE = {

    teams: {
        A: "Team A",
        B: "Team B"
    },

    format: 3,

    singleSet: false,

    showScoreControls: false,

    currentSet: 1,

    scores: {
        A: 0,
        B: 0
    },

    setsWon: {
        A: 0,
        B: 0
    },

    completedSets: [],

    history: []

};

let state = loadState();

/* =============================================================
   DOM ELEMENTS
============================================================= */

const scoreA = document.getElementById("scoreA");
const scoreB = document.getElementById("scoreB");

const teamNameA = document.getElementById("teamNameA");
const teamNameB = document.getElementById("teamNameB");

const setsScore = document.getElementById("setsScore");

const setIndicator = document.getElementById("setIndicator");

const undoButton = document.getElementById("undoButton");

const newSetButton = document.getElementById("newSetButton");
const newMatchButton = document.getElementById("newMatchButton");

const settingsButton = document.getElementById("settingsButton");
const controls = document.querySelector(".controls");
const controlsToggle = document.getElementById("controlsToggle");

const settingsModal = document.getElementById("settingsModal");

const teamAInput = document.getElementById("teamAInput");
const teamBInput = document.getElementById("teamBInput");

const matchFormat = document.getElementById("matchFormat");
const showScoreControls = document.getElementById("showScoreControls");

const cancelSettings = document.getElementById("cancelSettings");
const saveSettings = document.getElementById("saveSettings");

const announcement = document.getElementById("announcement");

const announcementLabel = document.getElementById("announcementLabel");

const announcementTitle = document.getElementById("announcementTitle");

const announcementButton = document.getElementById("announcementButton");

const firstLaunchHint = document.getElementById("firstLaunchHint");

const helpButton = document.getElementById("helpButton");

const helpContent = document.getElementById("helpContent");

const HINT_SEEN_KEY = "volleyballScoreboardHintSeen";
const CONTROLS_HIDE_DELAY = 5000;
let controlsHideTimer;

/* =============================================================
   SAVE / LOAD
============================================================= */

function saveState() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );

}

function loadState() {
    try {
        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(DEFAULT_STATE);
        }

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(DEFAULT_STATE),
            ...parsed,

            teams: {
                ...DEFAULT_STATE.teams,
                ...parsed.teams
            },

            scores: {
                ...DEFAULT_STATE.scores,
                ...parsed.scores
            },

            setsWon: {
                ...DEFAULT_STATE.setsWon,
                ...parsed.setsWon
            }

        };
    } catch (error) {
        console.error(
            "Could not load saved match:",
            error
        );

        return structuredClone(DEFAULT_STATE);
    }
}

/* =============================================================
   RENDER
============================================================= */

function render() {

    document.body.classList.toggle(
        "score-controls-visible",
        state.showScoreControls
    );

    document.body.classList.toggle(
        "single-set-mode",
        state.singleSet
    );

    scoreA.textContent = state.scores.A;
    scoreB.textContent = state.scores.B;

    teamNameA.textContent = state.teams.A;
    teamNameB.textContent = state.teams.B;

    setsScore.textContent =
        `${state.setsWon.A} – ${state.setsWon.B}`;

    setIndicator.textContent =
        state.singleSet ? "Single Set" : `Set ${state.currentSet} of ${state.format}`;

    undoButton.disabled =
        state.history.length === 0;

    saveState();

}

function setControlsHidden(hidden) {
    controls.classList.toggle("controls-hidden", hidden);
    controlsToggle.classList.toggle("controls-hidden", hidden);
    // controlsToggle.textContent = hidden ? "↑" : "↓";
    controlsToggle.setAttribute("aria-label", hidden ? "Show controls" : "Hide controls");
    controlsToggle.setAttribute("aria-expanded", String(!hidden));
}

function resetControlsHideTimer() {
    clearTimeout(controlsHideTimer);
    setControlsHidden(false);
    controlsHideTimer = setTimeout(() => setControlsHidden(true), CONTROLS_HIDE_DELAY);
}


/* =============================================================
   SCORE POINT
============================================================= */

function scorePoint(team, amount) {

    /*
     * Don't allow scoring once the match has been won.
     */

    if (isMatchOver()) {
        return;
    }


    /*
     * Don't allow score below zero.
     */

    if (
        amount < 0 &&
        state.scores[team] === 0
    ) {
        return;
    }


    /*
     * Save state before changing it.
     * This creates the undo history.
     */

    state.history.push(
        JSON.stringify({
            scores: { ...state.scores },
            setsWon: { ...state.setsWon },
            currentSet: state.currentSet,
            completedSets: [
                ...state.completedSets
            ]
        })
    );


    state.scores[team] += amount;


    /*
     * Check whether the point resulted in
     * a set win.
     */

    checkForSetWinner(team);

    render();


    /*
     * Visual feedback.
     */

    const teamElement =
        document.querySelector(
            `.team[data-team="${team}"]`
        );

    teamElement.classList.add("scoring");

    setTimeout(() => {

        teamElement.classList.remove("scoring");

    }, 150);

}


/* =============================================================
   CHECK SET WINNER
============================================================= */

function checkForSetWinner(team) {

    const opponent =
        team === "A" ? "B" : "A";

    const score =
        state.scores[team];

    const opponentScore =
        state.scores[opponent];


    /*
     * The final set is played to 15.
     * Other sets are played to 25.
     */

    const target = state.singleSet ? 25 : state.currentSet === state.format ? 15 : 25;

    /*
     * Volleyball sets must be won by two points.
     */

    const wonSet = score >= target && score - opponentScore >= 2;


    if (!wonSet) return;


    /*
     * Record the completed set.
     */

    state.setsWon[team]++;

    state.completedSets.push({

        set: state.currentSet,

        A: state.scores.A,

        B: state.scores.B,

        winner: team

    });


    /*
     * Check whether the entire match is won.
     */

    const setsNeeded =
        state.singleSet ? 1 : Math.ceil(state.format / 2);


    if (
        state.setsWon[team] >= setsNeeded
    ) {

        showMatchWinner(team);

        return;
    }


    /*
     * Otherwise show the set winner and
     * advance to the next set.
     */

    showSetWinner(team);

}


/* =============================================================
   SHOW SET WINNER
============================================================= */

function showSetWinner(team) {

    announcementLabel.textContent =
        `Set ${state.currentSet} Winner`;

    announcementTitle.textContent =
        state.teams[team];

    announcementButton.textContent =
        "Start Next Set";

    announcement.classList.add("active");


    /*
     * Store which action should happen when
     * the announcement button is clicked.
     */

    announcementButton.dataset.action =
        "next-set";

}


/* =============================================================
   SHOW MATCH WINNER
============================================================= */

function showMatchWinner(team) {

    announcementLabel.textContent =
        "Match Winner";

    announcementTitle.textContent =
        state.teams[team];

    announcementButton.textContent =
        "New Match";

    announcement.classList.add("active");

    announcementButton.dataset.action =
        "new-match";

}


/* =============================================================
   START NEXT SET
============================================================= */

function startNextSet() {

    state.currentSet++;

    state.scores.A = 0;
    state.scores.B = 0;

    announcement.classList.remove("active");

    render();

}


/* =============================================================
   NEW SET
============================================================= */

function newSet() {

    if (isMatchOver()) {
        return;
    }

    const confirmed =
        confirm(
            "Start a new set? The current set score will be discarded."
        );

    if (!confirmed) {
        return;
    }

    state.scores.A = 0;
    state.scores.B = 0;

    state.history = [];

    render();

}


/* =============================================================
   NEW MATCH
============================================================= */

function newMatch() {

    const confirmed =
        confirm(
            "Start a new match? The current match score will be reset."
        );

    if (!confirmed) {
        return;
    }


    const teamA =
        state.teams.A;

    const teamB =
        state.teams.B;

    const format =
        state.format;

    const singleSet =
        state.singleSet;


    state = {

        ...structuredClone(DEFAULT_STATE),

        teams: {
            A: teamA,
            B: teamB
        },

        format: format,

        singleSet: singleSet

    };


    announcement.classList.remove("active");

    render();

}


/* =============================================================
   UNDO
============================================================= */

function undo() {

    if (state.history.length === 0) {
        return;
    }


    const previous =
        JSON.parse(
            state.history.pop()
        );


    state.scores =
        previous.scores;

    state.setsWon =
        previous.setsWon;

    state.currentSet =
        previous.currentSet;

    state.completedSets =
        previous.completedSets;


    announcement.classList.remove("active");

    render();

}


/* =============================================================
   MATCH OVER?
============================================================= */

function isMatchOver() {

    const setsNeeded =
        state.singleSet ? 1 : Math.ceil(state.format / 2);

    return (
        state.setsWon.A >= setsNeeded ||
        state.setsWon.B >= setsNeeded
    );

}


/* =============================================================
   SETTINGS
============================================================= */

function openSettings() {

    teamAInput.value =
        state.teams.A;

    teamBInput.value =
        state.teams.B;

    matchFormat.value =
        state.singleSet ? "single" : state.format;

    showScoreControls.checked =
        state.showScoreControls;

    settingsModal.classList.add("active");

}


function closeSettings() {

    settingsModal.classList.remove("active");

}


function saveSettingsHandler() {

    const newTeamA =
        teamAInput.value.trim() ||
        "Team A";

    const newTeamB =
        teamBInput.value.trim() ||
        "Team B";

    const newSingleSet =
        matchFormat.value === "single";

    const newFormat =
        newSingleSet ? state.format : Number(matchFormat.value);

    const newShowScoreControls =
        showScoreControls.checked;


    /*
     * Changing the format resets the match.
     */

    const formatChanged =
        newFormat !== state.format;

    const singleSetChanged =
        newSingleSet !== state.singleSet;

    const matchStarted =
        state.scores.A > 0 ||
        state.scores.B > 0 ||
        state.setsWon.A > 0 ||
        state.setsWon.B > 0;


    if (
        (formatChanged || singleSetChanged) &&
        matchStarted
    ) {

        const confirmed =
            confirm(
                "Changing the match settings will start a new match. Continue?"
            );

        if (!confirmed) {
            return;
        }

    }


    state.teams.A =
        newTeamA;

    state.teams.B =
        newTeamB;

    state.showScoreControls =
        newShowScoreControls;

    state.singleSet =
        newSingleSet;


    if (formatChanged || singleSetChanged) {

        state.format =
            newFormat;

        state.currentSet =
            1;

        state.scores.A =
            0;

        state.scores.B =
            0;

        state.setsWon.A =
            0;

        state.setsWon.B =
            0;

        state.completedSets =
            [];

        state.history =
            [];

    }


    closeSettings();

    render();

}


/* =============================================================
   TEAM NAME CLICK
============================================================= */

teamNameA.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        openSettings();

    }
);


teamNameB.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        openSettings();

    }
);


/* =============================================================
   BUTTON CONTROLS
============================================================= */

document.querySelectorAll(".score-button").forEach(button => {
    button.addEventListener("pointerdown", event => {
        event.stopPropagation();
    });

    button.addEventListener("click", event => {
        event.stopPropagation();
        const team = button.dataset.team;
        const action = button.dataset.action;
        scorePoint(team, action === "add" ? 1 : -1);
        dismissFirstLaunchHint();
    });
});

undoButton.addEventListener("click", event => {
    event.stopPropagation();
    resetControlsHideTimer();
    undo();
});


newSetButton.addEventListener("click", event => {
    event.stopPropagation();
    resetControlsHideTimer();
    newSet();
});


newMatchButton.addEventListener("click", event => {
    event.stopPropagation();
    resetControlsHideTimer();
    newMatch();
});


settingsButton.addEventListener("click", event => {
    event.stopPropagation();
    resetControlsHideTimer();
    openSettings();
});

controlsToggle.addEventListener("click", event => {
    event.stopPropagation();
    const hidden = controls.classList.contains("controls-hidden");
    clearTimeout(controlsHideTimer);
    setControlsHidden(!hidden);

    if (hidden) {
        controlsHideTimer = setTimeout(() => setControlsHidden(true), CONTROLS_HIDE_DELAY);
    }
});

cancelSettings.addEventListener("click", closeSettings);
saveSettings.addEventListener("click", saveSettingsHandler);

/* =============================================================
   ANNOUNCEMENT BUTTON
============================================================= */

announcementButton.addEventListener(
    "click",
    () => {

        const action =
            announcementButton.dataset.action;


        if (action === "next-set") {

            startNextSet();

        }

        else if (action === "new-match") {

            announcement.classList.remove("active");

            newMatch();

        }

    }
);


/* =============================================================
   SWIPE DETECTION
============================================================= */

document
    .querySelectorAll(".team")
    .forEach(teamElement => {

        let startX = 0;
        let startY = 0;

        let pointerDown = false;


        teamElement.addEventListener(
            "pointerdown",
            event => {

                /*
                 * Ignore touches that begin on
                 * interactive controls.
                 */

                if (
                    event.target.closest("button") ||
                    event.target.closest(".team-name")
                ) {
                    return;
                }


                pointerDown = true;

                startX =
                    event.clientX;

                startY =
                    event.clientY;

                teamElement.setPointerCapture(
                    event.pointerId
                );

            }
        );


        teamElement.addEventListener("pointerup", event => {

            if (!pointerDown) return;

            pointerDown = false;

            const endX = event.clientX;
            const endY = event.clientY;
            const deltaX = endX - startX;
            const deltaY = endY - startY;

            /*
             * Determine whether this was
             * primarily a vertical swipe.
             */

            const vertical = Math.abs(deltaY) > Math.abs(deltaX);

            /*
             * Require a minimum movement
             * so a simple tap does not
             * accidentally score.
             */

            const validSwipe = Math.abs(deltaY) >= 50 && vertical;

            if (!validSwipe) return;

            dismissFirstLaunchHint();

            const team = teamElement.dataset.team;

            /*
             * Swipe UP = +1
             */

            if (deltaY < 0) scorePoint(team, 1);

            /*
             * Swipe DOWN = -1
             */

            else scorePoint(team, -1);
        }
        );


        teamElement.addEventListener("pointercancel", () => {
            pointerDown = false;
        });
    });


/* =============================================================
   KEYBOARD SUPPORT
   ============================================================= */

document.addEventListener(
    "keydown",
    event => {

        switch (event.key) {

            case "ArrowUp":
                scorePoint("A", 1);
                break;

            case "ArrowDown":
                scorePoint("A", -1);
                break;

            case "w":
            case "W":
                scorePoint("B", 1);
                break;

            case "s":
            case "S":
                scorePoint("B", -1);
                break;

            case "z":
            case "Z":
                undo();
                break;

        }

    }
);

function dismissFirstLaunchHint() {
    if (!firstLaunchHint || firstLaunchHint.classList.contains("dismissed")) {
        return;
    }

    firstLaunchHint.classList.add("dismissed");
    localStorage.setItem(HINT_SEEN_KEY, "true");
}

function initializeFirstLaunchHint() {
    if (localStorage.getItem(HINT_SEEN_KEY) === "true") {
        firstLaunchHint.classList.add("dismissed");
        return;
    }

    setTimeout(dismissFirstLaunchHint, 8000);
}

function toggleHelp() {
    const isHidden = helpContent.hasAttribute("hidden");

    helpContent.toggleAttribute("hidden", !isHidden);
    helpButton.setAttribute("aria-expanded", String(isHidden));
}

helpButton.addEventListener("click", toggleHelp);

initializeFirstLaunchHint();
resetControlsHideTimer();


/* =============================================================
   INITIALIZE
============================================================= */

render();