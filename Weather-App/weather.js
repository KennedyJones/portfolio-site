document.addEventListener('DOMContentLoaded', () => {
  const queryInput = document.getElementById("query");
  const searchBtn = document.getElementById("searchBtn");
  const locBtn = document.getElementById("locBtn");
  const weatherDiv = document.getElementById("weather");
  const settingsBtn = document.getElementById('settingsBtn');

  if (!queryInput || !searchBtn || !locBtn || !weatherDiv || !settingsBtn) {
    console.warn('Weather app markup missing expected elements; aborting script init.');
    return;
  }

  let units = localStorage.getItem('units') || 'metric'; // 'metric' or 'imperial'

  // Track last search type and data
  let lastSearch = null; // { type: 'city', value: string } or { type: 'location', lat: number, lon: number }

  function getUnitLabels() {
    return units === 'imperial'
      ? { temp: '°F', wind: 'mph' }
      : { temp: '°C', wind: 'km/h' };
  }

  function getWeatherUrl(lat, lon) {
    const tempUnit = units === 'imperial' ? 'fahrenheit' : 'celsius';
    const windUnit = units === 'imperial' ? 'mph' : 'kmh';
    return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&temperature_unit=${tempUnit}&windspeed_unit=${windUnit}&timezone=auto`;
  }

  async function fetchWeather(city) {
    weatherDiv.innerHTML = "Loading...";
    lastSearch = { type: 'city', value: city };
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        weatherDiv.innerHTML = `<p style="color:red;">No results. Try a bigger city or different spelling.</p>`;
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];
      const weatherUrl = getWeatherUrl(latitude, longitude);
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();
      const labels = getUnitLabels();

      weatherDiv.innerHTML = `
        <h3>${name}, ${country}</h3>
        <p>🌡️ ${weatherData.current.temperature_2m}${labels.temp}</p>
        <p>🌬️ ${weatherData.current.windspeed_10m} ${labels.wind}</p>
      `;
    } catch (err) {
      weatherDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
  }

  const handleCitySearch = () => {
    const city = queryInput.value.trim();
    if (city) {
      fetchWeather(city);
    }
  };

  searchBtn.addEventListener("click", handleCitySearch);
  queryInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleCitySearch();
    }
  });

  const renderCurrentConditions = (title, data) => {
    const labels = getUnitLabels();
    weatherDiv.innerHTML = `
      <h3>${title}</h3>
      <p>🌡️ ${data.current.temperature_2m}${labels.temp}</p>
      <p>🌬️ ${data.current.windspeed_10m} ${labels.wind}</p>
    `;
  };

  locBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      weatherDiv.innerHTML = "Geolocation not supported.";
      return;
    }

    weatherDiv.innerHTML = "Loading...";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const weatherUrl = getWeatherUrl(latitude, longitude);
          const res = await fetch(weatherUrl);
          const data = await res.json();
          renderCurrentConditions('Your Location', data);
          lastSearch = { type: 'location', lat: latitude, lon: longitude };
        } catch (err) {
          weatherDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        }
      },
      (error) => {
        weatherDiv.innerHTML = `<p style="color:red;">Location error: ${error.message}</p>`;
      }
    );
  });

  settingsBtn.addEventListener('click', () => {
    units = units === 'metric' ? 'imperial' : 'metric';
    localStorage.setItem('units', units);
    if (lastSearch) {
      if (lastSearch.type === 'city') {
        fetchWeather(lastSearch.value);
      } else if (lastSearch.type === 'location') {
        // Fetch weather for last known location
        (async () => {
          weatherDiv.innerHTML = "Loading...";
          const weatherUrl = getWeatherUrl(lastSearch.lat, lastSearch.lon);
          const res = await fetch(weatherUrl);
          const data = await res.json();
          renderCurrentConditions('Your Location', data);
        })();
      }
    } else {
      weatherDiv.innerHTML = '<p style="color:orange;">No weather to update. Search for a city or use your location first.</p>';
    }
  });
});
