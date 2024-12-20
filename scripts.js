document.addEventListener('DOMContentLoaded', () => {
    // References to HTML elements
    const startTimerButton = document.getElementById("startTimerButton");
    const objectivePrompt = document.getElementById("objectivePrompt");
    const startActualTimerButton = document.getElementById("startActualTimerButton");
    const objectiveInput = document.getElementById("objectiveInput");
    const timerDisplay = document.getElementById("timerDisplay");
    const timerElement = document.getElementById("timer");
    const achievementPrompt = document.getElementById("achievementPrompt");
    const achievementInput = document.getElementById("achievementInput");
    const nextTargetButton = document.getElementById("nextTargetButton");
    const timerHistory = document.getElementById("timerHistory");

    let timer = null;
    let seconds = 0;
    let history = [];

    // Event listeners
    startTimerButton.addEventListener("click", () => {
        if (!objectivePrompt) {
            console.error("objectivePrompt element not found");
            return;
        }
        objectivePrompt.classList.remove("hidden");
    });

    startActualTimerButton.addEventListener("click", () => {
        const objective = objectiveInput.value.trim();
        if (!objective) {
            alert("Please enter an objective to start the timer.");
            return;
        }

        objectivePrompt.classList.add("hidden");
        timerDisplay.classList.remove("hidden");
        startTimer(objective);
    });

    nextTargetButton.addEventListener("click", () => {
        const achievement = achievementInput.value.trim();
        if (!achievement) {
            alert("Please enter what you achieved.");
            return;
        }

        recordHistory(achievement);
        resetUI();
    });

    // Timer functionality
    function startTimer(objective) {
        seconds = 0;
        timer = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);

        setTimeout(() => {
            clearInterval(timer);
            timerDisplay.classList.add("hidden");
            achievementPrompt.classList.remove("hidden");
            nextTargetButton.disabled = false;
        }, 5000); // 5 seconds for demo purposes
    }

    function recordHistory(achievement) {
        const objective = objectiveInput.value;
        history.push({
            time: timerElement.textContent,
            objective,
            achievement,
        });

        if (history.length > 5) history.shift();

        updateHistoryUI();
    }

    function updateHistoryUI() {
        timerHistory.innerHTML = "";
        history.forEach((entry) => {
            const li = document.createElement("li");
            li.textContent = `Time: ${entry.time}, Objective: ${entry.objective}, Achievement: ${entry.achievement}`;
            timerHistory.appendChild(li);
        });
    }

    function resetUI() {
        achievementPrompt.classList.add("hidden");
        objectiveInput.value = "";
        achievementInput.value = "";
        nextTargetButton.disabled = true;
    }

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').then(() => {
            console.log('Service Worker Registered');
        });
    }
});
