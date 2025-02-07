const API_KEY = 'c750de11f500d5451200157e7267a1e6'; // Replace with your OpenWeatherMap API key
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherInfo = document.getElementById('weather-info');

async function getWeather(city) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    const data = await response.json();
    
    if (data.cod === 200) {
      const { temp, humidity } = data.main;
      const { description } = data.weather[0];
      const { speed } = data.wind;
      
      weatherInfo.innerHTML = `
        <h2>Weather in ${city}</h2>
        <p>Temperature: ${temp}°C</p>
        <p>Description: ${description}</p>
        <p>Humidity: ${humidity}%</p>
        <p>Wind Speed: ${speed} m/s</p>
      `;
    } else {
      weatherInfo.innerHTML = `<p>City not found. Try again!</p>`;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});