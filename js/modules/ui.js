import { getState } from './state.js';
import { getWeatherIcon, getWeatherDescription } from './utils.js';

export function showMessage(text, type = 'info') {
    const msg = document.querySelector('.msg');
    msg.textContent = text;
    msg.className = 'msg ' + type;

    setTimeout(() => {
        msg.textContent = '';
        msg.className = 'msg';
    }, 5000);
}

export function renderCurrentWeather(city, weatherData) {
    const { unit } = getState();
    const current = weatherData.current;

    document.querySelector('.city-name .name').textContent = city.name;
    document.querySelector('.city-name .country').textContent = city.country.toUpperCase();

    const tempValue = unit === 'celsius' ?
        Math.round(current.temperature_2m) :
        Math.round((current.temperature_2m * 9/5) + 32);

    const feelsLikeValue = unit === 'celsius' ?
        Math.round(current.apparent_temperature) :
        Math.round((current.apparent_temperature * 9/5) + 32);

    document.querySelector('.city-temp').innerHTML = `${tempValue}<sup>°${unit === 'celsius' ? 'C' : 'F'}</sup>`;

    const now = new Date();
    const hours = now.getHours();
    const isDay = hours > 6 && hours < 20;

    const iconElement = document.querySelector('.city-icon');
    iconElement.src = getWeatherIcon(current.weather_code, isDay);
    iconElement.alt = getWeatherDescription(current.weather_code);
    document.querySelector('.description').textContent = getWeatherDescription(current.weather_code);

    document.querySelector('.feels-like').textContent = `Ощущается: ${feelsLikeValue}°${unit === 'celsius' ? 'C' : 'F'}`;
    document.querySelector('.humidity').textContent = `Влажность: ${current.relative_humidity_2m}%`;
    document.querySelector('.wind').textContent = `Ветер: ${Math.round(current.wind_speed_10m)} м/с`;

    if (weatherData.daily.sunrise && weatherData.daily.sunset) {
        const sunrise = new Date(weatherData.daily.sunrise[0]);
        const sunset = new Date(weatherData.daily.sunset[0]);

        document.querySelector('.sunrise').textContent =
            `Восход: ${sunrise.getHours().toString().padStart(2, '0')}:${sunrise.getMinutes().toString().padStart(2, '0')}`;
        document.querySelector('.sunset').textContent =
            `Закат: ${sunset.getHours().toString().padStart(2, '0')}:${sunset.getMinutes().toString().padStart(2, '0')}`;
    }

    if (current.pressure_msl) {
        document.querySelector('.pressure').textContent = `Давление: ${Math.round(current.pressure_msl)} гПа`;
    }

    document.querySelectorAll('.weather-content > *').forEach(el => {
        el.classList.remove('fade-in');
        setTimeout(() => el.classList.add('fade-in'), 100);
    });
}

export function generateForecast(weatherData) {
    const { unit } = getState();
    const daily = weatherData.daily;
    const today = new Date();
    const forecastContainer = document.getElementById('daily-forecast');
    forecastContainer.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const dayDiv = document.createElement('div');
        dayDiv.className = 'forecast-day fade-in';
        if (i === 0) dayDiv.classList.add('active');

        const dateOptions = { weekday: 'short' };
        const dayName = date.toLocaleDateString('ru-RU', dateOptions);

        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth();

        const weatherCode = daily.weather_code[i];
        const weatherDesc = getWeatherDescription(weatherCode);
        const iconUrl = getWeatherIcon(weatherCode);

        const minTemp = unit === 'celsius' ?
            Math.round(daily.temperature_2m_min[i]) :
            Math.round((daily.temperature_2m_min[i] * 9/5) + 32);

        const maxTemp = unit === 'celsius' ?
            Math.round(daily.temperature_2m_max[i]) :
            Math.round((daily.temperature_2m_max[i] * 9/5) + 32);

        dayDiv.innerHTML = `
            <div class="forecast-date">${isToday ? 'Сегодня' : dayName}</div>
            <img class="forecast-icon" src="${iconUrl}" alt="${weatherDesc}">
            <div class="forecast-temp">${maxTemp}°</div>
            <div class="forecast-minmax">
                <span>${minTemp}°</span>
                <span>${maxTemp}°</span>
            </div>
        `;

        forecastContainer.appendChild(dayDiv);
    }
}

export function generateHourlyForecast(weatherData) {
    const { unit } = getState();
    const hourlyContainer = document.querySelector('.hourly-scroll');
    hourlyContainer.innerHTML = '';

    const hourly = weatherData.hourly;
    const now = new Date();
    const currentHour = now.getHours();

    for (let i = 0; i < 24; i++) {
        const hourIndex = currentHour + i;
        if (hourIndex >= hourly.time.length) break;

        const hourData = {
            time: hourly.time[hourIndex],
            temp: hourly.temperature_2m[hourIndex],
            code: hourly.weather_code[hourIndex]
        };

        const hourDiv = document.createElement('div');
        hourDiv.className = 'hourly-item fade-in';

        const hourDate = new Date(hourData.time);
        const hour = hourDate.getHours();
        const displayHour = hour < 10 ? `0${hour}:00` : `${hour}:00`;

        const weatherDesc = getWeatherDescription(hourData.code);
        const iconUrl = getWeatherIcon(hourData.code, hour > 6 && hour < 20);

        const temp = unit === 'celsius' ?
            Math.round(hourData.temp) :
            Math.round((hourData.temp * 9/5) + 32);

        hourDiv.innerHTML = `
            <div class="hourly-time">${displayHour}</div>
            <img class="hourly-icon" src="${iconUrl}" alt="${weatherDesc}">
            <div class="hourly-temp">${temp}°</div>
            <div class="hourly-desc">${weatherDesc}</div>
        `;

        hourlyContainer.appendChild(hourDiv);
    }
}

export function generateRecommendations(weatherData) {
    const current = weatherData.current;
    const recommendations = [];

    const temp = current.temperature_2m;
    const windSpeed = current.wind_speed_10m;
    const precipitation = current.precipitation || 0;
    const uvIndex = current.uv_index || 0;

    if (temp > 30) {
        recommendations.push({
            icon: 'fa-tshirt',
            text: 'Наденьте легкую одежду, сегодня жарко!'
        });
        recommendations.push({
            icon: 'fa-sun',
            text: 'Используйте солнцезащитный крем'
        });
    } else if (temp > 20) {
        recommendations.push({
            icon: 'fa-tshirt',
            text: 'Наденьте легкую одежду, сегодня тепло!'
        });
        recommendations.push({
            icon: 'fa-sun',
            text: 'Идеальный день для прогулки в парке'
        });
    } else if (temp > 10) {
        recommendations.push({
            icon: 'fa-jacket',
            text: 'Наденьте легкую куртку'
        });
    } else {
        recommendations.push({
            icon: 'fa-snowflake',
            text: 'Наденьте теплую куртку и шапку'
        });
        recommendations.push({
            icon: 'fa-mug-hot',
            text: 'Согрейтесь горячим чаем или какао'
        });
    }

    if (precipitation > 5) {
        recommendations.push({
            icon: 'fa-umbrella',
            text: 'Возьмите зонт, ожидаются осадки'
        });
    } else if (precipitation > 2) {
        recommendations.push({
            icon: 'fa-cloud-rain',
            text: 'Возможен небольшой дождь'
        });
    }

    if (windSpeed > 8) {
        recommendations.push({
            icon: 'fa-wind',
            text: 'Сильный ветер, будьте осторожны'
        });
    } else if (windSpeed > 5) {
        recommendations.push({
            icon: 'fa-wind',
            text: 'Ветрено, оденьтесь теплее'
        });
    }

    if (uvIndex > 7) {
        recommendations.push({
            icon: 'fa-sun',
            text: 'Высокий УФ-индекс, защитите кожу'
        });
    } else if (uvIndex > 4) {
        recommendations.push({
            icon: 'fa-sunglasses',
            text: 'Умеренный УФ-индекс, используйте защиту'
        });
    }

    const recContainer = document.querySelector('.recommendation-card');
    recContainer.innerHTML = '';

    recommendations.forEach(rec => {
        const recEl = document.createElement('div');
        recEl.className = 'recommendation-content fade-in';
        recEl.innerHTML = `<i class="fas ${rec.icon}"></i><span>${rec.text}</span>`;
        recContainer.appendChild(recEl);
    });
}