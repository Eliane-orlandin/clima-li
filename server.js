import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/weather', async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'Parâmetro city é obrigatório' });
  }

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API (WEATHER_API_KEY) não configurada no backend.' });
  }

  try {
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=3&aqi=no&alerts=no&lang=pt`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Erro ao buscar dados na API de Clima.' 
      });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Erro no servidor proxy:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao processar a requisição.' });
  }
});

// Configuração para servir os arquivos estáticos do frontend em produção
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Backend] Servidor rodando em http://localhost:${PORT}`);
});

