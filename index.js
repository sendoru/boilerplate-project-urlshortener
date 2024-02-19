require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.json());	// json 등록
app.use(bodyParser.urlencoded({ extended : false }));	// URL-encoded 등록

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

var map = {}

async function isConnectable(url) {
  url = url.replace('http://', '').replace('https://', '');
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return new Promise((resolve, reject) => {
    dns.lookup(url, options, (err, address, family) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

app.post('/api/shorturl', async function(req, res) {
  console.log(req.body);
  var url = req.body['url'];

  // check if url format is valid
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.json({"error":"invalid URL"});
  }

  // remove end / if exists
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  } 

  // check if website wtih dns of hostname is connectable
  if (!(await isConnectable(url))) {
    return res.json({"error":"invalid URL"});
  }

  // if given url is already in map, return its short url
  if (map[url] != undefined) {
    return res.json({"original_url":url, "short_url":map[url]});
  }

  // if not, create short url and return it
  var short_url = Object.keys(map).length;
  map[url] = short_url;
  return res.json({"original_url":url, "short_url":short_url});
});

app.get('/api/shorturl/:short_url', function(req, res) {
  var short_url = req.params.short_url;
  // this takes O(n) time but who cares
  var url = Object.keys(map).find(key => map[key] === Number(short_url));
  
  if (url == undefined) {
    res.json({"error":"No short url found for given input"});
    return;
  }

  res.redirect(url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
