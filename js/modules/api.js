import { getState, updateState, saveSettings } from './state.js';
import { showMessage, renderCurrentWeather, generateForecast, generateHourlyForecast, generateRecommendations } from './ui.js';
import { updateBackground, getWeatherType } from './particles.js';

export async function fetchAndDisplayWeather(cityName) {
    try {
        showLoading();
        showMessage('Получение данных...', 'info');

        const city = await getCityCoordinates(cityName);
        const weatherData = await getWeather(city.latitude, city.longitude);

        updateState({
            weatherData: { city, weather: weatherData },
            currentCity: city.name
        });
        saveSettings();

        renderCurrentWeather(city, weatherData);
        generateForecast(weatherData);
        generateRecommendations(weatherData);

        if (getState().theme === 'default') {
            const weatherCode = weatherData.current.weather_code;
            const weatherType = getWeatherType(weatherCode);
            updateBackground(weatherType, weatherCode);
        }

        showMessage('Данные успешно получены!', 'success');
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage(error.message || 'Произошла ошибка', 'error');
    } finally {
        hideLoading();
    }
}

export async function getLocationWeather() {
    if (!navigator.geolocation) {
        showMessage('Геолокация не поддерживается вашим браузером', 'error');
        return;
    }

    showMessage('Определение местоположения...', 'info');

    navigator.geolocation.getCurrentPosition(
        async position => {
            try {
                const { latitude, longitude } = position.coords;
                const city = await reverseGeocode(latitude, longitude);
                const input = document.getElementById('city-input');
                input.value = city;
                await fetchAndDisplayWeather(city);
            } catch (error) {
                console.error('Ошибка геокодирования:', error);
                showMessage(error.message, 'error');
            }
        },
        error => handleGeolocationError(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

async function getCityCoordinates(cityName) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`
        );

        if (!response.ok) throw new Error('Ошибка получения координат города');

        const data = await response.json();
        if (!data.results || data.results.length === 0) throw new Error('Город не найден');

        return {
            name: data.results[0].name,
            country: data.results[0].country_code,
            latitude: data.results[0].latitude,
            longitude: data.results[0].longitude
        };
    } catch (error) {
        showMessage(error.message, 'error');
        throw error;
    }
}

async function getWeather(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,pressure_msl,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`
        );

        if (!response.ok) throw new Error('Ошибка получения данных о погоде');
        return await response.json();
    } catch (error) {
        showMessage(error.message, 'error');
        throw error;
    }
}

async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=ru`
        );

        if (!response.ok) throw new Error('Ошибка получения данных о местоположении');

        const data = await response.json();
        if (!data.address) throw new Error('Не удалось определить город');

        const city = data.address.city || data.address.town || data.address.village || data.address.county;
        if (!city) throw new Error('Город не найден в ответе');

        return city;
    } catch (error) {
        console.error('Ошибка геокодирования:', error);
        throw error;
    }
}

function handleGeolocationError(error) {
    let message = 'Не удалось получить местоположение';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Информация о местоположении недоступна';
            break;
        case error.TIMEOUT:
            message = 'Время ожидания геолокации истекло';
            break;
    }
    showMessage(message, 'error');
}

function showLoading() {
    document.querySelector('.loading').style.display = 'flex';
    document.querySelector('.weather-content').style.display = 'none';
}

function hideLoading() {
    document.querySelector('.loading').style.display = 'none';
    document.querySelector('.weather-content').style.display = 'block';
}