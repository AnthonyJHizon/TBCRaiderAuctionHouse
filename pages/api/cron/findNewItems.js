import addItemInfo from '../../../utils/db/addItemInfo';
import connectToDatabase from '../../../utils/db/dbConnect';
import getAccessToken from '../../../utils/db/getAccessToken';
import getAllItem from '../../../utils/db/getAllItem';
import propsFormatAuctionData from '../../../utils/formatData/props/auction';

export default async function handler(req, res) {
	try {
		await connectToDatabase();
		const accessToken = await getAccessToken();
		const auctionRes = await fetch(
			//if a new item is discovered it is most likely going to be from this server's auction house
			`https://us.api.blizzard.com/data/wow/connected-realm/4728/auctions/7?namespace=dynamic-classic-us&access_token=${accessToken}`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
		let auctionData = await auctionRes.json();
		auctionData = await propsFormatAuctionData(auctionData);
		const allItems = await getAllItem();
		let newItems = [];
		Object.keys(auctionData).forEach((item) => {
			if (!allItems.has(item)) newItems.push(item);
		});
		await Promise.all(
			newItems.map(async (itemId, index) => {
				await new Promise((resolve) => setTimeout(resolve, index * 25)); //add delay to prevent going over blizzard api call limit
				await addItemInfo(itemId);
			})
		);
		res
			.status(200)
			.json({ mesage: 'Finished Search for New Items', success: true });
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Server Error' });
	}
}
