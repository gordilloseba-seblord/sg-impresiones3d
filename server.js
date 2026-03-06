const express = require('express');
const cors = require('cors');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

const SYSTEM_PROMPT = `Sos el asistente virtual de SG Impresiones 3D, un negocio de impresión 3D ubicado en Paraná, Entre Ríos, Argentina. Tu handle de Instagram es @sg_impresiones3d.

Información del negocio:
- Servicios: Impresión FDM (plástico), Impresión en Resina (alta precisión), Diseño 3D personalizado, Producción en serie
- Materiales disponibles: PLA, PETG, ABS, Flex y ASA
- Todas las figuras y trabajos se realizan en impresión FDM, no trabajamos con resina
- Tiempos: respuesta en 24hs, entrega según complejidad (1-7 días generalmente)
- Atención: por Instagram @sg_impresiones3d o mensaje directo
- Ubicación: Paraná, Entre Ríos, Argentina
- Acepta envíos a todo el país

Tono: amigable, profesional, entusiasta con la tecnología 3D. Respondés en español rioplatense (usás "vos"). Sos conciso pero informativo. Si no sabés algo específico (como precios exactos), invitás a contactar por Instagram para una cotización personalizada. Máximo 3-4 oraciones por respuesta.`;

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  console.log('Pedido recibido:', JSON.stringify(messages));

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Faltan mensajes' });
  }

  if (!process.env.GROQ_API_KEY) {
    console.log('ERROR: GROQ_API_KEY no configurada');
    return res.status(500).json({ error: 'API key no configurada' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1000,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ]
      })
    });

    const data = await response.json();
    console.log('Respuesta Groq:', JSON.stringify(data));

    if (data.choices && data.choices[0]) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: data.error?.message || 'Sin respuesta de la IA' });
    }
  } catch (err) {
    console.error('ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'ok', service: 'SG Chat API' }));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log('Servidor corriendo en puerto ' + PORT));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    setTimeout(() => { server.close(); server.listen(PORT); }, 3000);
  }
});
