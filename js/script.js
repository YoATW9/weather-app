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
  elements.themeToggle.textContent = getThemeToggleText(currentTheme);
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  elements.themeToggle.textContent = getThemeToggleText(currentTheme);
}

function getThemeToggleText(theme) {
  return theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
}

// Unit Conversion
function toggleUnits() {
  isCelsius = !isCelsius;
  elements.unitToggle.textContent = getUnitToggleText(isCelsius);
  refreshWeatherDisplay();
}

function getUnitToggleText(isCelsius) {
  return isCelsius ? '°C/°F' : '°F/°C';
}

// Geolocation
async function handleLocation() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser');
    return;
  }

  try {
    // Get user's current position
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          // Handle specific geolocation errors
          let errorMessage = 'Unable to retrieve your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permission to access your location was denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Your location could not be determined';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get your location timed out';
              break;
            case error.UNKNOWN_ERROR:
              errorMessage = 'An unknown error occurred';
              break;
          }
          reject(new Error(errorMessage));
        }
      );
    });

    // Convert position.coords to { lat, lon } format
    const coords = {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    };

    // Fetch weather data using coordinates
    const weather = await getWeather(coords);
    displayWeather(weather);

    // Fetch forecast data using coordinates
    const forecastData = await getForecast(coords);
    displayForecast(forecastData);
    
    // Save the coordinates in local storage
    saveLastLocation(coords);
  } catch (error) {
    showError(error.message);
  }
}

// Weather Data
async function getWeather(query) {
  const url = typeof query === 'string' 
    ? `https://api.openweathermap.org/data/2.5/weather?q=${query}&units=metric&appid=${API_KEY}`
    : `https://api.openweathermap.org/data/2.5/weather?lat=${query.lat}&lon=${query.lon}&units=metric&appid=${API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch weather data');
  }
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
    if (!response.ok) {
      throw new Error('Failed to fetch autocomplete data');
    }
    const data = await response.json();
    showAutocomplete(data.data || []);
  } catch (error) {
    console.error('Autocomplete error:', error);
    showError('Unable to fetch city suggestions');
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

function refreshWeatherDisplay() {
  if (elements.currentWeather.innerHTML) {
    const city = document.querySelector('.weather-header h2').textContent.split(',')[0];
    handleSearch(city);
  }
}

function showError(message) {
  // Remove existing error messages
  const existingError = elements.currentWeather.querySelector('.error');
  if (existingError) existingError.remove();

  // Create new error message
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