const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// Permite requests desde tu landing en Vercel
// Cambiá esto por tu URL real de Vercel cuando la tengas
app.use(cors({
  origin: '*'
}));

const SYSTEM_PROMPT = `Sos el asistente virtual de SG Impresiones 3D, un negocio de impresión 3D ubicado en Paraná, Entre Ríos, Argentina. Tu handle de Instagram es @sg_impresiones3d.

Información del negocio:
- Servicios: Impresión FDM (plástico), Impresión en Resina (alta precisión), Diseño 3D personalizado, Producción en serie
- Materiales FDM: PLA, PETG, ABS, TPU, entre otros
- Materiales Resina: resinas estándar, ABS-like, resinas flexibles
- Tiempos: respuesta en 24hs, entrega según complejidad (1-7 días generalmente)
- Atención: por Instagram @sg_impresiones3d o mensaje directo
- Ubicación: Paraná, Entre Ríos, Argentina
- Acepta envíos a todo el país

Tono: amigable, profesional, entusiasta con la tecnología 3D. Respondés en español rioplatense (usás "vos"). Sos conciso pero informativo. Si no sabés algo específico (como precios exactos), invitás a contactar por Instagram para una cotización personalizada. Máximo 3-4 oraciones por respuesta.`;

app.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Faltan mensajes' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    const data = await response.json();

    if (data.content && data.content[0]) {
      res.json({ reply: data.content[0].text });
    } else {
      res.status(500).json({ error: 'Sin respuesta de la IA' });
    }
  } catch (err) {
    console.error('ERROR DETALLADO:', err.message, JSON.stringify(err));
    res.status(500).json({ error: err.message });
  }
});

// Health check para Railway
app.get('/', (req, res) => res.json({ status: 'ok', service: 'SG Chat API' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
