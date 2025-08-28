import express from 'express';
import {fetchData} from './modules/spaceWeather.js';
import {getEarthImagery} from './modules/earthNow.js';
import {getNeoFeed} from './modules/nearEarthObjects.js';

const app = express();
const port = 3102;

app.get('/', (req, res) => {
  res.send('space-api');
});

app.get('/solarflares', async (req, res) => {
  console.log("Getting solar flares");
  const response = await fetchData('solarFlares');
  res.json(response);
});

app.get('/sep', async (req, res) => {
  console.log("Getting SEPs")
  const response = await fetchData('SEP');
  res.json(response);
});

app.get('/cmes', async (req, res) => {
  console.log("Getting coronal mass ejections")
  const response = await fetchData('CMEs');
  res.json(response);
});

app.get('/earthnow', async (req, res) => {
  const response = await getEarthImagery();
  res.json(response);
});

app.get('/neos', async (req, res) => {
  const response = await getNeoFeed();
  res.json(response);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

