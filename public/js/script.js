const API_KEY = 'c750de11f500d5451200157e7267a1e6'; // Replace with your OpenWeatherMap API key
const GEO_API_KEY = '05bd89c413msh97bdf92bc1a20cdp18cb47jsnb2234d8572c2'; // Get from RapidAPI
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const weatherInfo = document.getElementById('weather-info');
const currentWeather = document.getElementById('current-weather');
const autocompleteResults = document.getElementById('autocomplete-results');

// Get current area weather on page load
window.addEventListener('load', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      getWeatherByCoords(position.coords.latitude, position.coords.longitude, true);
    });
  }
});

// Autocomplete functionality
cityInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length < 3) {
    autocompleteResults.style.display = 'none';
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
    showAutocomplete(data.data);
  } catch (error) {
    console.error('Autocomplete error:', error);
  }
});

function showAutocomplete(cities) {
  autocompleteResults.innerHTML = '';
  autocompleteResults.style.display = 'block';

  cities.slice(0, 5).forEach(city => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.textContent = `${city.city}, ${city.countryCode}`;
    div.addEventListener('click', () => {
      cityInput.value = `${city.city}, ${city.countryCode}`;
      autocompleteResults.style.display = 'none';
      getWeather(city.city);
    });
    autocompleteResults.appendChild(div);
  });
}

async function getWeather(city, isCurrentLocation = false) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    const data = await response.json();
    
    if (data.cod === 200) {
      displayWeather(data, isCurrentLocation);
    } else {
      showError('City not found');
    }
  } catch (error) {
    showError('Failed to fetch weather');
  }
}

async function getWeatherByCoords(lat, lon, isCurrentLocation = false) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const data = await response.json();
    displayWeather(data, isCurrentLocation);
  } catch (error) {
    showError('Failed to fetch location weather');
  }
}

function displayWeather(data, isCurrentLocation) {
  const { name, main, weather, wind } = data;
  const targetElement = isCurrentLocation ? currentWeather : weatherInfo;

  targetElement.innerHTML = `
    <div class="weather-card">
      <h2>${name}</h2>
      <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" 
           alt="${weather[0].description}" 
           class="weather-icon">
      <p class="temp">${Math.round(main.temp)}°C</p>
      <p class="description">${weather[0].description}</p>
      <div class="details">
        <p>💧 Humidity: ${main.humidity}%</p>
        <p>🌪️ Wind: ${wind.speed} m/s</p>
      </div>
    </div>
  `;
}

// Event Listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

locationBtn.addEventListener('click', () => {
  navigator.geolocation.getCurrentPosition(position => {
    getWeatherByCoords(position.coords.latitude, position.coords.longitude);
  });
});

// Close autocomplete when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    autocompleteResults.style.display = 'none';
  }
});