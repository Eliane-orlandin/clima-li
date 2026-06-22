import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Carrega o conteúdo HTML do index.html para simular no JSDOM
const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('Frontend - main.js', () => {
  let main;

  beforeAll(async () => {
    // Inicializa o DOM
    document.documentElement.innerHTML = html;
    
    // Mock de funções globais e timers
    vi.stubGlobal('fetch', vi.fn());
    
    // Importa dinamicamente para garantir que o script interaja com o JSDOM configurado
    main = await import('../main.js');
  });

  beforeEach(() => {
    // Limpa mocks e classes do body antes de cada teste
    vi.clearAllMocks();
    document.body.className = '';
    document.getElementById('weather-animation').innerHTML = '';
  });

  describe('showState()', () => {
    it('deve exibir apenas o loader ao mudar para o estado "loading"', () => {
      main.showState('loading');
      
      expect(document.getElementById('loader').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('error-card').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('welcome-card').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('weather-dashboard').classList.contains('hidden')).toBe(true);
    });

    it('deve exibir apenas o error-card ao mudar para o estado "error"', () => {
      main.showState('error');
      
      expect(document.getElementById('loader').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('error-card').classList.contains('hidden')).toBe(false);
      expect(document.getElementById('welcome-card').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('weather-dashboard').classList.contains('hidden')).toBe(true);
    });

    it('deve exibir o dashboard ao mudar para o estado "dashboard"', () => {
      main.showState('dashboard');
      
      expect(document.getElementById('loader').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('error-card').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('welcome-card').classList.contains('hidden')).toBe(true);
      expect(document.getElementById('weather-dashboard').classList.contains('hidden')).toBe(false);
    });
  });

  describe('applyAtmosphere()', () => {
    it('deve aplicar o tema de chuva para código 1063 (Chuva leve)', () => {
      main.applyAtmosphere(1063, 1);
      
      expect(document.body.classList.contains('rain-theme')).toBe(true);
      const drops = document.querySelectorAll('.rain-drop');
      expect(drops.length).toBeGreaterThan(0);
    });

    it('deve aplicar o tema de neve para código 1210 (Neve leve)', () => {
      main.applyAtmosphere(1210, 1);
      
      expect(document.body.classList.contains('snow-theme')).toBe(true);
      const flakes = document.querySelectorAll('.snowflake');
      expect(flakes.length).toBeGreaterThan(0);
    });

    it('deve aplicar o tema de dia claro (day-theme) para código 1000 e isDay=1', () => {
      main.applyAtmosphere(1000, 1);
      
      expect(document.body.classList.contains('day-theme')).toBe(true);
    });

    it('deve aplicar o tema de noite (night-theme) para código 1000 e isDay=0', () => {
      main.applyAtmosphere(1000, 0);
      
      expect(document.body.classList.contains('night-theme')).toBe(true);
      const stars = document.querySelectorAll('.star');
      expect(stars.length).toBeGreaterThan(0);
    });
  });

  describe('updateUI()', () => {
    it('deve renderizar as informações climáticas e previsões nos elementos corretos', () => {
      const mockData = {
        location: { name: 'São Paulo', region: 'São Paulo', country: 'Brasil', localtime: '2026-06-22T12:00:00' },
        current: {
          temp_c: 25.4,
          condition: { text: 'Ensolarado', icon: '//cdn.weatherapi.com/icon.png', code: 1000 },
          humidity: 60,
          wind_kph: 15,
          feelslike_c: 26.2,
          uv: 4,
          is_day: 1
        },
        forecast: {
          forecastday: [
            {
              date: '2026-06-22',
              day: {
                maxtemp_c: 28,
                mintemp_c: 18,
                condition: { text: 'Parcialmente nublado', icon: '//cdn.weatherapi.com/icon2.png' }
              }
            }
          ]
        }
      };

      main.updateUI(mockData);

      expect(document.getElementById('city-name').textContent).toContain('São Paulo');
      expect(document.getElementById('temperature').textContent).toBe('25'); // Math.round(25.4) -> 25
      expect(document.getElementById('weather-description').textContent).toBe('Ensolarado');
      expect(document.getElementById('stat-humidity').textContent).toBe('60%');
      expect(document.getElementById('stat-wind').textContent).toBe('15 km/h');
      expect(document.getElementById('stat-feelslike').textContent).toBe('26°C');
      expect(document.getElementById('stat-uv').textContent).toContain('4');
      
      // Verifica o forecast container
      const forecastCards = document.querySelectorAll('.forecast-card');
      expect(forecastCards.length).toBe(1);
      expect(forecastCards[0].querySelector('.forecast-desc').textContent).toBe('Parcialmente nublado');
    });
  });
});
