/**
 * Weather Anomaly Detection Tool — Dashboard Script
 * ===================================================
 * Starfield animation, dark/light mode, geocoding search,
 * weather API calls, chart rendering, trend/confidence display.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCES
// ═══════════════════════════════════════════════════════════════════════════════
let tempChartInstance = null;
let rainChartInstance = null;
let areaChartInstance = null;
let comparisonChartInstance = null;

let appMap = null;
let tileLayer = null;
let searchMarker = null;

let cloudsLayer = null;
let precipitationLayer = null;
let pressureLayer = null;

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
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initStars();
    initPlaceholderAnimation();
    initMap();
    init3DTilt();
    initRipples();
    initMobileNav();

    // Only init if we are on dashboard
    if (cityInput) {
        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkWeather();
        });
        cityInput.addEventListener('input', handleCityInput);
    }


    if (suggestionsDropdown) {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
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
    body.style.transition = 'background 0.15s ease, color 0.15s ease';
    
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
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        document.body.classList.remove('dark-mode');
        return;
    }

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
    
    // Clear out any existing stars to prevent duplicates during quick navigation
    container.innerHTML = '';
    
    const starCount = 120;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random sizes for depth perception
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Random positions
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Random animation delays so they don't all move/glow together
        // starMove is 40s, starGlow is 3s
        const moveDelay = Math.random() * -40;
        const glowDelay = Math.random() * -3;
        star.style.animationDelay = `${moveDelay}s, ${glowDelay}s`;
        
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

async function checkWeather(coords = null) {
    const city = cityInput.value.trim();
    if (!city && !coords) { 
        showError('Please enter a city name or use geolocation.'); 
        return; 
    }

    showLoading(true);
    hideError(); hideAlert(); hideResults();
    
    const welcomeWidgets = document.getElementById('welcome-widgets');
    if (welcomeWidgets) welcomeWidgets.style.display = 'none';

    try {
        const payload = coords ? { lat: coords.lat, lon: coords.lon } : { city };
        const response = await fetch('/api/check-weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) { showError(data.error); return; }
        
        // Update input field if we found the city via GPS
        if (coords && data.city && cityInput) {
            cityInput.value = data.city;
        }
        
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

    // Show container BEFORE rendering graphics so sizes compute correctly
    resultsSection.classList.add('active', 'section-reveal');
    document.body.classList.add('analysis-active');

    // Map Interaction
    if (appMap && data.lat !== undefined && data.lon !== undefined) {
        appMap.invalidateSize(); // Fixes gray map when toggling display
        appMap.flyTo([data.lat, data.lon], 10, { animate: true, duration: 1.5 });

        // Turn on weather map layer automatically upon searching
        if (cloudsLayer && !appMap.hasLayer(cloudsLayer)) {
            appMap.addLayer(cloudsLayer);
        }

        if (searchMarker) {
            appMap.removeLayer(searchMarker);
        }

        const devThreshold = 10;
        const isAnomaly = Math.abs(data.temp_diff) > devThreshold;
        
        const markerColor = isAnomaly ? '#ef4444' : '#3b82f6';
        const fillColor = isAnomaly ? '#fca5a5' : '#93c5fd';

        searchMarker = L.circleMarker([data.lat, data.lon], {
            radius: 12,
            color: markerColor,
            weight: 3,
            fillColor: fillColor,
            fillOpacity: 0.8
        }).addTo(appMap);

        const popupContent = `
            <div class="custom-map-popup" style="font-family: 'Inter', sans-serif; text-align: center; min-width: 130px;">
                <strong style="font-size: 1.2em; display: block; margin-bottom: 5px;">${data.city}</strong>
                <span style="font-size: 1.6em; font-weight: 800; color: ${markerColor}; display: block; margin-bottom: 5px;">${data.current_temp}°C</span>
                <span style="font-size: 0.9em; padding: 4px 8px; border-radius: 20px; background: ${isAnomaly ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)'}; color: ${markerColor}; font-weight: 600;">
                    ${isAnomaly ? 'High Deviation Anomaly' : 'Normal Range'}
                </span>
                ${isAnomaly ? `<p style="margin-top: 8px; font-size: 0.8em; color: #64748b;">Diff: ${data.temp_diff > 0 ? '+' : ''}${data.temp_diff}°C</p>` : ''}
            </div>
        `;

        searchMarker.bindPopup(popupContent, { className: 'glass-popup' }).openPopup();
    }

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

    // Scroll
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
    document.body.classList.remove('analysis-active');
    
    const welcomeWidgets = document.getElementById('welcome-widgets');
    if (welcomeWidgets) welcomeWidgets.style.display = 'block';
    
    cityInput.value = ''; cityInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAP INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

function initMap() {
    const mapContainer = document.getElementById('weather-map');
    if (!mapContainer) return;

    appMap = L.map('weather-map').setView([20, 0], 2);

    const baseTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayer = L.tileLayer(baseTileUrl, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }).addTo(appMap);

    const apiKey = window.OPENWEATHER_API_KEY;
    if (apiKey) {
        const precipitationLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: 'OpenWeather' });
        const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: 'OpenWeather' });
        const pressureLayer = L.tileLayer(`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${apiKey}`, { attribution: 'OpenWeather' });

        const overlayMaps = {
            "Precipitation": precipitationLayer,
            "Clouds": cloudsLayer,
            "Pressure": pressureLayer
        };

        L.control.layers(null, overlayMaps, { position: 'topright' }).addTo(appMap);
    }

    fetch('/api/map-data')
        .then(res => res.json())
        .then(data => {
            const cities = data.data || [];
            cities.forEach(cityData => {
                const markerColor = cityData.is_anomaly ? '#ef4444' : '#3b82f6';
                const fillColor = cityData.is_anomaly ? '#fca5a5' : '#93c5fd';

                const circleMarker = L.circleMarker([cityData.lat, cityData.lon], {
                    radius: 8, color: markerColor, weight: 2, fillColor: fillColor, fillOpacity: 0.7
                }).addTo(appMap);

                const popupContent = `
                    <div style="font-family: 'Inter', sans-serif; text-align: center;">
                        <strong style="font-size: 1.1em;">${cityData.city}</strong><br/>
                        <span style="font-size: 1.5em; font-weight: bold; color: ${markerColor};">${cityData.current_temp}°C</span><br/>
                        <span style="color: ${cityData.is_anomaly ? 'red' : 'green'}; font-weight: 500;">
                            ${cityData.status}
                        </span>
                    </div>
                `;
                circleMarker.bindPopup(popupContent, { className: 'glass-popup' });
            });
        })
        .catch(err => console.error("Error fetching global map data:", err));

    const locateBtn = document.getElementById('locate-me-btn');
    if (locateBtn) {
        locateBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                locateBtn.innerHTML = '<span style="margin-right: 5px;">⏳</span>Locating...';
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        
                        // Direct fetch using coordinates for higher reliability
                        checkWeather({ lat, lon });
                        
                        locateBtn.innerHTML = '<span style="margin-right: 5px;">📍</span>Locate Me';
                    },
                    (error) => {
                        alert("Geolocation failed: " + error.message);
                        locateBtn.innerHTML = '<span style="margin-right: 5px;">📍</span>Locate Me';
                    }
                );
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3D TILT EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

function init3DTilt() {
    // Select all our nice cards
    const cards = document.querySelectorAll('.stat-card, .chart-card, .insight-card, .premium-cta-area, .summary-card, .anomaly-details-card, .dataset-summary, .glass-card, .city-header');
    
    cards.forEach(card => {
        // Initial smooth lift when cursor enters bounds
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.4s ease-out';
            card.style.transform = `perspective(1000px) translateY(-10px) scale(1.02) rotateX(0deg) rotateY(0deg)`;
            card.style.boxShadow = `0px 15px 40px rgba(14, 165, 233, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.25)`;
        });

        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate rotation (max 6 degrees for subtle premium feel)
            const rotateX = ((y - centerY) / centerY) * -6; 
            const rotateY = ((x - centerX) / centerX) * 6;
            
            // Apply transform instantly while moving
            card.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
            card.style.transform = `perspective(1000px) translateY(-10px) scale(1.02) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Dynamic premium shadow that moves opposite to tilt
            const shadowX = -rotateY * 2;
            const shadowY = (rotateX * 2) + 15; // Increased Y shadow for lifted effect
            card.style.boxShadow = `${shadowX}px ${shadowY}px 40px rgba(14, 165, 233, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.25)`;
        });
        
        card.addEventListener('mouseleave', () => {
            // Restore smooth bounce-back transition
            card.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
            card.style.transform = `perspective(1000px) translateY(0px) scale(1) rotateX(0deg) rotateY(0deg)`;
            card.style.boxShadow = '';
            
            // Clear inline styles so css hover handles them again
            setTimeout(() => {
                if (!card.matches(':hover')) {
                    card.style.transition = '';
                    card.style.transform = '';
                    card.style.boxShadow = '';
                }
            }, 600);
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RIPPLE EFFECT
// ═══════════════════════════════════════════════════════════════════════════════

function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add("ripple");
    
    if (document.body.classList.contains('light-mode')) {
        circle.classList.add("dark-ripple");
    }

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

function initRipples() {
    const buttons = document.querySelectorAll('.ripple-btn');
    for (const button of buttons) {
        button.addEventListener("click", createRipple);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPA VIEW ROUTING & ALERTS
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar-panel');
    const overlay = document.getElementById('mobile-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.classList.toggle('sidebar-open');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar-panel');
    const overlay = document.getElementById('mobile-overlay');
    
    if (sidebar && overlay && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
}

function initMobileNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', closeMobileSidebar);
    });
}
