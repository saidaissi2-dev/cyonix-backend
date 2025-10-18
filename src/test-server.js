require('dotenv').config();
const express = require('express');
const app = express();

app.set('trust proxy', 1);
app.use(express.json());

// Route de test simple
app.post('/api/auth/signup', async (req, res) => {
  console.log('TEST SIGNUP CALLED!', req.body);
  res.json({ success: true, message: 'Test OK', data: req.body });
});

app.listen(3001, () => {
  console.log('Test server on port 3001');
});
