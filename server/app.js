require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');

const refreshToken = require('./utils/refreshToken');
const getAccessToken = require('./utils/getAccessToken');
const queryDBItems = require('./utils/queryDBItems')
const iterateDB = require('./utils/iterateDB');

//set up db
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  await refreshToken();
  console.log("connected to db and refreshed token")
}).catch((error) => console.log(error))

const app = express(); //express app

app.use(cors());
app.use(cookieParser());
// app.use(bodyParser());

app.get('/', (req,res) => {
  res.send("123123");
})

app.get('/api/realms', async (req,res) => {
  let realmData = [];
  try{
    const response = await axios.get(`https://us.api.blizzard.com/data/wow/search/connected-realm?namespace=dynamic-classic-us&access_token=${await getAccessToken()}`);
    const results = response.data.results;
    results.forEach(result => {
      realmData.push({
        id: result.data.id,
        name: result.data.realms[0].name.en_US
      })
    });
    realmData.sort((a,b) => a.name.localeCompare(b.name)) //sort alphabetically
  }
  catch (error) {
    if(error.response)
    {
      if(error.response.status === 401)
      {
        //assume access token expired
        const newAccessToken = refreshToken();
        try{
          const response = await axios.get(`https://us.api.blizzard.com/data/wow/search/connected-realm?namespace=dynamic-classic-us&access_token=${newAccessToken}`);
          const results = response.data.results;
          results.forEach(result => {
            realmData.push({
              id: result.data.id,
              name: result.data.realms[0].name.en_US
            })
          });
          realmData.sort((a,b) => a.name.localeCompare(b.name)) //sort alphabetically
        }
        catch (err) {
          console.log(err)
        }
      }
    }
    console.log(error)
  }
  res.json(realmData);
})

app.get('/api/auctions', async (req,res) => {
  let auctionData = {}
  if(!req.query) {
    return res.status(400).json(null);
  }
  try{
    startTime = Date.now();
    const response = await axios.get(`https://us.api.blizzard.com/data/wow/connected-realm/${req.query.realmKey}/auctions/${req.query.ahKey}?namespace=dynamic-classic-us&locale=en_US&access_token=${await getAccessToken()}`);
    const minPriceHash = {};
    response.data && response.data.auctions && response.data.auctions.forEach(item => {
      if(!minPriceHash[item.item.id] && item.buyout > 0){
        minPriceHash[item.item.id] = item.buyout/item.quantity/10000
      }
      else{
        if(minPriceHash[item.item.id] > item.buyout/item.quantity/10000 && item.buyout > 0) //sometimes buyout is = 0
        {
          minPriceHash[item.item.id] = item.buyout/item.quantity/10000
        }
      }
    })
 
    // const promises = [];
    // Object.keys(minPriceHash).forEach((key) => {
    //   promises.push(queryDBItems(key));
    // })
    // await Promise.all(promises);
    // console.log(promises);

    auctionData.lastModified = response.headers.date;
    auctionData.auctionHouse = req.query.ahKey;
    // auctionData.total = response.data.auctions.length;
    // auctionData.uniqueItems = Object.keys(minPriceHash).length;
    auctionData.items = minPriceHash
    const endTime = Date.now();
    console.log(`Elapsed time ${endTime - startTime}`)
  }
  catch (error) {
    if(error.response)
    {
      if(error.response.status === 401)
      {
        //assume access token expired
        const newAccessToken = refreshToken();
        try{
          const response = await axios.get(`https://us.api.blizzard.com/data/wow/connected-realm/${req.query.currRealm}/auctions/${req.query.ahKey}?namespace=dynamic-classic-us&locale=en_US&access_token=${newAccessToken}`);
          const minPriceHash = {};
          const uniqueItems = [];
          auctionData.total = response.data.auctions.length;
          response.data && response.data.auctions.forEach(item => {
            if(!minPriceHash[item.item.id] && item.buyout > 0){
              minPriceHash[item.item.id] = item.buyout/item.quantity/10000
            }
            else{
              if(minPriceHash[item.item.id] > item.buyout/item.quantity/10000 && item.buyout > 0) //sometimes buyout is = 0
              {
                minPriceHash[item.item.id] = item.buyout/item.quantity/10000
              }
            }
          })
          // const promises = [];
          // Object.keys(minPriceHash).forEach((key) => {
          //   promises.push(queryDBItems(key));
          // })
          // await Promise.all(promises);
          // auctionData.uniqueItems = Object.keys(minPriceHash).length;
          auctionData.auctionHouse = req.query.ahKey;
          auctionData.items = minPriceHash;
          auctionData.lastModified = response.headers.date;
        }
        catch (err) {
          console.log(err)
        }
      }
    }
    console.log(error)
  }
  res.json(auctionData);
})

// app.get('/api/defaultItemInfo', async (req,res) => {
//   let itemInfo = {};
//   if(!req.query) {
//     return res.status(400).json(null);
//   }
//   try{
//     itemInfo = await getItemInfo(req.query.itemId)
//     if(itemInfo === null)
//     {
//       await sleep(500);
//       itemInfo = await addItemInfo(req.query.itemId);
//       console.log("newItem: ",itemInfo.name);
//     }
//   }
//   catch (error) {
//     console.log(error)
//   }
//   res.json(itemInfo);
// })



app.listen(3000, () => {
  console.log('server started')
});