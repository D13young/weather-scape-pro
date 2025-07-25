# 🌤️ **WeatherScape Pro - Погодное приложение**
Красивый интерфейс с адаптивным дизайном

WeatherScape Pro - это современное погодное приложение с потрясающей визуализацией, анимацией частиц и адаптивным дизайном, которое работает на всех устройствах.

## 🚀 **Быстрый старт**

Просто откройте [wscape.ru](http://wscape.ru) в вашем браузере!

## 🌟 **Особенности**

    🌈 Адаптивный дизайн для всех устройств (от смартфонов до десктопов)

    ✨ Динамические фоны с частицами (дождь, снег, туман, звезды)

    🔍 Поиск по городам с автодополнением

    📍 Определение местоположения

    📊 Детальная информация о погоде (температура, влажность, ветер и др.)

    📅 Прогноз на 7 дней

    ⏱️ Почасовой прогноз

    🌙 Три режима темы: погодная, светлая и темная

    🌡️ Переключение между °C и °F

    💡 Полезные рекомендации по погоде

## 🛠️ **Технологии**

### 🌐 Основные технологии

- HTML5 - Семантическая разметка и структура приложения
- CSS3 - Стилизация, анимации, адаптивный дизайн с медиа-запросами
- JavaScript (ES6+) - Клиентская логика и интерактивность

### 🎨 Визуализация и дизайн

- Canvas API - Динамические погодные эффекты (дождь, снег, туман)

- CSS Animations - Плавные переходы и анимации элементов

- Font Awesome - Иконки для интерфейса

- CSS Variables - Динамическое изменение тем оформления

- Flexbox/Grid - Современные макеты и адаптивная сетка

### 🔌 Внешние API

- Open-Meteo API - Получение данных о погоде
- Nominatim (OpenStreetMap) - Геокодирование и поиск городов

### 🧩 Архитектура и организация кода


- Модульная архитектура - Код разделен на логические модули:

        api.js - Работа с внешними API

        dom.js - Управление DOM и обработка событий

        particles.js - Визуализация погодных эффектов

        state.js - Управление состоянием приложения

        ui.js - Рендеринг интерфейса

        utils.js - Вспомогательные функции

- LocalStorage - Сохранение пользовательских настроек (тема, единицы измерения)

- ES6 Modules - Современная система модулей JavaScript

## 📱 **Адаптивность**

- Адаптивный дизайн - Поддержка мобильных, планшетных и десктопных устройств

- Оптимизация производительности:

        Дебаунс для поисковых запросов

        Оптимизация Canvas-рендеринга

        Ленивая загрузка элементов

- Прогрессивное улучшение - Работа в современных и старых браузерах


## 🌐 **Используемые API**

    Open-Meteo - Погодные данные

    Nominatim - Геокодирование

    Font Awesome - Иконки

## 📄 **Структура проекта**

```
weather-scape-pro/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── modules/
│       ├── api.js
│       ├── dom.js
│       ├── particles.js
│       ├── state.js
│       ├── ui.js
│       └── utils.js
└── README.md
```

Made with ❤️ by [D13young]
