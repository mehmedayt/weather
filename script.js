const cityInput = document.querySelector('.city-input');
const searchButton = document.querySelector('.search-btn');
const locationButton = document.querySelector('.location-btn');
const currentWeatherDiv = document.querySelector('.current-weather');
const weatherCardDiv = document.querySelector('.weather-cards');
const proxyUrl = "https://api.allorigins.win/get?url=";

const API_KEY = "b2a3ebd072cd516dea8462dec594d3d7";

const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) {
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h4>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4>Humidity: ${weatherItem.main.humidity} %</h4>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h4>${weatherItem.weather[0].description}</h4>
                </div>`;
    } else {
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
                    <h4>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h4>
                    <h4>Wind: ${weatherItem.wind.speed} M/S</h4>
                    <h4>Humidity: ${weatherItem.main.humidity} %</h4>
                </li>`;
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getWeatherDetails = async (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    try {
        const response = await fetch(WEATHER_API_URL);
        if (!response.ok) {
            throw new Error('City not found or API error');
        }
        const data = await response.json();

        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardDiv.innerHTML = "";

        fiveDaysForecast.forEach((weatherItem, index) => {
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
            } else {
                weatherCardDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem));
            }
        });
    } catch (error) {
        alert("An error occurred while fetching the weather forecast!");
    }
};

const getCityCoordinates = async () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const GEOCODING_API_URL = `${proxyUrl}http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

    try {
        const response = await fetch(GEOCODING_API_URL);
        if (!response.ok) {
            throw new Error('City not found or API error');
        }
        const data = await response.json();

        if (data.length === 0) {
            return alert(`No coordinates found for ${cityName}`);
        }

        const { name, lat, lon } = data[0];
        await getWeatherDetails(name, lat, lon);
    } catch (error) {
        alert("An error occurred while fetching the coordinates!");
    }
};

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            
            fetch(REVERSE_GEOCODING_URL)
                .then(res => res.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => {
                    alert("An error occurred while fetching the city!");
                });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again");
            }
        }
    );
};

locationButton.addEventListener('click', getUserCoordinates);
searchButton.addEventListener('click', async () => {
    await getCityCoordinates();
    await delay(2000); // Wait for 2 seconds before making the next request to avoid rate limiting
});
cityInput.addEventListener('keyup', e => e.key === "Enter" && getCityCoordinates());
