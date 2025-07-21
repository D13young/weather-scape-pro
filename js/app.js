import { initApp } from './modules/dom.js';
import { loadSettings } from './modules/state.js';

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initApp();
});