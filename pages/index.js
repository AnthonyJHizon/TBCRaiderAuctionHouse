import Head from 'next/head'
import styles from '../styles/Home.module.css'


export default function Home({listings}) {
  let map = new Map();
  const posts = [];
  for(let i = 0; i<listings.auctions.length-1;i++)
  {
    if(!map.has(listings.auctions[i].item.id))
    {
      map.set(listings.auctions[i].item.id, listings.auctions[i].buyout/listings.auctions[i].quantity/10000);
    }
    else
    {
      if(map.get(listings.auctions[i].item.id) > listings.auctions[i].buyout/listings.auctions[i].quantity/10000 && listings.auctions[i].buyout > 0) // buyouts are sometimes = 0
      {
        // console.log(data.auctions[i].buyout + "           " + map.get(data.auctions[i].item.id));
        map.set(listings.auctions[i].item.id, listings.auctions[i].buyout/listings.auctions[i].quantity/10000);
        // console.log(map.get(data.auctions[i].item.id));
      }
    }
  }
  for (const [key,value] of map.entries()) {
    posts.push(<div>{key}: {intToGold(value.toFixed(4))}</div>)
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Raider Auction House</title>
        <meta name="description" content="Generated by create next app" />
      </Head>

      <main className={styles.main}>
        <div>
          {posts}
        </div>
      </main>

      <footer className={styles.footer}>
      </footer>
    </div>
  )
}


export const getStaticProps = async() => {
  const res = await fetch("https://us.api.blizzard.com/data/wow/connected-realm/4372/auctions/2?namespace=dynamic-classic-us&locale=en_US&access_token=USwMmO5QuXAeExdcWCOFcaUn1SorqzoyRJ")
  const data = await res.json();

  return {
    props: {
      listings : data
    },
    revalidate: 5,
  }
}


export const intToGold = (int) =>
{
  const valueArr = int.toString().split(".");
  const gold = valueArr[0]
  const silver = valueArr[1].substr(0,2);
  const copper = valueArr[1]. substr(2)

  return gold + "g " + silver + "s " + copper +"c"
}


