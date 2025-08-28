import express from 'express';

const app = express();
const port = 3102;

app.get('/', (req, res) => {
  res.send('space-api');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

