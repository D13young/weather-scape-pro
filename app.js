document.addEventListener('DOMContentLoaded', () => {
    // DOM элементы
    const form = document.getElementById('weather-form');
    const input = document.getElementById('city-input');
    const msg = document.querySelector('.msg');
    const themeToggle = document.getElementById('theme-toggle');
    const forecastContainer = document.getElementById('daily-forecast');
    const particleCanvas = document.getElementById('particle-canvas');
    const autocompleteContainer = document.getElementById('autocomplete-container');
    const locationBtn = document.getElementById('location-btn');
    const unitToggle = document.getElementById('unit-toggle');
    const hourlyContainer = document.getElementById('hourly-forecast');
    const dailyContainer = document.getElementById('daily-forecast');
    const tabs = document.querySelectorAll('.tab');
    const hourlyScroll = document.querySelector('.hourly-scroll');
    const scrollButtons = document.querySelectorAll('.scroll-btn');
    const themeTooltip = document.querySelector('.theme-tooltip');

    // Элементы для отображения данных
    const cityNameElement = document.querySelector('.city-name .name');
    const countryElement = document.querySelector('.city-name .country');
    const tempElement = document.querySelector('.city-temp');
    const iconElement = document.querySelector('.city-icon');
    const descriptionElement = document.querySelector('.description');
    const feelsLikeElement = document.querySelector('.feels-like');
    const humidityElement = document.querySelector('.humidity');
    const windElement = document.querySelector('.wind');
    const sunriseElement = document.querySelector('.sunrise');
    const sunsetElement = document.querySelector('.sunset');
    const pressureElement = document.querySelector('.pressure');

    // Состояние приложения
    const state = {
        unit: 'celsius',
        theme: 'default', // default, light, dark
        currentCity: '',
        weatherData: null,
        particles: [],
        autocompleteTimeout: null
    };

    // Инициализация
    function init() {
        loadSettings();
        setupCanvas();
        setupEventListeners();

        // Загружаем погоду по умолчанию или из сохранения
        if (state.currentCity) {
            fetchAndDisplayWeather(state.currentCity);
        } else {
            fetchAndDisplayWeather('Москва');
        }
    }

    // Загрузка настроек из localStorage
    function loadSettings() {
        const savedUnit = localStorage.getItem('weatherUnit');
        const savedTheme = localStorage.getItem('theme');
        const savedCity = localStorage.getItem('lastCity');

        if (savedUnit) state.unit = savedUnit;
        if (savedTheme) {
            state.theme = savedTheme;
            applyTheme();
        }
        if (savedCity) state.currentCity = savedCity;

        // Обновляем UI
        unitToggle.textContent = state.unit === 'celsius' ? '°C / °F' : '°F / °C';
    }

    // Сохранение настроек
    function saveSettings() {
        localStorage.setItem('weatherUnit', state.unit);
        localStorage.setItem('theme', state.theme);
        localStorage.setItem('lastCity', state.currentCity);
    }

    // Применение текущей темы
    function applyTheme() {
        // Удаляем все классы тем
        document.body.classList.remove('light-mode', 'dark-mode');

        // Применяем выбранную тему
        if (state.theme === 'light') {
            document.body.classList.add('light-mode');
        } else if (state.theme === 'dark') {
            document.body.classList.add('dark-mode');
        }

        updateThemeIcon();
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        // Переключение темы
        themeToggle.addEventListener('click', toggleTheme);

        // Отправка формы
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const city = input.value.trim();
            if (!city) {
                showMessage('Пожалуйста, введите название города', 'error');
                return;
            }
            await fetchAndDisplayWeather(city);
        });

        // Автодополнение
        input.addEventListener('input', handleAutocomplete);

        // Клик по автодополнению
        autocompleteContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('autocomplete-item')) {
                input.value = e.target.dataset.city;
                autocompleteContainer.style.display = 'none';
                fetchAndDisplayWeather(e.target.dataset.city);
            }
        });

        // Определение местоположения
        locationBtn.addEventListener('click', getLocation);

        // Переключение единиц измерения
        unitToggle.addEventListener('click', toggleUnits);

        // Переключение вкладок
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                if (tab.dataset.tab === 'daily') {
                    dailyContainer.style.display = 'grid';
                    hourlyContainer.style.display = 'none';
                } else {
                    dailyContainer.style.display = 'none';
                    hourlyContainer.style.display = 'block';
                    if (state.weatherData) {
                        generateHourlyForecast(state.weatherData.weather);
                    }
                }
            });
        });

        // Прокрутка почасового прогноза
        scrollButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const scrollAmount = 300;
                hourlyScroll.scrollBy({
                    left: btn.classList.contains('left') ? -scrollAmount : scrollAmount,
                    behavior: 'smooth'
                });
            });
        });
    }

    // Показать сообщение
    function showMessage(text, type = 'info') {
        msg.textContent = text;
        msg.className = 'msg ' + type;

        setTimeout(() => {
            msg.textContent = '';
            msg.className = 'msg';
        }, 5000);
    }

    // Показать загрузку
    function showLoading() {
        document.querySelector('.loading').style.display = 'flex';
        document.querySelector('.weather-content').style.display = 'none';
    }

    // Скрыть загрузку
    function hideLoading() {
        document.querySelector('.loading').style.display = 'none';
        document.querySelector('.weather-content').style.display = 'block';
    }

    // Настройка Canvas для частиц
    function setupCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
        const ctx = particleCanvas.getContext('2d');

        // Создание частиц
        function createParticles(type) {
            state.particles = [];
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

            for (let i = 0; i < count; i++) {
                state.particles.push({
                    x: Math.random() * particleCanvas.width,
                    y: Math.random() * particleCanvas.height,
                    size: Math.random() * (size.max - size.min) + size.min,
                    speed: Math.random() * (speed.max - speed.min) + speed.min,
                    type: type,
                    opacity: type === 'stars' || type === 'sun' ?
                        Math.random() * 0.5 + 0.5 : 1
                });
            }
        }

        // Отрисовка частиц
        function drawParticles() {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            state.particles.forEach(p => {
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
            });

            requestAnimationFrame(drawParticles);
        }

        function updateBackground(weatherType, weatherCode) {
            // Если выбран не режим по умолчанию, не применяем погодный фон
            if (state.theme !== 'default') return;

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

        window.createParticles = createParticles;
        window.updateBackground = updateBackground;

        createParticles('sun');
        drawParticles();

        window.addEventListener('resize', () => {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        });
    }

    // Переключение темы
    function toggleTheme() {
        // Циклическое переключение между режимами
        if (state.theme === 'default') {
            state.theme = 'light';
        } else if (state.theme === 'light') {
            state.theme = 'dark';
        } else {
            state.theme = 'default';
        }

        applyTheme();
        saveSettings();

        // Обновляем погодный фон только в режиме по умолчанию
        if (state.theme === 'default' && state.weatherData) {
            const weatherCode = state.weatherData.weather.current.weather_code;
            const weatherType = getWeatherType(weatherCode);
            window.updateBackground(weatherType, weatherCode);
        } else {
            // Очищаем частицы в других режимах
            state.particles = [];
        }
    }

    // Обновление иконки темы
    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        icon.className = 'fas ';

        // Обновляем подсказку
        let tooltipText = '';

        if (state.theme === 'default') {
            icon.classList.add('fa-cloud-sun');
            tooltipText = 'Режим фона: Погода';
        } else if (state.theme === 'light') {
            icon.classList.add('fa-sun');
            tooltipText = 'Режим фона: Светлый';
        } else {
            icon.classList.add('fa-moon');
            tooltipText = 'Режим фона: Тёмный';
        }

        themeTooltip.textContent = tooltipText;
    }

    // Переключение единиц измерения
    function toggleUnits() {
        state.unit = state.unit === 'celsius' ? 'fahrenheit' : 'celsius';
        unitToggle.textContent = state.unit === 'celsius' ? '°C / °F' : '°F / °C';

        if (state.weatherData) {
            renderCurrentWeather(state.weatherData.city, state.weatherData.weather);
            generateForecast(state.weatherData.weather);
            if (document.querySelector('.tab.active').dataset.tab === 'hourly') {
                generateHourlyForecast(state.weatherData.weather);
            }
        }

        saveSettings();
    }

    // Автодополнение городов
    function handleAutocomplete() {
        const query = input.value.trim();
        if (query.length < 2) {
            autocompleteContainer.style.display = 'none';
            return;
        }

        clearTimeout(state.autocompleteTimeout);

        state.autocompleteTimeout = setTimeout(async () => {
            try {
                const response = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ru&format=json`
                );

                if (!response.ok) {
                    throw new Error('Ошибка получения данных');
                }

                const data = await response.json();

                if (!data.results || data.results.length === 0) {
                    autocompleteContainer.style.display = 'none';
                    return;
                }

                autocompleteContainer.innerHTML = '';
                data.results.forEach(city => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.textContent = `${city.name}, ${city.admin1 || city.country}`;
                    item.dataset.city = city.name;

                    const country = document.createElement('span');
                    country.className = 'country';
                    country.textContent = city.country_code;
                    item.appendChild(country);

                    autocompleteContainer.appendChild(item);
                });

                autocompleteContainer.style.display = 'block';
            } catch (error) {
                console.error('Ошибка автодополнения:', error);
            }
        }, 300);
    }

    // Определение местоположения
    function getLocation() {
        if (!navigator.geolocation) {
            showMessage('Геолокация не поддерживается вашим браузером', 'error');
            return;
        }

        showMessage('Определение местоположения...', 'info');

        navigator.geolocation.getCurrentPosition(
            async position => {
                try {
                    const { latitude, longitude } = position.coords;

                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=ru`
                    );

                    if (!response.ok) {
                        throw new Error('Ошибка получения данных о местоположении');
                    }

                    const data = await response.json();

                    if (!data.address) {
                        throw new Error('Не удалось определить город');
                    }

                    const city = data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.county;

                    if (!city) {
                        throw new Error('Город не найден в ответе');
                    }

                    input.value = city;
                    await fetchAndDisplayWeather(city);
                } catch (error) {
                    console.error('Ошибка геокодирования:', error);
                    showMessage(error.message, 'error');

                    input.value = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                    showMessage('Используйте координаты или введите город вручную', 'info');
                }
            },
            error => {
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
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    // Генерация рекомендаций
    function generateRecommendations(weatherData) {
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

    // Генерация прогноза
    function generateForecast(weatherData) {
        forecastContainer.innerHTML = '';

        const daily = weatherData.daily;
        const today = new Date();

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

            const minTemp = state.unit === 'celsius' ?
                Math.round(daily.temperature_2m_min[i]) :
                Math.round((daily.temperature_2m_min[i] * 9/5) + 32);

            const maxTemp = state.unit === 'celsius' ?
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

    // Генерация почасового прогноза
    function generateHourlyForecast(weatherData) {
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

            const temp = state.unit === 'celsius' ?
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

    // Получить иконку погоды по коду
    function getWeatherIcon(code, isDay = true) {
        const baseUrl = "https://openweathermap.org/img/wn/";
        const time = isDay ? 'd' : 'n';

        const iconMap = {
            0: `01${time}`,
            1: `02${time}`,
            2: `03${time}`,
            3: `04${time}`,
            45: '50d',
            48: '50d',
            51: '09d',
            53: '09d',
            55: '09d',
            56: '13d',
            57: '13d',
            61: '10d',
            63: '10d',
            65: '10d',
            66: '13d',
            67: '13d',
            71: '13d',
            73: '13d',
            75: '13d',
            77: '13d',
            80: '09d',
            81: '09d',
            82: '09d',
            85: '13d',
            86: '13d',
            95: '11d',
            96: '11d',
            99: '11d'
        };

        return `${baseUrl}${iconMap[code] || `02${time}`}@2x.png`;
    }

    // Получить описание погоды по коду
    function getWeatherDescription(code) {
        const descriptions = {
            0: 'Ясно',
            1: 'Преимущественно ясно',
            2: 'Переменная облачность',
            3: 'Пасмурно',
            45: 'Туман',
            48: 'Иней',
            51: 'Легкая морось',
            53: 'Морось',
            55: 'Сильная морось',
            56: 'Ледяная морось',
            57: 'Сильная ледяная морось',
            61: 'Небольшой дождь',
            63: 'Дождь',
            65: 'Сильный дождь',
            66: 'Ледяной дождь',
            67: 'Сильный ледяной дождь',
            71: 'Небольшой снег',
            73: 'Снег',
            75: 'Сильный снег',
            77: 'Снежные зерна',
            80: 'Небольшой ливень',
            81: 'Ливень',
            82: 'Сильный ливень',
            85: 'Небольшой снегопад',
            86: 'Снегопад',
            95: 'Гроза',
            96: 'Гроза с градом',
            99: 'Сильная гроза с градом'
        };

        return descriptions[code] || 'Неизвестные условия';
    }

    // Получить погоду
    async function getWeather(latitude, longitude) {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,pressure_msl,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`
            );

            if (!response.ok) {
                throw new Error('Ошибка получения данных о погоде');
            }

            return await response.json();
        } catch (error) {
            showMessage(error.message, 'error');
            throw error;
        }
    }

    // Получить координаты города
    async function getCityCoordinates(cityName) {
        try {
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=ru&format=json`
            );

            if (!response.ok) {
                throw new Error('Ошибка получения координат города');
            }

            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                throw new Error('Город не найден');
            }

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

    // Основная функция для получения и отображения погоды
    async function fetchAndDisplayWeather(cityName) {
        try {
            showLoading();
            showMessage('Получение данных...', 'info');

            const city = await getCityCoordinates(cityName);
            const weatherData = await getWeather(city.latitude, city.longitude);

            state.weatherData = {
                city: city,
                weather: weatherData
            };
            state.currentCity = city.name;
            saveSettings();

            renderCurrentWeather(city, weatherData);
            generateForecast(weatherData);
            generateRecommendations(weatherData);

            // Обновляем фон только в режиме по умолчанию
            if (state.theme === 'default') {
                const weatherCode = weatherData.current.weather_code;
                const weatherType = getWeatherType(weatherCode);
                window.updateBackground(weatherType, weatherCode);
            }

            showMessage('Данные успешно получены!', 'success');
        } catch (error) {
            console.error('Ошибка:', error);
            showMessage(error.message || 'Произошла ошибка', 'error');
        } finally {
            hideLoading();
        }
    }

    // Определить тип погоды для фона
    function getWeatherType(code) {
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

    // Отобразить текущую погоду
    function renderCurrentWeather(city, weatherData) {
        const current = weatherData.current;

        cityNameElement.textContent = city.name;
        countryElement.textContent = city.country.toUpperCase();

        const tempValue = state.unit === 'celsius' ?
            Math.round(current.temperature_2m) :
            Math.round((current.temperature_2m * 9/5) + 32);

        const feelsLikeValue = state.unit === 'celsius' ?
            Math.round(current.apparent_temperature) :
            Math.round((current.apparent_temperature * 9/5) + 32);

        tempElement.innerHTML = `${tempValue}<sup>°${state.unit === 'celsius' ? 'C' : 'F'}</sup>`;

        const now = new Date();
        const hours = now.getHours();
        const isDay = hours > 6 && hours < 20;

        iconElement.src = getWeatherIcon(current.weather_code, isDay);
        iconElement.alt = getWeatherDescription(current.weather_code);
        descriptionElement.textContent = getWeatherDescription(current.weather_code);

        feelsLikeElement.textContent = `Ощущается: ${feelsLikeValue}°${state.unit === 'celsius' ? 'C' : 'F'}`;
        humidityElement.textContent = `Влажность: ${current.relative_humidity_2m}%`;
        windElement.textContent = `Ветер: ${Math.round(current.wind_speed_10m)} м/с`;

        if (weatherData.daily.sunrise && weatherData.daily.sunset) {
            const sunrise = new Date(weatherData.daily.sunrise[0]);
            const sunset = new Date(weatherData.daily.sunset[0]);

            sunriseElement.textContent = `Восход: ${sunrise.getHours().toString().padStart(2, '0')}:${sunrise.getMinutes().toString().padStart(2, '0')}`;
            sunsetElement.textContent = `Закат: ${sunset.getHours().toString().padStart(2, '0')}:${sunset.getMinutes().toString().padStart(2, '0')}`;
        }

        if (current.pressure_msl) {
            pressureElement.textContent = `Давление: ${Math.round(current.pressure_msl)} гПа`;
        }

        document.querySelectorAll('.weather-content > *').forEach(el => {
            el.classList.remove('fade-in');
            setTimeout(() => el.classList.add('fade-in'), 100);
        });
    }

    // Запускаем приложение
    init();
});