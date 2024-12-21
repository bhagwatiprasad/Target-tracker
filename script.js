document.addEventListener('DOMContentLoaded', () => {
    // References to HTML elements
    const startTimerButton = document.getElementById("startTimerButton");
    const objectivePrompt = document.getElementById("objectivePrompt");
    const startActualTimerButton = document.getElementById("startActualTimerButton");
    const objectiveInput = document.getElementById("objectiveInput");
    const minutesInput = document.getElementById("minutesInput");
    const timerDisplay = document.getElementById("timerDisplay");
    const timerElement = document.getElementById("timer");
    const achievementPrompt = document.getElementById("achievementPrompt");
    const achievementInput = document.getElementById("achievementInput");
    const nextTargetButton = document.getElementById("nextTargetButton");
    const timerHistory = document.getElementById("timerHistory").getElementsByTagName('tbody')[0];
    const earlyAchievementButton = document.getElementById("earlyAchievementButton");

    // Create audio element for alarm
    const alarmSound = new Audio('alarm-sound.mp3');
    alarmSound.loop = true;
    let originalDuration = 0; // Store original duration

    // Request notification permission on load
    if ("Notification" in window) {
        Notification.requestPermission();
    }

    // Simple audio play function with retry
    function playAlarm() {
        // Try to play sound
        alarmSound.play().catch(error => {
            console.error("Error playing alarm:", error);
            // Retry after a short delay
            setTimeout(() => {
                alarmSound.play().catch(err => {
                    console.error("Retry failed:", err);
                    // If sound fails again, show notification
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification("Timer Finished!", {
                            body: "Your timer has ended. Click to check your achievement.",
                            icon: "/favicon.ico"
                        });
                    }
                });
            }, 1000); // Retry after 1 second
        });
    }

    // State variables
    let timer = null;
    let seconds = 0;
    let currentObjective = '';
    let timerStartTime = null;
    let timerEndTime = null;
    let history = JSON.parse(localStorage.getItem('timerHistory') || '[]');

    // Initialize state from localStorage
    function initializeState() {
        const savedState = JSON.parse(localStorage.getItem('timerState') || '{}');
        if (savedState.isRunning) {
            const now = Date.now();
            timerStartTime = savedState.startTime;
            timerEndTime = savedState.endTime;
            currentObjective = savedState.objective;
            originalDuration = savedState.originalDuration; // Restore original duration

            const totalSeconds = Math.floor((timerEndTime - timerStartTime) / 1000);
            const elapsedSeconds = Math.floor((now - timerStartTime) / 1000);
            seconds = Math.max(0, totalSeconds - elapsedSeconds);

            objectivePrompt.classList.add('hidden');
            startTimerButton.classList.add('hidden');

            if (seconds > 0) {
                timerDisplay.classList.remove('hidden');
                achievementPrompt.classList.add('hidden');
                startTimer(currentObjective, seconds / 60, false);
            } else {
                if (now >= timerEndTime) {
                    showAchievementPrompt();
                } else {
                    resetUI();
                    localStorage.removeItem('timerState');
                }
            }
        }
        updateHistoryUI();
    }

    // Save current state to localStorage
    function saveState() {
        if (timer) {
            const state = {
                isRunning: true,
                startTime: timerStartTime,
                endTime: timerEndTime,
                objective: currentObjective,
                originalDuration: originalDuration // Save original duration
            };
            localStorage.setItem('timerState', JSON.stringify(state));
        } else {
            localStorage.removeItem('timerState');
        }
        localStorage.setItem('timerHistory', JSON.stringify(history));
    }

    // Event listeners
    startTimerButton.addEventListener("click", () => {
        objectivePrompt.classList.remove("hidden");
        startTimerButton.classList.add("hidden");
    });

    startActualTimerButton.addEventListener("click", () => {
        const objective = objectiveInput.value.trim();
        const minutes = parseInt(minutesInput.value);

        if (!objective) {
            alert("Please enter an objective to start the timer.");
            return;
        }

        if (isNaN(minutes) || minutes < 1) {
            alert("Please enter a valid number of minutes.");
            return;
        }

        currentObjective = objective;
        originalDuration = minutes; // Store original duration
        objectivePrompt.classList.add("hidden");
        timerDisplay.classList.remove("hidden");
        startTimer(objective, minutes, true);
    });

    nextTargetButton.addEventListener("click", () => {
        const achievement = achievementInput.value.trim();
        if (!achievement) {
            alert("Please enter what you achieved.");
            return;
        }

        stopTimer();
        alarmShouldPlay = false; // Reset alarm flag
        alarmSound.pause();
        alarmSound.currentTime = 0;

        recordHistory(achievement);
        resetUI();
        saveState();
    });

    earlyAchievementButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to end the timer early?")) {
            stopTimer();
            showAchievementPrompt();
        }
    });

    // Add visibility change handling
    let isTabVisible = true;
    let alarmShouldPlay = false;

    document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
        if (isTabVisible) {
            // Resync timer when tab becomes visible
            const now = Date.now();
            seconds = Math.max(0, Math.floor((timerEndTime - now) / 1000));
            updateTimerDisplay();

            // Only show achievement prompt if timer just ended
            if (seconds <= 0 && timer) {
                clearInterval(timer);
                timer = null;
                showAchievementPrompt();
            }
        }
    });

    function startTimer(objective, minutes, isNewTimer) {
        if (isNewTimer) {
            seconds = Math.floor(minutes * 60);
            timerStartTime = Date.now();
            timerEndTime = timerStartTime + (seconds * 1000);
        }

        // Display the target
        const currentTargetElement = document.getElementById('currentTarget');
        currentTargetElement.textContent = `Target: ${objective}`;
        currentTargetElement.classList.remove('hidden');

        updateTimerDisplay();

        // Clear any existing timer
        if (timer) {
            clearInterval(timer);
        }

        timer = setInterval(() => {
            const now = Date.now();
            seconds = Math.max(0, Math.floor((timerEndTime - now) / 1000));
            updateTimerDisplay();
            saveState();

            if (seconds <= 0) {
                clearInterval(timer);
                timer = null;
                alarmShouldPlay = true;
                showAchievementPrompt();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // Update showAchievementPrompt to handle background state
    function showAchievementPrompt() {
        // Only proceed if not already showing achievement prompt
        if (achievementPrompt.classList.contains('hidden')) {
            timerDisplay.classList.add("hidden");
            achievementPrompt.classList.remove("hidden");
            startTimerButton.classList.add("hidden");
            nextTargetButton.disabled = false;

            // Set flag that alarm should be playing
            alarmShouldPlay = true;
            playAlarm();

            // Remove any existing target elements first
            const existingTargets = achievementPrompt.querySelectorAll('p');
            existingTargets.forEach(target => target.remove());

            // Display the complete objective
            const completeObjectiveElement = document.createElement('p');
            completeObjectiveElement.textContent = `Target: ${currentObjective}`;
            completeObjectiveElement.style.color = '#4CAF50';
            completeObjectiveElement.style.fontWeight = 'bold';
            achievementPrompt.insertBefore(completeObjectiveElement, achievementPrompt.firstChild);

            // Add early achievement note if timer was stopped early
            if (seconds > 0) {
                const earlyNote = document.createElement('p');
                const remainingMins = Math.ceil(seconds / 60);
                earlyNote.textContent = `(Completed ${remainingMins} minutes early)`;
                earlyNote.style.color = '#2196F3';
                earlyNote.style.fontSize = '0.9em';
                achievementPrompt.insertBefore(earlyNote, achievementPrompt.firstChild.nextSibling);
            }
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerElement.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function recordHistory(achievement) {
        const startTime = new Date(timerStartTime); // Use start time
        history.push({
            timestamp: startTime.getTime(),
            date: startTime.toLocaleString(), // Use start time
            duration: `${originalDuration} minutes`,
            objective: currentObjective,
            achievement: achievement
        });

        // Keep only the latest 5 records
        if (history.length > 5) {
            history = history.slice(-5);
        }

        updateHistoryUI();
        saveState();
    }

    function updateHistoryUI() {
        timerHistory.innerHTML = "";

        // Sort history by timestamp in descending order
        const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

        sortedHistory.forEach(entry => {
            const row = timerHistory.insertRow();
            const dateCell = row.insertCell(0);
            dateCell.textContent = entry.date;
            dateCell.setAttribute('data-label', 'Date & Time');

            const durationCell = row.insertCell(1);
            durationCell.textContent = entry.duration;
            durationCell.setAttribute('data-label', 'Duration');

            const objectiveCell = row.insertCell(2);
            objectiveCell.textContent = entry.objective;
            objectiveCell.setAttribute('data-label', 'Target');

            const achievementCell = row.insertCell(3);
            achievementCell.textContent = entry.achievement;
            achievementCell.setAttribute('data-label', 'Is Achieved');
        });
    }

    function resetUI() {
        stopTimer();
        achievementPrompt.classList.add("hidden");
        startTimerButton.classList.remove("hidden");
        objectiveInput.value = "";
        achievementInput.value = "";
        nextTargetButton.disabled = true;
        currentObjective = '';
        timerStartTime = null;
        timerEndTime = null;
        alarmShouldPlay = false; // Reset alarm flag

        // Clean up any existing target elements
        const existingTargets = achievementPrompt.querySelectorAll('p');
        existingTargets.forEach(target => target.remove());

        // Hide the current target
        const currentTargetElement = document.getElementById('currentTarget');
        currentTargetElement.classList.add('hidden');

        alarmSound.pause();
        alarmSound.currentTime = 0;
    }

    // Initialize the app state
    initializeState();
});