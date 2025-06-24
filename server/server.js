import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mikecremental server is running!' });
});

app.get('/api/game-state', (req, res) => {
  // Placeholder for future game state API
  res.json({ 
    player: {
      level: 1,
      score: 0,
      currency: 0
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mikecremental server running on port ${PORT}`);
}); 