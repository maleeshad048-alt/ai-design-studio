import express from 'express';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Font හඳුනා ගැනීමේ API Endpoint එක
app.post('/api/identify-font', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'කරුණාකර පින්තූරයක් තෝරන්න.' });

    const base64Image = req.file.buffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: req.file.mimetype,
          },
        },
        'You are an expert typographer. Identify the font(s) used in this image. Provide: 1. Exact or closest matching font names, 2. Free Google Fonts alternatives, 3. Font category (Serif, Sans-serif, Script, etc.) and key visual traits. Keep the response concise and structured.'
      ],
    });

    res.json({ result: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Font හඳුනා ගැනීමේදී දෝෂයක් ඇති විය.' });
  }
});

// 2. සිංහල/ඕනෑම භාෂාවක් ඉංග්‍රීසි AI Image Prompt එකකට පරිවර්තනය කිරීම
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    const translation = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Translate and expand this image description into a clear, detailed English prompt for an AI image generator. Output ONLY the English prompt, nothing else: "${prompt}"`
    });

    res.json({ englishPrompt: translation.text.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Prompt පරිවර්තනය කිරීමේදී දෝෂයක් ඇති විය.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Design Studio Server running on port ${PORT}`));