import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Backend Express API - /api/weather', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, WEATHER_API_KEY: 'mock-api-key' };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('deve retornar 400 se o parâmetro city estiver ausente', async () => {
    const res = await request(app).get('/api/weather');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Parâmetro city é obrigatório');
  });

  it('deve retornar 500 se a WEATHER_API_KEY não estiver configurada', async () => {
    delete process.env.WEATHER_API_KEY;
    const res = await request(app).get('/api/weather?city=Londres');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Chave de API (WEATHER_API_KEY) não configurada no backend.');
  });

  it('deve retornar 200 e dados do clima para uma cidade válida', async () => {
    const mockWeatherData = {
      location: { name: 'Londres', country: 'Reino Unido', localtime: '2026-06-22 12:00' },
      current: { temp_c: 20, condition: { text: 'Ensolarado', icon: '//cdn.weatherapi.com/icon.png' }, humidity: 50, wind_kph: 10, feelslike_c: 20, uv: 5, is_day: 1 },
      forecast: { forecastday: [] }
    };

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => mockWeatherData
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const res = await request(app).get('/api/weather?city=Londres');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockWeatherData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('deve retornar o status e erro da WeatherAPI para cidade inválida (ex: 400)', async () => {
    const mockErrorData = {
      error: { code: 1006, message: "No location found matching parameter 'q'" }
    };

    const mockResponse = {
      ok: false,
      status: 400,
      json: async () => mockErrorData
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const res = await request(app).get('/api/weather?city=Inexistente');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("No location found matching parameter 'q'");
  });

  it('deve lidar com limites de taxa da API (HTTP 429)', async () => {
    const mockErrorData = {
      error: { code: 2008, message: "API key has exceeded calls per month quota." }
    };

    const mockResponse = {
      ok: false,
      status: 429,
      json: async () => mockErrorData
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const res = await request(app).get('/api/weather?city=Londres');
    expect(res.status).toBe(429);
    expect(res.body.error).toBe("API key has exceeded calls per month quota.");
  });

  it('deve retornar 500 em caso de timeout da API externa', async () => {
    // Simula o erro lançado por timeout (DOMException de Abort)
    const timeoutError = new DOMException('The user aborted a request.', 'TimeoutError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError));

    const res = await request(app).get('/api/weather?city=Londres');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Erro interno do servidor ao processar a requisição.');
  });

  it('deve lidar com corpo de resposta corrompido ou inesperado', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => { throw new Error('JSON parsing failed'); }
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const res = await request(app).get('/api/weather?city=Londres');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Erro interno do servidor ao processar a requisição.');
  });
});
