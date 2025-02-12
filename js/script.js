const API_KEY = 'c750de11f500d5451200157e7267a1e6'; 
const GEO_API_KEY = '05bd89c413msh97bdf92bc1a20cdp18cb47jsnb2234d8572c2'; 

// State
let isCelsius = true;
let currentTheme = 'light';

// DOM Elements
const elements = {
  cityInput: document.getElementById('city-input'),
  searchBtn: document.getElementById('search-btn'),
  locationBtn: document.getElementById('location-btn'),
  unitToggle: document.getElementById('unit-toggle'),
  themeToggle: document.getElementById('theme-toggle'),
  currentWeather: document.getElementById('current-weather'),
  forecast: document.getElementById('forecast'),
  autocompleteResults: document.getElementById('autocomplete-results'),
  favoritesList: document.getElementById('favorites-list')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadLastLocation();
  loadFavorites();
  setupEventListeners();
});

function setupEventListeners() {
  elements.searchBtn.addEventListener('click', handleSearch);
  elements.locationBtn.addEventListener('click', handleLocation);
  elements.unitToggle.addEventListener('click', toggleUnits);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.cityInput.addEventListener('input', handleAutocomplete);
  document.addEventListener('click', closeAutocomplete);
  elements.cityInput.addEventListener('keydown', handleInputKeyDown);
}

// Theme Management
function initTheme() {
  currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  elements.themeToggle.textContent = currentTheme === 'light' ? '_FARpack_dark' : '🌠LIGHT';
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  elements.themeToggle.textContent = currentTheme === 'light' ? ' FAR_dark' : '在未来';
}

// Unit Conversion
function toggleUnits() {
  isCelsius = !isCelsius;
  elements.unitToggle.textContent = isCelsius ? '\ImageGroup C°/F°' : 'losures F°/C°';
  refreshWeatherDisplay();
}

// Geolocation
async function handleLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }

  try {
    showLoading();
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          // Handle specific geolocation errors
          let message = 'Unable to retrieve your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permission to access your location was denied';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Your location cannot be determined';
              break;
            case error.TIMEOUT:
              message = 'The request to get your location timed out';
              break;
            case error.UNKNOWN_ERROR:
              message = 'An unknown error occurred';
              break;
          }
          reject(new Error(message));
        }
      );
    });

    const coords = {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    };

    const weather = await getWeather(coords);
    displayWeather(weather);
    displayForecast(await getForecast(coords));
    saveLastLocation(coords);
    hideLoading();
  } catch (error) {
    showError(error.message);
    hideLoading();
  }
}

// Weather Data
async function handleSearch() {
  const city = elements.cityInput.value.trim();
  if (!city) return;

  try {
    showLoading();
    const weather = await getWeather(city);
    displayWeather(weather);
    displayForecast(await getForecast(weather.coord));
    saveLastLocation(city);
    saveFavorite(city);
    hideLoading();
  } catch (error) {
    showError('City not found. Please check your spelling');
    hideLoading();
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
  refreshWeatherDisplay();
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
let autocompleteTimeout;

async function handleAutocomplete(e) {
  clearTimeout(autocompleteTimeout);
  autocompleteTimeout = setTimeout(async () => {
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
  }, 300);
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

function handleInputKeyDown(e) {
  if (e.key === 'Enter') {
    handleSearch();
  }
}

// Helper Functions
function convertTemp(temp) {
  return isCelsius ? temp : (temp * 9 / 5 + 32);
}

function refreshWeatherDisplay() {
  if (elements.currentWeather.innerHTML) {
    const city = document.querySelector('.weather-header h2').textContent.split(',')[0];
    elements.cityInput.value = city;
  }
}

function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'loading';
  loadingDiv.textContent = 'Loading...';
  elements.currentWeather.innerHTML = '';
  elements.currentWeather.appendChild(loadingDiv);
}

function hideLoading() {
  const loadingDiv = elements.currentWeather.querySelector('.loading');
  if (loadingDiv) loadingDiv.remove();
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

// Favorites
function saveFavorite(city) {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
  }
}

function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  displayFavorites(favorites);
}

function displayFavorites(favorites = JSON.parse(localStorage.getItem('favorites')) || []) {
  elements.favoritesList.innerHTML = favorites.map(city => `
    <div class="favorite-city" onclick="handleFavoriteClick('${city}')">${city}</div>
  `).join('');
}

function handleFavoriteClick(city) {
  elements.cityInput.value = city;
  handleSearch();
  saveLastLocation(city);
}