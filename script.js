let timeLeft;
let timerId = null;
let isWorkMode = false;
let totalTime;
let londonOffset = 0;
let lastApiUpdate = 0;
let currentFocusTask = '';

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const addTimeButton = document.getElementById('addTime');
const modeToggleButton = document.getElementById('modeToggle');
const taglineElement = document.getElementById('tagline');
const timerDisplay = document.querySelector('.timer');
const clockDisplay = document.getElementById('clock');
const londonTimeDisplay = document.getElementById('london-time');
const focusTaskDisplay = document.getElementById('focusTask');
const focusModal = document.getElementById('focusModal');
const focusInput = document.getElementById('focusInput');
const submitFocusButton = document.getElementById('submitFocus');

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const REST_TIME = 5 * 60;  // 5 minutes in seconds
const WARNING_THRESHOLD = 60; // Show warning when 60 seconds remaining
const EXTRA_TIME = 5 * 60; // 5 minutes in seconds

function updateTitle(minutes, seconds) {
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (timeLeft === 0) {
        document.title = "Time's Up! 🎉";
    } else {
        document.title = `${timeString} - Pomodoro`;
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    
    // Update title immediately with the same values
    updateTitle(minutes, seconds);
    
    // Add warning class when time is running out
    if (timeLeft <= WARNING_THRESHOLD) {
        timerDisplay.classList.add('warning');
    } else {
        timerDisplay.classList.remove('warning');
    }
}

function showFocusTask(task) {
    if (task) {
        focusTaskDisplay.innerHTML = `<i class="fas fa-bullseye"></i>${task}`;
        focusTaskDisplay.classList.add('visible');
    } else {
        focusTaskDisplay.innerHTML = '';
        focusTaskDisplay.classList.remove('visible');
    }
}

function showFocusModal() {
    focusModal.style.display = 'flex';
    focusInput.focus();
    return new Promise((resolve) => {
        const handleSubmit = () => {
            const task = focusInput.value.trim();
            if (task) {
                focusModal.style.display = 'none';
                focusInput.value = '';
                resolve(task);
            }
        };

        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleSubmit();
            }
        };

        submitFocusButton.onclick = handleSubmit;
        focusInput.onkeypress = handleKeyPress;
    });
}

async function startTimer() {
    if (timerId !== null) return;
    
    if (isWorkMode && !currentFocusTask) {
        const task = await showFocusModal();
        if (!task) return;
        currentFocusTask = task;
        showFocusTask(currentFocusTask);
    }
    
    timerDisplay.classList.add('running');
    startButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
    addTimeButton.style.display = 'inline-block';
    
    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft === 0) {
            clearInterval(timerId);
            timerId = null;
            timerDisplay.classList.remove('running');
            startButton.style.display = 'inline-block';
            pauseButton.style.display = 'none';
            addTimeButton.style.display = 'none';
            
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play();
            
            document.title = "Time's Up! 🎉";
            
            alert(isWorkMode ? 'Work time is over! Take a break!' : 'Break time is over! Back to work!');
            toggleMode();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    timerDisplay.classList.remove('running');
    startButton.style.display = 'inline-block';
    pauseButton.style.display = 'none';
    addTimeButton.style.display = 'none';
    
    // Update title immediately when paused
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    updateTitle(minutes, seconds);
}

function addFiveMinutes() {
    timeLeft += EXTRA_TIME;
    totalTime += EXTRA_TIME;
    updateDisplay();
}

function toggleMode() {
    isWorkMode = !isWorkMode;
    timeLeft = isWorkMode ? WORK_TIME : REST_TIME;
    totalTime = timeLeft;
    updateDisplay();
    pauseTimer();
    
    // Reset title when switching modes
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    updateTitle(minutes, seconds);
    
    // Update icon and style
    const icon = modeToggleButton.querySelector('i');
    if (isWorkMode) {
        modeToggleButton.classList.add('work-mode');
        modeToggleButton.classList.remove('rest-mode');
        icon.className = 'fas fa-sun';
        taglineElement.textContent = 'Time To Focus!';
        currentFocusTask = ''; // Reset focus task when switching to work mode
    } else {
        modeToggleButton.classList.add('rest-mode');
        modeToggleButton.classList.remove('work-mode');
        icon.className = 'fas fa-moon';
        taglineElement.textContent = 'Time To Relax!';
        showFocusTask(''); // Hide focus task during rest mode
    }
}

// Function to fetch London time from API
async function fetchLondonTime() {
    try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/London');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        londonOffset = new Date(data.datetime).getTime() - Date.now();
        lastApiUpdate = Date.now();
        return true;
    } catch (error) {
        console.warn('Failed to fetch London time:', error);
        return false;
    }
}

// Function to update London time display
function updateLondonTime() {
    try {
        // Calculate London time using offset
        const now = new Date(Date.now() + londonOffset);
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        londonTimeDisplay.textContent = `London Time: ${hours}:${minutes}:${seconds}`;

        // Refresh API data every 15 minutes to stay accurate
        if (Date.now() - lastApiUpdate > 15 * 60 * 1000) {
            fetchLondonTime();
        }
    } catch (error) {
        console.warn('Error updating London time:', error);
        londonTimeDisplay.textContent = 'London Time: --:--:--';
    }
}

// Initialize London time
async function initializeLondonTime() {
    const success = await fetchLondonTime();
    if (success) {
        updateLondonTime();
    }
    // Start updating the clock every second regardless of initial fetch success
    setInterval(updateLondonTime, 1000);
}

// Start the London time updates
initializeLondonTime();

// Initialize
toggleMode();

// Hide pause button initially
pauseButton.style.display = 'none';
addTimeButton.style.display = 'none';

// Event listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
addTimeButton.addEventListener('click', addFiveMinutes);
modeToggleButton.addEventListener('click', toggleMode); 