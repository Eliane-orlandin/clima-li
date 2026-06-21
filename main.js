// DOM Elements
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const loader = document.getElementById('loader');
const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');
const welcomeCard = document.getElementById('welcome-card');
const weatherDashboard = document.getElementById('weather-dashboard');
const weatherAnimationContainer = document.getElementById('weather-animation');

// Dashboard UI Elements
const cityName = document.getElementById('city-name');
const localTime = document.getElementById('local-time');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const statHumidity = document.getElementById('stat-humidity');
const statWind = document.getElementById('stat-wind');
const statFeelsLike = document.getElementById('stat-feelslike');
const statUv = document.getElementById('stat-uv');
const forecastContainer = document.getElementById('forecast-container');

// Event Listeners
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    fetchWeather(city);
  }
});

// Fetch Weather Data from Express Proxy
async function fetchWeather(city) {
  showState('loading');
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao buscar dados do clima');
    }
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    console.error('Erro na requisição de clima:', error);
    errorMessage.textContent = error.message;
    showState('error');
  }
}

// Weather Cycle for Welcome/Home Screen
let homeCycleInterval = null;
const mockAtmospheres = [
  { code: 1000, isDay: 1 }, // Sunny Day
  { code: 1000, isDay: 0 }, // Clear Night (Twinkling Stars)
  { code: 1063, isDay: 1 }, // Rainy Day
  { code: 1066, isDay: 1 }, // Snowy Day
  { code: 1006, isDay: 1 }  // Cloudy Day
];
let currentCycleIndex = 0;

function startHomeWeatherCycle() {
  stopHomeWeatherCycle();
  
  // Apply first atmosphere immediately
  applyAtmosphere(mockAtmospheres[currentCycleIndex].code, mockAtmospheres[currentCycleIndex].isDay);
  
  homeCycleInterval = setInterval(() => {
    currentCycleIndex = (currentCycleIndex + 1) % mockAtmospheres.length;
    applyAtmosphere(mockAtmospheres[currentCycleIndex].code, mockAtmospheres[currentCycleIndex].isDay);
  }, 4000);
}

function stopHomeWeatherCycle() {
  if (homeCycleInterval) {
    clearInterval(homeCycleInterval);
    homeCycleInterval = null;
  }
}

// Show/Hide States
function showState(state) {
  loader.classList.add('hidden');
  errorCard.classList.add('hidden');
  welcomeCard.classList.add('hidden');
  weatherDashboard.classList.add('hidden');

  if (state === 'loading') {
    stopHomeWeatherCycle();
    loader.classList.remove('hidden');
  } else if (state === 'error') {
    stopHomeWeatherCycle();
    errorCard.classList.remove('hidden');
  } else if (state === 'welcome') {
    welcomeCard.classList.remove('hidden');
    startHomeWeatherCycle();
  } else if (state === 'dashboard') {
    stopHomeWeatherCycle();
    weatherDashboard.classList.remove('hidden');
  }
}

// Update Dashboard UI with API response
function updateUI(data) {
  const current = data.current;
  const location = data.location;
  const forecastDays = data.forecast.forecastday;

  // Primary info
  cityName.textContent = `${location.name}, ${location.region || location.country}`;
  
  // Format local time
  const dateObj = new Date(location.localtime);
  const options = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
  localTime.textContent = dateObj.toLocaleDateString('pt-BR', options);

  temperature.textContent = Math.round(current.temp_c);
  weatherIcon.src = `https:${current.condition.icon}`;
  weatherIcon.alt = current.condition.text;
  weatherDescription.textContent = current.condition.text;

  // Stats
  statHumidity.textContent = `${current.humidity}%`;
  statWind.textContent = `${current.wind_kph} km/h`;
  statFeelsLike.textContent = `${Math.round(current.feelslike_c)}°C`;
  
  // UV Index details
  const uvValue = current.uv;
  let uvLabel = 'Baixo';
  if (uvValue >= 3 && uvValue <= 5) uvLabel = 'Moderado';
  else if (uvValue >= 6 && uvValue <= 7) uvLabel = 'Alto';
  else if (uvValue >= 8 && uvValue <= 10) uvLabel = 'Muito Alto';
  else if (uvValue >= 11) uvLabel = 'Extremo';
  statUv.textContent = `${uvValue} (${uvLabel})`;

  // Build Forecast cards
  forecastContainer.innerHTML = '';
  forecastDays.forEach((dayData) => {
    const dayDateObj = new Date(dayData.date + 'T00:00:00');
    const dayName = dayDateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayFormatted = dayDateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    
    const fCard = document.createElement('div');
    fCard.className = 'forecast-card';
    fCard.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <span class="forecast-date">${dayFormatted}</span>
      <div class="forecast-icon-wrapper">
        <img class="forecast-icon" src="https:${dayData.day.condition.icon}" alt="${dayData.day.condition.text}">
      </div>
      <div class="forecast-temp">
        <span class="forecast-temp-max">${Math.round(dayData.day.maxtemp_c)}°</span>
        <span class="forecast-temp-min">${Math.round(dayData.day.mintemp_c)}°</span>
      </div>
      <span class="forecast-desc">${dayData.day.condition.text}</span>
    `;
    forecastContainer.appendChild(fCard);
  });

  // Apply Atmospheric Theme and Animations
  applyAtmosphere(current.condition.code, current.is_day);
  showState('dashboard');
}

// Map condition codes to UI Themes & Animations
// WeatherAPI codes reference: https://www.weatherapi.com/docs/weather_conditions.json
function applyAtmosphere(code, isDay) {
  // Clear any existing particles/animations
  weatherAnimationContainer.innerHTML = '';
  document.body.className = ''; // clear theme classes

  const isRain = [1063, 1150, 1153, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246, 1273, 1276].includes(code);
  const isStorm = [1087, 1279, 1282].includes(code);
  const isSnow = [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code);
  const isCloudy = [1003, 1006, 1009, 1030, 1135, 1147].includes(code);

  if (isRain || isStorm) {
    document.body.classList.add('rain-theme');
    createRainParticles();
    if (isStorm) {
      triggerLightningEffect();
    }
  } else if (isSnow) {
    document.body.classList.add('snow-theme');
    createSnowParticles();
  } else if (isCloudy) {
    document.body.classList.add('cloudy-theme');
    createClouds();
  } else {
    // Clear/Sunny
    if (isDay) {
      document.body.classList.add('day-theme');
      createSunRayEffect();
    } else {
      document.body.classList.add('night-theme');
      createStars();
    }
  }
}

// Particle Generation Functions

function createRainParticles() {
  const amount = 80;
  for (let i = 0; i < amount; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.top = `${Math.random() * -20}px`;
    drop.style.animationDuration = `${0.6 + Math.random() * 0.5}s`;
    drop.style.animationDelay = `${Math.random() * 2}s`;
    weatherAnimationContainer.appendChild(drop);
  }
}

function createSnowParticles() {
  const amount = 50;
  for (let i = 0; i < amount; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake';
    const size = Math.random() * 4 + 2;
    flake.style.width = `${size}px`;
    flake.style.height = `${size}px`;
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.top = `${Math.random() * -20}px`;
    flake.style.animationDuration = `${3 + Math.random() * 4}s`;
    flake.style.animationDelay = `${Math.random() * 5}s`;
    flake.style.opacity = Math.random();
    weatherAnimationContainer.appendChild(flake);
  }
}

function createStars() {
  const amount = 60;
  for (let i = 0; i < amount; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDuration = `${1.5 + Math.random() * 3}s`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    weatherAnimationContainer.appendChild(star);
  }
}

function createClouds() {
  const cloudCount = 3;
  for (let i = 0; i < cloudCount; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud-svg';
    cloud.innerHTML = `
      <svg width="150" height="90" viewBox="0 0 150 90" fill="white">
        <path d="M120,50 C120,33 105,20 85,20 C80,20 75,21 70,24 C62,10 46,0 28,0 C12,0 0,12 0,28 C0,34 2,40 5,45 C2,49 0,54 0,60 C0,76 13,89 29,89 L120,89 C136,89 150,76 150,60 C150,49 143,39 132,34 L120,50 Z"/>
      </svg>
    `;
    cloud.style.top = `${20 + Math.random() * 40}%`;
    cloud.style.animationDuration = `${60 + Math.random() * 90}s`;
    cloud.style.animationDelay = `-${Math.random() * 60}s`;
    // Random scale between 0.5 and 1.2
    cloud.style.transform = `scale(${0.5 + Math.random() * 0.7})`;
    weatherAnimationContainer.appendChild(cloud);
  }
}

function triggerLightningEffect() {
  // Simple periodic background flash simulator
  const interval = setInterval(() => {
    if (!document.body.classList.contains('rain-theme')) {
      clearInterval(interval);
      return;
    }
    if (Math.random() > 0.8) {
      document.body.style.filter = 'brightness(2.5)';
      setTimeout(() => {
        document.body.style.filter = 'none';
      }, 50 + Math.random() * 100);
      
      // double flash sometimes
      if (Math.random() > 0.5) {
        setTimeout(() => {
          document.body.style.filter = 'brightness(2.2)';
          setTimeout(() => {
            document.body.style.filter = 'none';
          }, 40);
        }, 150);
      }
    }
  }, 3000);
}

function createSunRayEffect() {
  const sunPulse = document.createElement('div');
  sunPulse.style.position = 'absolute';
  sunPulse.style.top = '-10%';
  sunPulse.style.right = '-10%';
  sunPulse.style.width = '300px';
  sunPulse.style.height = '300px';
  sunPulse.style.borderRadius = '50%';
  sunPulse.style.background = 'radial-gradient(circle, rgba(253,224,71,0.2) 0%, rgba(253,224,71,0) 70%)';
  sunPulse.style.animation = 'pulse 8s ease-in-out infinite';
  
  // Append keyframe programmatically if not defined
  if (!document.getElementById('pulse-keyframe')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'pulse-keyframe';
    styleSheet.innerHTML = `
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  weatherAnimationContainer.appendChild(sunPulse);
}

// Inicializa a aplicação na tela de boas-vindas com o ciclo de climas ativo
showState('welcome');

