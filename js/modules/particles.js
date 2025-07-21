import { getState, updateState } from './state.js';

const particleCanvas = document.getElementById('particle-canvas');
const ctx = particleCanvas.getContext('2d');

export function createParticles(type) {
    let count, size, speed;

    switch(type) {
        case 'rain':
            count = 80;
            size = { min: 1, max: 3 };
            speed = { min: 5, max: 10 };
            break;
        case 'heavy-rain':
            count = 120;
            size = { min: 2, max: 5 };
            speed = { min: 8, max: 15 };
            break;
        case 'snow':
            count = 150;
            size = { min: 2, max: 6 };
            speed = { min: 1, max: 3 };
            break;
        case 'fog':
            count = 50;
            size = { min: 2, max: 5 };
            speed = { min: 0.02, max: 0.3 };
            break;
        case 'thunder':
            count = 50;
            size = { min: 1, max: 3 };
            speed = { min: 10, max: 20 };
            break;
        case 'stars':
            count = 150;
            size = { min: 1, max: 3 };
            speed = 0;
            break;
        case 'sun':
        default:
            count = 50;
            size = { min: 1, max: 3 };
            speed = 0;
    }

    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            size: Math.random() * (size.max - size.min) + size.min,
            speed: Math.random() * (speed.max - speed.min) + speed.min,
            type: type,
            opacity: type === 'stars' || type === 'sun' ? Math.random() * 0.5 + 0.5 : 1
        });
    }

    updateState({ particles });
    drawParticles();
}

function drawParticles() {
    const { particles } = getState();
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    particles.forEach(p => {
        ctx.save();
        ctx.beginPath();

        if (p.type === 'rain' || p.type === 'heavy-rain') {
            ctx.fillStyle = `rgba(135, 206, 235, ${p.opacity})`;
            ctx.fillRect(p.x, p.y, 1, p.size * (p.type === 'heavy-rain' ? 8 : 5));
        }
        else if (p.type === 'snow') {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (p.type === 'fog') {
            ctx.fillStyle = `rgba(200, 200, 200, ${p.opacity * 0.3})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (p.type === 'thunder') {
            if (Math.random() > 0.99) {
                ctx.fillStyle = `rgba(255, 255, 200, ${Math.random() * 0.8})`;
                ctx.fillRect(0, 0, particleCanvas.width, particleCanvas.height);
            }
        }
        else if (p.type === 'stars' || p.type === 'sun') {
            ctx.fillStyle = p.type === 'sun' ?
                `rgba(255, 215, 0, ${p.opacity})` :
                `rgba(255, 255, 255, ${p.opacity})`;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        if (p.type === 'rain' || p.type === 'heavy-rain' ||
            p.type === 'snow' || p.type === 'fog') {
            p.y += p.speed;
            if (p.y > particleCanvas.height) {
                p.y = -10;
                p.x = Math.random() * particleCanvas.width;
            }
        }

        ctx.restore();
    });

    requestAnimationFrame(drawParticles);
}

export function updateBackground(weatherType, weatherCode) {
    if (getState().theme !== 'default') return;

    document.body.classList.remove(
        'sunny-bg', 'rainy-bg', 'cloudy-bg', 'night-bg', 'storm-bg',
        'overcast-bg', 'snowy-bg'
    );

    switch(weatherType) {
        case 'sunny':
            document.body.classList.add('sunny-bg');
            createParticles('sun');
            break;
        case 'rainy':
            document.body.classList.add('rainy-bg');
            createParticles(weatherCode >= 80 ? 'heavy-rain' : 'rain');
            break;
        case 'cloudy':
            document.body.classList.add('cloudy-bg');
            createParticles(weatherCode === 45 || weatherCode === 48 ? 'fog': 'cloudy');
            break;
        case 'night':
            document.body.classList.add('night-bg');
            createParticles('stars');
            break;
        case 'storm':
            document.body.classList.add('storm-bg');
            createParticles('thunder');
            break;
        case 'overcast':
            document.body.classList.add('overcast-bg');
            createParticles('fog');
            break;
        case 'snowy':
            document.body.classList.add('snowy-bg');
            createParticles('snow');
            break;
        default:
            document.body.classList.add('sunny-bg');
            createParticles('sun');
    }
}

export function getWeatherType(code) {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;

    if (code >= 95 && code <= 99) return 'storm';
    if (code >= 71 && code <= 77) return 'snowy';
    if (code >= 85 && code <= 86) return 'snowy';
    if (code >= 51 && code <= 67) return 'rainy';
    if (code >= 80 && code <= 82) return 'rainy';
    if (isNight) return 'night';
    if (code === 3) return 'overcast';
    if (code === 1 || code === 2) return 'cloudy';
    if (code === 45 || code === 48) return 'cloudy';

    return 'sunny';
}