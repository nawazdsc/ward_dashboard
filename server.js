import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/api/claude', async (req, res) => {
  const body = req.body;
  if (body.mcp_servers) {
    body.mcp_servers = body.mcp_servers.map((s) =>
      s.url.includes('notion')
        ? { ...s, authorization_token: process.env.NOTION_TOKEN }
        : s
    );
  }
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'mcp-client-2025-04-04',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  res.json(data);
});

app.listen(3001, () => console.log('Proxy on :3001'));
