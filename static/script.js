/**
 * Weather Anomaly Detection Tool — Dashboard Script
 * ===================================================
 * Starfield animation, dark/light mode, geocoding search,
 * weather API calls, chart rendering, trend/confidence display.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CHART INSTANCES
// ═══════════════════════════════════════════════════════════════════════════════
let tempChartInstance = null;
let rainChartInstance = null;
let areaChartInstance = null;
let comparisonChartInstance = null;

// ═══════════════════════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════════════════════
let geocodeTimer = null;
let starfieldAnimId = null;

// ═══════════════════════════════════════════════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════════════════════════════════════════════
const cityInput = document.getElementById('city-input');
const checkBtn = document.getElementById('check-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const errorContainer = document.getElementById('error-container');
const errorText = document.getElementById('error-text');
const alertBanner = document.getElementById('alert-banner');
const alertText = document.getElementById('alert-text');
const resultsSection = document.getElementById('results-section');
const suggestionsDropdown = document.getElementById('suggestions-dropdown');

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initStars();
    initPlaceholderAnimation();

    // Only init if we are on dashboard
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkWeather();
        });
        cityInput.addEventListener('input', handleCityInput);
    }


    if (suggestionsDropdown) {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.input-wrapper')) {
                suggestionsDropdown.classList.remove('active');
            }
        });
    }

    // Landing page specific
    const landingInput = document.getElementById('city-input-landing');
    if (landingInput) {
        landingInput.focus();
        landingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLandingSearch();
        });
    }

    // Dashboard: Check for query params
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city');
    if (cityParam && cityInput) {
        cityInput.value = decodeURIComponent(cityParam);
        checkWeather();
    }
});




// ═══════════════════════════════════════════════════════════════════════════════
// DARK / LIGHT MODE
// ═══════════════════════════════════════════════════════════════════════════════

function isDarkMode() { return document.body.classList.contains('dark-mode'); }

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    
    // Smooth Transition
    body.style.transition = 'background 0.4s ease, color 0.4s ease';
    
    // Save preference
    localStorage.setItem('weather-theme', isDark ? 'dark' : 'light');
    
    // Update Icons
    document.querySelectorAll('#theme-icon').forEach(icon => {
        icon.textContent = isDark ? '☀️' : '🌙';
    });
    
    // Refresh Charts if on dashboard
    if (tempChartInstance) renderCharts(null); 
}

function initTheme() {
    const savedTheme = localStorage.getItem('weather-theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelectorAll('#theme-icon').forEach(icon => {
            icon.textContent = '☀️';
        });
    }
}

// ── SIDEBAR LOGIC ──
function updateSidebarSummary(data) {
    const cityEl = document.getElementById('sidebar-city');
    const statusEl = document.getElementById('sidebar-status');
    const diffEl = document.getElementById('sidebar-temp-diff');
    const confEl = document.getElementById('sidebar-confidence');
    const iconEl = document.getElementById('sidebar-status-icon');

    if (cityEl) cityEl.textContent = data.city || 'None';
    
    if (statusEl) {
        statusEl.textContent = data.is_anomaly ? 'Anomaly Detected' : 'Normal';
        statusEl.className = 'status-badge ' + (data.is_anomaly ? 'status-anomaly' : 'status-normal');
    }
    
    if (iconEl) iconEl.textContent = data.is_anomaly ? '⚠️' : '✅';
    
    if (diffEl) {
        const diff = (data.current_temp - data.avg_temp).toFixed(1);
        diffEl.textContent = (diff > 0 ? '+' : '') + diff + '°C';
    }
    
    if (confEl) {
        confEl.textContent = data.confidence_score || 'High';
    }
    
    const card = document.getElementById('sidebar-summary-card');
    if (card) {
        card.style.animation = 'none';
        void card.offsetHeight;
        card.style.animation = 'fadeIn 0.5s ease-out';
    }
}

function focusSearch() {
    const input = document.getElementById('city-input');
    if (input) {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => input.focus(), 600);
    }
}

function scrollToCharts() {
    const charts = document.querySelector('.charts-section');
    if (charts) charts.scrollIntoView({ behavior: 'smooth' });
}


// ── STARS GENERATION ──
function initStars() {
    const container = document.getElementById('stars-container');
    if (!container) return;
    
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 4}s`;
        star.style.opacity = Math.random();
        container.appendChild(star);
    }
}

// ── PLACEHOLDER ANIMATION ──
function initPlaceholderAnimation() {
    const input = document.getElementById('city-input');
    if (!input) return;
    
    const placeholders = [
        "Search any city worldwide...",
        "Try 'London' or 'New York'...",
        "Detect anomalies in Tokyo...",
        "Historical data for Paris..."
    ];
    let i = 0;
    
    // Simple fade transition for placeholder
    setInterval(() => {
        i = (i + 1) % placeholders.length;
        input.setAttribute('placeholder', placeholders[i]);
    }, 4000);
}

// ── CHART COLORS ──
function getChartTextColor() { return isDarkMode() ? '#cbd5e1' : '#334155'; }
function getChartGridColor() { return isDarkMode() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'; }
function getChartTooltipBg() { return isDarkMode() ? '#1e293b' : 'rgba(255,255,255,0.95)'; }
function getChartTooltipTitle() { return isDarkMode() ? '#f8fafc' : '#0f172a'; }
function getChartTooltipBody() { return isDarkMode() ? '#cbd5e1' : '#475569'; }
function getChartTooltipBorder() { return isDarkMode() ? 'rgba(14, 165, 233, 0.4)' : 'rgba(14, 165, 233, 0.1)'; }


// Landing Search
function handleLandingSearch() {
    const city = document.getElementById('city-input-landing').value.trim();
    if (city) {
        window.location.href = `/dashboard?city=${encodeURIComponent(city)}`;
    }
}

function quickSearch(city) {
    window.location.href = `/dashboard?city=${encodeURIComponent(city)}`;
}



// ═══════════════════════════════════════════════════════════════════════════════
// GEOCODING SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

function handleCityInput() {
    const val = cityInput.value.trim();
    if (val.length < 2) {
        suggestionsDropdown.classList.remove('active');
        return;
    }
    clearTimeout(geocodeTimer);
    geocodeTimer = setTimeout(() => fetchGeocodeSuggestions(val), 300);
}

async function fetchGeocodeSuggestions(query) {
    try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        const results = data.results || [];

        if (results.length === 0) {
            suggestionsDropdown.classList.remove('active');
            return;
        }

        suggestionsDropdown.innerHTML = results.map(r => `
            <div class="suggestion-item" onclick="selectSuggestion('${r.city.replace(/'/g, "\\'")}')">
                <svg class="suggestion-pin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                <span class="suggestion-label">${r.city}</span>
                <span class="suggestion-sub">${r.state ? r.state + ', ' : ''}${r.country}</span>
            </div>
        `).join('');
        suggestionsDropdown.classList.add('active');
    } catch (e) {
        console.log('Geocode error:', e);
    }
}

function selectSuggestion(city) {
    cityInput.value = city;
    suggestionsDropdown.classList.remove('active');
    checkWeather();
}

function quickCity(city) {
    cityInput.value = city;
    checkWeather();
}


// ═══════════════════════════════════════════════════════════════════════════════
// WEATHER CHECK
// ═══════════════════════════════════════════════════════════════════════════════

async function checkWeather() {
    const city = cityInput.value.trim();
    if (!city) { showError('Please enter a city name.'); return; }

    showLoading(true);
    hideError(); hideAlert(); hideResults();

    try {
        const response = await fetch('/api/check-weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city })
        });
        const data = await response.json();
        if (data.error) { showError(data.error); return; }
        displayResults(data);
    } catch (err) {
        showError('Network error. Please check your connection and try again.');
    } finally {
        showLoading(false);
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY RESULTS
// ═══════════════════════════════════════════════════════════════════════════════

function displayResults(data) {
    // City header
    document.getElementById('city-name').textContent = data.city;
    document.getElementById('weather-desc').textContent = data.weather_desc;
    document.getElementById('weather-icon').src =
        `https://openweathermap.org/img/wn/${data.weather_icon}@2x.png`;

    const dataNote = document.getElementById('data-note');
    dataNote.textContent = data.has_city_data
        ? `Using ${data.city} historical data`
        : 'Using global historical averages';

    document.getElementById('temp-hero-val').textContent = data.current_temp;

    // Trend arrow
    const trendArrow = document.getElementById('temp-trend-arrow');
    if (data.temp_trend === 'rising') {
        trendArrow.textContent = '↑'; trendArrow.className = 'trend-arrow rising';
    } else if (data.temp_trend === 'falling') {
        trendArrow.textContent = '↓'; trendArrow.className = 'trend-arrow falling';
    } else {
        trendArrow.textContent = '→'; trendArrow.className = 'trend-arrow stable';
    }

    // Anomaly badge
    const badge = document.getElementById('anomaly-badge');
    const badgeText = document.getElementById('anomaly-badge-text');
    if (data.is_anomaly) {
        badge.className = 'anomaly-badge anomaly'; badgeText.textContent = data.anomaly_status;
    } else {
        badge.className = 'anomaly-badge normal'; badgeText.textContent = '✓ Normal';
    }

    // Stats
    document.getElementById('current-temp').textContent = data.current_temp;
    document.getElementById('avg-temp').textContent = data.avg_temp;
    document.getElementById('temp-diff').textContent = (data.temp_diff > 0 ? '+' : '') + data.temp_diff;
    document.getElementById('current-rainfall').textContent = data.current_rainfall;
    document.getElementById('avg-rainfall').textContent = data.avg_rainfall;
    document.getElementById('feels-like').textContent = data.feels_like + '°C';
    document.getElementById('humidity').textContent = data.humidity + '%';
    document.getElementById('wind-speed').textContent = data.wind_speed + ' m/s';
    document.getElementById('pressure').textContent = data.pressure + ' hPa';

    // Trends
    setTrend('temp-trend-label', data.temp_trend, data.temp_diff, '°C');

    // Update Smart Sidebar
    updateSidebarSummary(data);
    setTrend('rain-trend-label', data.rain_trend, data.rain_diff, 'mm');
    setConfidence('temp-confidence', data.temp_confidence);

    // Card highlights
    const tempDiffCard = document.getElementById('card-temp-diff');
    const rainCard = document.getElementById('card-rainfall');
    tempDiffCard.classList.remove('anomaly-highlight', 'normal-highlight');
    rainCard.classList.remove('anomaly-highlight', 'normal-highlight');
    tempDiffCard.classList.add(data.temp_anomaly ? 'anomaly-highlight' : 'normal-highlight');
    rainCard.classList.add(data.rain_anomaly ? 'anomaly-highlight' : 'normal-highlight');

    // Anomaly grid
    document.getElementById('anomaly-grid').innerHTML = `
        <div class="anomaly-item ${data.temp_anomaly ? 'danger' : 'normal'}">
            <span class="anomaly-item-icon">${data.temp_anomaly ? '🔴' : '🟢'}</span>
            <div class="anomaly-item-info">
                <h4>${data.temp_anomaly ? 'Temperature Anomaly Detected' : 'Temperature Normal'}</h4>
                <p>Difference: ${data.temp_diff > 0 ? '+' : ''}${data.temp_diff}°C (threshold: ±${data.thresholds.temperature}°C)</p>
                <span class="confidence-label ${data.temp_confidence}">${data.temp_confidence === 'none' ? 'Within Range' : data.temp_confidence + ' confidence'}</span>
            </div>
        </div>
        <div class="anomaly-item ${data.rain_anomaly ? 'danger' : 'normal'}">
            <span class="anomaly-item-icon">${data.rain_anomaly ? '🔴' : '🟢'}</span>
            <div class="anomaly-item-info">
                <h4>${data.rain_anomaly ? 'Rainfall Anomaly Detected' : 'Rainfall Normal'}</h4>
                <p>Difference: ${data.rain_diff > 0 ? '+' : ''}${data.rain_diff}mm (threshold: ±${data.thresholds.rainfall}mm)</p>
                <span class="confidence-label ${data.rain_confidence}">${data.rain_confidence === 'none' ? 'Within Range' : data.rain_confidence + ' confidence'}</span>
            </div>
        </div>
    `;

    // Overall confidence
    const ocTag = document.getElementById('overall-confidence-tag');
    ocTag.textContent = data.overall_confidence === 'none' ? 'All Normal' : data.overall_confidence + ' confidence';
    ocTag.className = 'confidence-tag ' + data.overall_confidence;

    // Dataset anomalies
    document.getElementById('total-anomalies').textContent = data.dataset_anomalies.total;
    document.getElementById('temp-anomalies').textContent = data.dataset_anomalies.temperature;
    document.getElementById('rain-anomalies').textContent = data.dataset_anomalies.rainfall;

    // Alert
    showAlertBanner(data);

    // Charts
    renderCharts(data);

    // Show
    resultsSection.classList.add('active', 'section-reveal');
    setTimeout(() => resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}


// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function setTrend(id, trend, diff, unit) {
    const el = document.getElementById(id);
    const arrow = trend === 'rising' ? '↑' : (trend === 'falling' ? '↓' : '→');
    const label = trend === 'rising' ? 'Above avg' : (trend === 'falling' ? 'Below avg' : 'At avg');
    el.innerHTML = `${arrow} ${label} (${diff > 0 ? '+' : ''}${diff}${unit})`;
    el.className = 'stat-trend ' + trend;
}

function setConfidence(id, level) {
    const el = document.getElementById(id);
    el.textContent = level === 'none' ? 'Normal' : level + ' confidence';
    el.className = 'stat-confidence ' + level;
}

function showAlertBanner(data) {
    const banner = alertBanner;
    banner.classList.remove('anomaly-alert', 'normal-alert');

    if (data.is_anomaly) {
        banner.classList.add('active', 'anomaly-alert');
        document.getElementById('alert-icon').textContent = '🚨';
        document.getElementById('alert-title').textContent = data.anomaly_status;
        document.getElementById('alert-text').textContent = data.anomaly_details.join(' • ');
        const cb = document.getElementById('confidence-badge');
        cb.textContent = data.overall_confidence;
        cb.className = 'confidence-badge ' + data.overall_confidence;
    } else {
        banner.classList.add('active', 'normal-alert');
        document.getElementById('alert-icon').textContent = '✅';
        document.getElementById('alert-title').textContent = 'No Anomalies Detected';
        document.getElementById('alert-text').textContent = `Weather in ${data.city} is within normal historical ranges.`;
        const cb = document.getElementById('confidence-badge');
        cb.textContent = 'Normal';
        cb.className = 'confidence-badge none';
    }

    document.getElementById('alert-time').textContent = data.timestamp || new Date().toLocaleTimeString();
}


// ═══════════════════════════════════════════════════════════════════════════════
// CHART RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

function renderCharts(data) {
    // If data is null, use current internal state to re-render with new colors
    if (!data && window.lastChartData) {
        data = window.lastChartData;
    } else if (data) {
        window.lastChartData = data;
    } else {
        return;
    }

    const cd = data.chart_data;

    if (!cd) return;

    if (tempChartInstance) tempChartInstance.destroy();
    if (rainChartInstance) rainChartInstance.destroy();
    if (areaChartInstance) areaChartInstance.destroy();
    if (comparisonChartInstance) comparisonChartInstance.destroy();

    const cmi = data.current_month - 1;
    const textColor = getChartTextColor();
    const gridColor = getChartGridColor();

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    Chart.defaults.font.family = "'Inter', sans-serif";

    const tooltip = {
        backgroundColor: getChartTooltipBg(),
        titleColor: getChartTooltipTitle(),
        bodyColor: getChartTooltipBody(),
        borderColor: getChartTooltipBorder(),
        borderWidth: 1,
        cornerRadius: 10,
        padding: 14,
        titleFont: { weight: '700' }
    };

    // ── 1. Temperature Line ──
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const currentTempData = new Array(cd.labels.length).fill(null);
    if (cmi >= 0 && cmi < cd.labels.length) currentTempData[cmi] = data.current_temp;

    const tg = tempCtx.createLinearGradient(0, 0, 0, 280);
    tg.addColorStop(0, 'rgba(99,102,241,0.2)');
    tg.addColorStop(1, 'rgba(99,102,241,0)');

    tempChartInstance = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: cd.labels,
            datasets: [
                {
                    label: 'Historical Avg (°C)', data: cd.avg_temps,
                    borderColor: '#6366f1', backgroundColor: tg, fill: true, tension: 0.4,
                    pointBackgroundColor: cd.labels.map((_, i) => i === cmi ? '#ef4444' : '#6366f1'),
                    pointBorderColor: cd.labels.map((_, i) => i === cmi ? '#ef4444' : '#6366f1'),
                    pointRadius: cd.labels.map((_, i) => i === cmi ? 7 : 3),
                    pointHoverRadius: 8, borderWidth: 2.5
                },
                {
                    label: 'Current (°C)', data: currentTempData,
                    borderColor: data.temp_anomaly ? '#ef4444' : '#10b981',
                    backgroundColor: data.temp_anomaly ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                    pointBackgroundColor: data.temp_anomaly ? '#ef4444' : '#10b981',
                    pointBorderColor: isDarkMode() ? '#fff' : '#1e293b', pointBorderWidth: 2,
                    pointRadius: 10, pointHoverRadius: 13, showLine: false, borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11, weight: '600' } } },
                tooltip
            },
            scales: {
                y: { grid: { color: gridColor }, ticks: { callback: v => v + '°C', font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    });

    // ── 2. Rainfall Bar ──
    const rainCtx = document.getElementById('rainChart').getContext('2d');
    const rainGrads = cd.labels.map((_, i) => {
        const g = rainCtx.createLinearGradient(0, 0, 0, 280);
        if (i === cmi) { g.addColorStop(0, 'rgba(239,68,68,0.8)'); g.addColorStop(1, 'rgba(236,72,153,0.4)'); }
        else { g.addColorStop(0, 'rgba(6,182,212,0.7)'); g.addColorStop(1, 'rgba(99,102,241,0.3)'); }
        return g;
    });

    rainChartInstance = new Chart(rainCtx, {
        type: 'bar',
        data: {
            labels: cd.labels,
            datasets: [{
                label: 'Avg Rainfall (mm)', data: cd.avg_rainfalls,
                backgroundColor: rainGrads,
                borderColor: cd.labels.map((_, i) => i === cmi ? '#ef4444' : '#06b6d4'),
                borderWidth: 1.5, borderRadius: 8, borderSkipped: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { padding: 16, usePointStyle: true, pointStyle: 'rect', font: { size: 11, weight: '600' } } }, tooltip },
            scales: {
                y: { grid: { color: gridColor }, ticks: { callback: v => v + ' mm', font: { size: 11 } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    });

    // ── 3. Area Chart ──
    if (cd.temp_min && cd.temp_max) {
        const aCtx = document.getElementById('areaChart').getContext('2d');
        const ag = aCtx.createLinearGradient(0, 0, 0, 280);
        ag.addColorStop(0, 'rgba(168,85,247,0.18)'); ag.addColorStop(1, 'rgba(168,85,247,0)');

        areaChartInstance = new Chart(aCtx, {
            type: 'line',
            data: {
                labels: cd.labels,
                datasets: [
                    { label: 'Max (°C)', data: cd.temp_max, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.05)', fill: '+1', tension: 0.4, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2, pointBackgroundColor: '#ef4444' },
                    { label: 'Min (°C)', data: cd.temp_min, borderColor: '#06b6d4', backgroundColor: ag, fill: 'origin', tension: 0.4, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2, pointBackgroundColor: '#06b6d4' },
                    { label: 'Average (°C)', data: cd.avg_temps, borderColor: '#a855f7', borderDash: [6, 4], fill: false, tension: 0.4, pointRadius: 0, borderWidth: 1.5 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11, weight: '600' } } }, tooltip, filler: { propagate: true } },
                scales: {
                    y: { grid: { color: gridColor }, ticks: { callback: v => v + '°C', font: { size: 11 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } }
                }
            }
        });
    }

    // ── 4. Comparison ──
    const cCtx = document.getElementById('comparisonChart').getContext('2d');
    const tbg = cCtx.createLinearGradient(0, 0, 0, 280);
    tbg.addColorStop(0, 'rgba(99,102,241,0.7)'); tbg.addColorStop(1, 'rgba(99,102,241,0.2)');
    const rbg = cCtx.createLinearGradient(0, 0, 0, 280);
    rbg.addColorStop(0, 'rgba(6,182,212,0.7)'); rbg.addColorStop(1, 'rgba(6,182,212,0.2)');

    comparisonChartInstance = new Chart(cCtx, {
        type: 'bar',
        data: {
            labels: cd.labels,
            datasets: [
                { label: 'Avg Temp (°C)', data: cd.avg_temps, backgroundColor: tbg, borderColor: '#6366f1', borderWidth: 1.5, borderRadius: 6, borderSkipped: false, yAxisID: 'y' },
                { label: 'Avg Rainfall (mm)', data: cd.avg_rainfalls, backgroundColor: rbg, borderColor: '#06b6d4', borderWidth: 1.5, borderRadius: 6, borderSkipped: false, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { padding: 16, usePointStyle: true, pointStyle: 'rect', font: { size: 11, weight: '600' } } }, tooltip },
            scales: {
                y: { position: 'left', grid: { color: gridColor }, ticks: { callback: v => v + '°C', color: '#818cf8', font: { size: 11 } }, title: { display: true, text: 'Temperature', color: '#818cf8', font: { size: 11, weight: '600' } } },
                y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: v => v + 'mm', color: '#22d3ee', font: { size: 11 } }, title: { display: true, text: 'Rainfall', color: '#22d3ee', font: { size: 11, weight: '600' } } },
                x: { grid: { display: false }, ticks: { font: { size: 11 } } }
            }
        }
    });
}


// ═══════════════════════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function showLoading(show) {
    loadingOverlay.classList.toggle('active', show);
    checkBtn.disabled = show;
}

function showError(msg) {
    showLoading(false);
    errorText.textContent = msg;
    errorContainer.classList.add('active');
}

function hideError() { errorContainer.classList.remove('active'); }

function hideAlert() { alertBanner.classList.remove('active', 'anomaly-alert', 'normal-alert'); }

function closeAlert() { alertBanner.classList.remove('active'); }

function hideResults() { resultsSection.classList.remove('active'); }

function retrySearch() { hideError(); cityInput.focus(); }

function resetSearch() {
    hideResults(); hideAlert(); hideError();
    cityInput.value = ''; cityInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
