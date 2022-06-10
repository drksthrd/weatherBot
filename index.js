require('dotenv').config()
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const port = 8000;

const getWeatherData = (city, cb) => {
  axios(`https://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${process.env.OPEN_WEATHER_API_KEY}`)
  .then(data => {
    cb(null, data.data);
  })
  .catch(err => {
    cb(err);
  })
};

const formatWeatherData = (weatherData) => {
  const weather = weatherData.weather[0].description;
  const temp = weatherData.main.temp - 273;
  const humidity = weatherData.main.humidity;
  const windSpeed = weatherData.wind.speed;
  const name = weatherData.name;
  const botText =
    `The current weather in *${name}* is: \n
    description - *${weather}* \n
    temperature - *${Math.round(temp)} ˚C*, \n
    wind speed - *${windSpeed} mph*  \n
    humidity - *${humidity}*%`;
  return botText;
};

const stripName = (message) => {
  return message.split(' ').slice(1).join(' ');
}

const postMessage = (event, text, cb) => {
  axios({
    url: 'https://slack.com/api/chat.postMessage',
    method: 'post',
    headers: {
      'Authorization': `Bearer ${process.env.BOT_TOKEN}`,
      'Content-type': 'application/json'
    },
    data: {
      channel: event.channel,
      text
    }
  })
  .then(data => {
    cb(null, data);
  })
  .catch(err => {
    cb(err);
  })
};


app.post('/', (req, res) => {
  if (req.body.challenge) {
    res.json(req.body.challenge);
  } else {
    const event = req.body.event;
    if (event && !event.bot_id && !event.subtype) {
      const city = stripName(event.text);
      getWeatherData(city, (err, weatherData) => {
        if (err) {
          res.status(500).send(err);
        } else {
          const botText = formatWeatherData(weatherData);
          postMessage(event, botText, (err, data) => {
            if (err) {
              res.status(500).send(err);
            } else {
              res.end();
            }
          });
        }
      });
    } else {
      res.end();
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});