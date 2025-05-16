const express = require("express");
const dbConfig = require("./config/dbConfig");
const cors = require("cors");
const {readdirSync} = require('fs');
const morgan = require("morgan");

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

readdirSync('./Routes').map((r) => app.use('/api', require(`./Routes/${r}`))); 



app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});

