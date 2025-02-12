const API_KEY = 'c750de11f500d5451200157e7267a1e6'; 
const GEO_API_KEY = '05bd89c413msh97bdf92bc1a20cdp18cb47jsnb2234d8572c2'; 

// State
let isCelsius = true;
let currentTheme = 'light';
let currentWeatherData = null;
let currentForecastData = null;

// DOM Elements
const elements = {
  cityInput: document.getElementById('city-input'),
  searchBtn: document.getElementById('search-btn'),
  locationBtn: document.getElementById('location-btn'),
  unitToggle: document.getElementById('unit-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  currentWeather: document.getElementById('current-weather'),
  forecast: document.getElementById('forecast'),
  autocompleteResults: document.getElementById('autocomplete-results')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadLastLocation();
  setupEventListeners();
});

function setupEventListeners() {
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.locationBtn.addEventListener('click', handleLocation);
  elements.unitToggle.addEventListener('click', toggleUnits);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.cityInput.addEventListener('input', handleAutocomplete);
  document.addEventListener('click', closeAutocomplete);
}

// Theme Management
function initTheme() {
  currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  elements.themeToggle.textContent = currentTheme === 'light' ? 'dark.svg' : '_sun_light';
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  elements.themeToggle.textContent = currentTheme === 'light' ? 'dark_image' : 'light_on';
}

// Unit Conversion
function toggleUnits() {
  isCelsius = !isCelsius;
  elements.unitToggle.textContent = isCelsius ? '°C/°F' : '°F/°C';
  
  // Re-render current weather and forecast with new units
  if (currentWeatherData) {
    displayWeather(currentWeatherData);
  }
  if (currentForecastData) {
    displayForecast(currentForecastData);
  }
}

// Geolocation
async function handleLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
    
    const weather = await getWeatherByCoords(position.coords);
    currentWeatherData = weather;
    displayWeather(weather);
    const forecast = await getForecast(position.coords);
    currentForecastData = forecast;
    displayForecast(forecast);
    saveLastLocation(position.coords);
  } catch (error) {
    showError('Unable to retrieve your location');
  }
}

// Weather Data
async function handleSearch() {
  const city = elements.cityInput.value.trim();
  if (!city) return;

  try {
    const weather = await getWeather(city);
    currentWeatherData = weather;
    displayWeather(weather);
    const forecast = await getForecast(weather.coord);
    currentForecastData = forecast;
    displayForecast(forecast);
    saveLastLocation(city);
  } catch (error) {
    showError('City not found');
  }
}

async function getWeather(query) {
  const url = typeof query === 'string' 
    ? `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${API_KEY}`
    : `https://api.openweathermap.org/data/2.5/weather?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('City not found');
  return response.json();
}

async function getForecast(coords) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${API_KEY}`
  );
  const data = await response.json();
  return data.list.filter((_, index) => index % 8 === 0);
}

// Display Functions
function displayWeather(data) {
  const temp = convertTemp(data.main.temp);
  elements.currentWeather.innerHTML = `
    <div class="weather-header">
      <h2>${data.name}, ${data.sys.country}</h2>
      <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" 
           class="weather-icon" 
           alt="${data.weather[0].description}">
    </div>
    <div class="weather-details">
      <p class="temp">${Math.round(temp)}°${isCelsius ? 'C' : 'F'}</p>
      <p class="description">${data.weather[0].description}</p>
      <div class="stats">
        <p><i class="wi wi-humidity"></i> ${data.main.humidity}%</p>
        <p><i class="wi wi-strong-wind"></i> ${data.wind.speed} m/s</p>
        <p><i class="wi wi-barometer"></i> ${data.main.pressure} hPa</p>
      </div>
    </div>
  `;
}

function displayForecast(forecastData) {
  elements.forecast.innerHTML = forecastData.map(item => `
    <div class="forecast-card">
      <h3>${new Date(item.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}</h3>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" 
           alt="${item.weather[0].description}">
      <p class="temp">${Math.round(convertTemp(item.main.temp))}°${isCelsius ? 'C' : 'F'}</p>
      <p>${item.weather[0].description}</p>
    </div>
  `).join('');
}

// Autocomplete
async function handleAutocomplete(e) {
  const query = e.target.value.trim();
  if (query.length < 3) {
    elements.autocompleteResults.style.display = 'none';
    return;
  }

  try {
    const response = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}`,
      {
        headers: {
          'X-RapidAPI-Key': GEO_API_KEY,
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      }
    );
    const data = await response.json();
    showAutocomplete(data.data || []);
  } catch (error) {
    console.error('Autocomplete error:', error);
  }
}

function showAutocomplete(cities) {
  elements.autocompleteResults.innerHTML = cities.slice(0, 5).map(city => `
    <div class="autocomplete-item" data-city="${city.city}">
      ${city.city}, ${city.countryCode}
    </div>
  `).join('');
  
  elements.autocompleteResults.style.display = cities.length ? 'block' : 'none';
  
  document.querySelectorAll('.autocomplete-item').forEach(item => {
    item.addEventListener('click', () => {
      elements.cityInput.value = item.getAttribute('data-city');
      elements.autocompleteResults.style.display = 'none';
      handleSearch();
    });
  });
}

function closeAutocomplete(e) {
  if (!e.target.closest('.search-box')) {
    elements.autocompleteResults.style.display = 'none';
  }
}

// Helper Functions
function convertTemp(temp) {
  return isCelsius ? temp : (temp * 9/5 + 32);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = message;
  elements.currentWeather.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// Local Storage
function saveLastLocation(location) {
  localStorage.setItem('lastLocation', JSON.stringify(location));
}

function loadLastLocation() {
  const savedLocation = localStorage.getItem('lastLocation');
  if (!savedLocation) return;

  try {
    const location = JSON.parse(savedLocation);
    if (typeof location === 'string') {
      elements.cityInput.value = location;
      handleSearch();
    } else if (location.lat && location.lon) {
      handleLocation();
    }
  } catch (error) {
    console.error('Error loading last location:', error);
  }
}