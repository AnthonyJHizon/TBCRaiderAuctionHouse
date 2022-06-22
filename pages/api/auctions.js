const refreshToken = require("../../utils/refreshToken");
const getAccessToken = require("../../utils/getAccessToken");
const connectToDatabase = require("../../utils/dbConnect");

export default async function getAuctions(req,res) {
    let auctionData = {}
    let econnreset = false;
    let limit = 0;
    if(!req.query) {
      return res.status(400).json(null);
    }
    do{
      try{
        await connectToDatabase();
        const startTime = Date.now();
        const response = await fetch(`https://us.api.blizzard.com/data/wow/connected-realm/${req.query.realmKey}/auctions/${req.query.ahKey}?namespace=dynamic-classic-us&access_token=${await getAccessToken()}`);
        const data = await response.json();
        const minPriceHash = {};
        data.auctions && data.auctions.forEach(item => {
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
        // auctionData.lastModified = response.headers.date;
        auctionData.items = minPriceHash
        const endTime = Date.now();
        console.log(`Elapsed time ${endTime - startTime}`)
        econnreset = false;
        }
      catch (error) {
        if(error.response)
        {
          if(error.response.status === 401)
          {
            //assume access token expired
            const newAccessToken = await refreshToken();
            try{
                await connectToDatabase();
                const response = await fetch(`https://us.api.blizzard.com/data/wow/connected-realm/${req.query.realmKey}/auctions/${req.query.ahKey}?namespace=dynamic-classic-us&access_token=${newAccessToken}`);
                const data = await response.json();
                const minPriceHash = {};
                data && data.auctions.forEach(item => {
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
                // auctionData.lastModified = response.headers.date;
                auctionData.items = minPriceHash
                const endTime = Date.now();
                console.log(`Elapsed time ${endTime - startTime}`)
                econnreset = false;
            }
            catch (err) {
              console.log(err.response.status)
            }
          }
          else
          {
            console.log(error.response.status);
          }
        }
        else if (error.code) //most likely econnreset
        {
          if(error.code === "ECONNRESET")
          {
            limit++; //give up when limit is > 10
            console.log("econnreset");
            econnreset = true;
          }
        }
        else //unknown error
        {
          console.log(error)
        }
      }
    } while(econnreset && limit < 10);
    res.json(auctionData);
}