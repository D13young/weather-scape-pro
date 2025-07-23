import { getState, updateState } from './state.js';

const particleCanvas = document.getElementById('particle-canvas');
const ctx = particleCanvas.getContext('2d');

export function createParticles(type, isNight = false) {
    const canvas = particleCanvas;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const settings = {
        sunny: { count: 50, color: 'rgba(255, 215, 0, 0.8)', size: [2, 5] },
        rainy: { count: 100, color: 'rgba(135, 206, 235, 0.6)', size: [1, 3] },
        snowy: { count: 150, color: 'rgba(255, 255, 255, 0.8)', size: [2, 6] },
        night: { count: 200, color: 'rgba(255, 255, 255, 0.6)', size: [1, 3] },
        storm: { count: 80, color: 'rgba(255, 50, 50, 0.4)', size: [1, 4] },
        overcast: { count: 70, color: 'rgba(200, 200, 200, 0.5)', size: [2, 5] },
        aurora: { count: 80, color: 'rgba(100, 255, 200, 0.4)', size: [3, 8] },
        sunset: { count: 70, color: 'rgba(255, 100, 50, 0.7)', size: [3, 7] },
        default: { count: 30, color: 'rgba(200, 200, 200, 0.5)', size: [2, 5] }
    };

    const config = settings[type] || settings.default;

    const particles = [];
    for (let i = 0; i < config.count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * (config.size[1] - config.size[0]) + config.size[0],
            color: config.color
        });
    }

    particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    updateState({ particles });
}

export function updateBackground(weatherCode, isNight = false) {
    if (getState().theme !== 'default') return;

    document.body.classList.remove(
        'sunny-bg', 'rainy-bg', 'cloudy-bg', 'night-bg',
        'storm-bg', 'overcast-bg', 'snowy-bg', 'aurora-bg',
        'sunset-bg', 'night-rainy-bg', 'night-storm-bg', 'night-snowy-bg'
    );

    const weatherType = getWeatherType(weatherCode);
    let bgClass;
    let particleType = weatherType;

    switch(weatherType) {
        case 'storm':
            bgClass = isNight ? 'night-storm-bg' : 'storm-bg';
            break;
        case 'rainy':
            bgClass = isNight ? 'night-rainy-bg' : 'rainy-bg';
            break;
        case 'snowy':
            bgClass = isNight ? 'night-snowy-bg' : 'snowy-bg';
            break;
        case 'aurora':
            bgClass = 'aurora-bg';
            particleType = 'aurora';
            break;
        case 'sunset':
            bgClass = 'sunset-bg';
            particleType = 'sunset';
            break;
        case 'night':
            bgClass = 'night-bg';
            particleType = 'night';
            break;
        default:
            bgClass = isNight ? 'night-bg' : 'sunny-bg';
    }

    document.body.classList.add(bgClass);
    createParticles(particleType, isNight);
}

export function getWeatherType(code) {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;

    if (code === 95 && Math.random() > 0.7) return 'aurora';
    if (code === 80 && hour > 17 && hour < 20) return 'sunset';

    if (code >= 95 && code <= 99) return 'storm';
    if (code >= 71 && code <= 77 || code >= 85 && code <= 86) return 'snowy';
    if (code >= 51 && code <= 67 || code >= 80 && code <= 82) return 'rainy';
    if (isNight) return 'night';
    if (code === 3) return 'overcast';
    if (code === 1 || code === 2 || code === 45 || code === 48) return 'cloudy';

    return 'sunny';
}

export function resizeCanvas() {
    const canvas = document.getElementById('particle-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const state = getState();
    if (state.weatherData && state.theme === 'default') {
        const weatherCode = state.weatherData.weather.current.weather_code;
        const isNight = isNightTime();
        updateBackground(weatherCode, isNight);
    }
}

export function isNightTime() {
    const hour = new Date().getHours();
    return hour < 6 || hour > 20;
}