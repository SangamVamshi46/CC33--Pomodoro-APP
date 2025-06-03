let timeLeft;
let timerId = null;
let isWorkMode = false;
let totalTime;
let londonOffset = 0;
let lastApiUpdate = 0;

const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const modeToggleButton = document.getElementById('modeToggle');
const taglineElement = document.getElementById('tagline');
const timerDisplay = document.querySelector('.timer');
const clockDisplay = document.getElementById('clock');
const londonTimeDisplay = document.getElementById('london-time');

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const REST_TIME = 5 * 60;  // 5 minutes in seconds
const WARNING_THRESHOLD = 60; // Show warning when 60 seconds remaining

// Create SVG circle for progress
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
svg.setAttribute('class', 'progress-ring');
svg.setAttribute('width', '300');
svg.setAttribute('height', '300');

const radius = 145;
const circumference = radius * 2 * Math.PI;

circle.setAttribute('class', 'progress-ring__circle');
circle.setAttribute('r', radius);
circle.setAttribute('cx', '150');
circle.setAttribute('cy', '150');
circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

svg.appendChild(circle);
document.querySelector('.container').appendChild(svg);

function setProgress(percent) {
    const offset = circumference - (percent / 100 * circumference);
    circle.style.strokeDashoffset = offset;
}

// Add function to update document title
function updateTitle(minutes, seconds) {
    if (timeLeft === 0) {
        document.title = "Pomodoro Complete! 🎉";
    } else {
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${timeString} - Pomodoro Timer`;
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    
    // Update title with current time
    updateTitle(minutes, seconds);
    
    // Update progress circle
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    setProgress(progress);
    
    // Add warning class when time is running out
    if (timeLeft <= WARNING_THRESHOLD) {
        timerDisplay.classList.add('warning');
    } else {
        timerDisplay.classList.remove('warning');
    }
}

function startTimer() {
    if (timerId !== null) return;
    
    timerDisplay.classList.add('running');
    startButton.style.display = 'none';
    pauseButton.style.display = 'inline-block';
    
    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft === 0) {
            clearInterval(timerId);
            timerId = null;
            timerDisplay.classList.remove('running');
            startButton.style.display = 'inline-block';
            pauseButton.style.display = 'none';
            
            // Play notification sound
            const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            audio.play();
            
            // Update title for completion
            document.title = "Pomodoro Complete! 🎉";
            
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
    
    // Update title to show paused state
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    updateTitle(minutes, seconds);
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
    
    // Update progress circle color
    circle.style.stroke = isWorkMode ? '#52B69A' : '#34A0A4';
    
    // Update button text and style
    modeToggleButton.textContent = isWorkMode ? 'Rest Mode' : 'Work Mode';
    if (isWorkMode) {
        modeToggleButton.classList.add('work-mode');
        modeToggleButton.classList.remove('rest-mode');
        taglineElement.textContent = 'Time To Focus!';
    } else {
        modeToggleButton.classList.add('rest-mode');
        modeToggleButton.classList.remove('work-mode');
        taglineElement.textContent = 'Time To Relax!';
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

// Event listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
modeToggleButton.addEventListener('click', toggleMode); 