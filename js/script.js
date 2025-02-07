const API_KEY = 'c750de11f500d5451200157e7267a1e6'; // Replace with your OpenWeatherMap API key
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherInfo = document.getElementById('weather-info');

async function getWeather(city) {
  try {
    // Show loader
    weatherInfo.innerHTML = `<div class="loader"></div>`;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    const data = await response.json();

    if (data.cod === 200) {
      const { temp, humidity } = data.main;
      const { description, icon } = data.weather[0];
      const { speed } = data.wind;

      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

      // Display weather data
      weatherInfo.innerHTML = `
        <div class="weather-card">
          <h2>Weather in ${city}</h2>
          <img src="${iconUrl}" alt="${description}" class="weather-icon">
          <p class="temp">${temp}°C</p>
          <p class="description">${description}</p>
          <div class="details">
            <p>💧 Humidity: ${humidity}%</p>
            <p>🌪️ Wind: ${speed} m/s</p>
          </div>
        </div>
      `;
    } else {
      weatherInfo.innerHTML = `<p class="error">🚨 City not found. Try again!</p>`;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    weatherInfo.innerHTML = `<p class="error">🚨 Something went wrong. Please try again later.</p>`;
  }
}

// Event listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) getWeather(city);
  }
});