const state = {
    unit: 'celsius',
    theme: 'default',
    currentCity: '',
    weatherData: null,
    particles: [],
    autocompleteTimeout: null
};

export function getState() {
    return state;
}

export function updateState(newState) {
    Object.assign(state, newState);
}

export function saveSettings() {
    localStorage.setItem('weatherAppSettings', JSON.stringify({
        unit: state.unit,
        theme: state.theme,
        currentCity: state.currentCity
    }));
}

export function loadSettings() {
    const saved = JSON.parse(localStorage.getItem('weatherAppSettings'));
    if (saved) {
        state.unit = saved.unit || 'celsius';
        state.theme = saved.theme || 'default';
        state.currentCity = saved.currentCity || 'Москва';
    }
}