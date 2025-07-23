import { getState, updateState, saveSettings } from './state.js';
import { fetchAndDisplayWeather, getLocationWeather } from './api.js';
import { createParticles, updateBackground, resizeCanvas, isNightTime } from './particles.js';
import {
    showMessage,
    renderCurrentWeather,
    generateForecast,
    generateHourlyForecast,
    generateRecommendations
} from './ui.js';

export function initApp() {
    setupCanvas();
    setupEventListeners();
    setupResizeHandler();

    const { currentCity } = getState();
    fetchAndDisplayWeather(currentCity || 'Москва');
}

function setupCanvas() {
    const particleCanvas = document.getElementById('particle-canvas');
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function setupEventListeners() {
    const form = document.getElementById('weather-form');
    const input = document.getElementById('city-input');
    const themeToggle = document.getElementById('theme-toggle');
    const locationBtn = document.getElementById('location-btn');
    const unitToggle = document.getElementById('unit-toggle');
    const tabs = document.querySelectorAll('.tab');
    const scrollButtons = document.querySelectorAll('.scroll-btn');

    form.addEventListener('submit', handleFormSubmit);
    input.addEventListener('input', handleAutocomplete);
    themeToggle.addEventListener('click', toggleTheme);
    locationBtn.addEventListener('click', getLocationWeather);
    unitToggle.addEventListener('click', toggleUnits);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => handleTabSwitch(tab));
    });

    scrollButtons.forEach(btn => {
        btn.addEventListener('click', () => handleScroll(btn));
    });

    document.getElementById('autocomplete-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('autocomplete-item')) {
            const cityName = e.target.dataset.city;
            document.getElementById('city-input').value = cityName;
            document.getElementById('autocomplete-container').style.display = 'none';
            fetchAndDisplayWeather(cityName);
        }
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const city = document.getElementById('city-input').value.trim();
    if (!city) {
        showMessage('Пожалуйста, введите название города', 'error');
        return;
    }
    await fetchAndDisplayWeather(city);
}

function handleAutocomplete() {
    const input = document.getElementById('city-input');
    const query = input.value.trim();
    const container = document.getElementById('autocomplete-container');

    if (query.length < 2) {
        container.style.display = 'none';
        return;
    }

    clearTimeout(getState().autocompleteTimeout);

    updateState({
        autocompleteTimeout: setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ru&format=json`
                );

                const data = await response.json();
                container.innerHTML = '';

                if (data.results && data.results.length > 0) {
                    data.results.forEach(city => {
                        const item = document.createElement('div');
                        item.className = 'autocomplete-item';
                        item.textContent = `${city.name}, ${city.admin1 || city.country}`;
                        item.dataset.city = city.name;
                        container.appendChild(item);
                    });
                    container.style.display = 'block';
                } else {
                    container.style.display = 'none';
                }
            } catch (error) {
                console.error('Ошибка автодополнения:', error);
                container.style.display = 'none';
            }
        }, 300)
    });
}

function toggleTheme() {
    const state = getState();
    let newTheme;

    if (state.theme === 'default') newTheme = 'light';
    else if (state.theme === 'light') newTheme = 'dark';
    else newTheme = 'default';

    updateState({ theme: newTheme });
    applyTheme();
    saveSettings();

    if (newTheme === 'default' && state.weatherData) {
        const weatherCode = state.weatherData.weather.current.weather_code;
        const isNight = isNightTime();
        updateBackground(weatherCode, isNight);
    }
}

function toggleUnits() {
    const state = getState();
    const newUnit = state.unit === 'celsius' ? 'fahrenheit' : 'celsius';

    updateState({ unit: newUnit });
    document.getElementById('unit-toggle').textContent = newUnit === 'celsius' ? '°C / °F' : '°F / °C';

    if (state.weatherData) {
        renderCurrentWeather(state.weatherData.city, state.weatherData.weather);
        generateForecast(state.weatherData.weather);
        if (document.querySelector('.tab.active').dataset.tab === 'hourly') {
            generateHourlyForecast(state.weatherData.weather);
        }
    }

    saveSettings();
}

function handleTabSwitch(tab) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    if (tab.dataset.tab === 'daily') {
        document.getElementById('daily-forecast').style.display = 'grid';
        document.getElementById('hourly-forecast').style.display = 'none';
    } else {
        document.getElementById('daily-forecast').style.display = 'none';
        document.getElementById('hourly-forecast').style.display = 'block';
        if (getState().weatherData) {
            generateHourlyForecast(getState().weatherData.weather);
        }
    }
}

function handleScroll(btn) {
    const scrollAmount = 300;
    document.querySelector('.hourly-scroll').scrollBy({
        left: btn.classList.contains('left') ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
    });
}

function applyTheme() {
    const { theme } = getState();
    document.body.classList.remove('light-mode', 'dark-mode');

    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    updateThemeIcon();
}

function updateThemeIcon() {
    const { theme } = getState();
    const icon = document.querySelector('#theme-toggle i');
    icon.className = 'fas ';
    const themeTooltip = document.querySelector('.theme-tooltip');

    if (theme === 'default') {
        icon.classList.add('fa-cloud-sun');
        themeTooltip.textContent = 'Режим фона: Погода';
    } else if (theme === 'light') {
        icon.classList.add('fa-sun');
        themeTooltip.textContent = 'Режим фона: Светлый';
    } else {
        icon.classList.add('fa-moon');
        themeTooltip.textContent = 'Режим фона: Тёмный';
    }
}

function setupResizeHandler() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvas();
            const state = getState();
            if (state.weatherData && state.theme === 'default') {
                const weatherCode = state.weatherData.weather.current.weather_code;
                const isNight = isNightTime();
                updateBackground(weatherCode, isNight);
            }
        }, 200);
    });
}