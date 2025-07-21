const state = {
    unit: 'celsius',
    theme: 'default',
    currentCity: '',
    weatherData: null,
    particles: [],
    autocompleteTimeout: null
};

export function loadSettings() {
    const savedUnit = localStorage.getItem('weatherUnit');
    const savedTheme = localStorage.getItem('theme');
    const savedCity = localStorage.getItem('lastCity');

    if (savedUnit) state.unit = savedUnit;
    if (savedTheme) {
        state.theme = savedTheme;
        applyTheme();
    }
    if (savedCity) state.currentCity = savedCity;
}

export function saveSettings() {
    localStorage.setItem('weatherUnit', state.unit);
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('lastCity', state.currentCity);
}

export function getState() {
    return state;
}

export function updateState(newState) {
    Object.assign(state, newState);
}

function applyTheme() {
    document.body.classList.remove('light-mode', 'dark-mode');

    if (state.theme === 'light') {
        document.body.classList.add('light-mode');
    } else if (state.theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}