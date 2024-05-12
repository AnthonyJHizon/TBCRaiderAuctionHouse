import { Suspense } from 'react';

import { unstable_noStore } from 'next/server';
import dynamic from 'next/dynamic';

import WowTokenData from '../actions/getWowTokenInfo';
import { getWowTokenGTE } from '../lib/db/wowToken/get';

const LineChart = dynamic(() => import('./LineChart'), { ssr: false });

export default async function WowToken() {
	unstable_noStore();

	const currentToken = await WowTokenData();
	const data = await getWowTokenGTE(3);

	const currentTokenPrice = currentToken.price / 10000;
	const chartData = data.map((d) => [d.date, d.price]);

	let yMin = Number.MAX_SAFE_INTEGER;
	let yMax = Number.MIN_SAFE_INTEGER;

	chartData.forEach((dataPoint) => {
		yMin = Math.min(yMin, dataPoint[1]);
		yMax = Math.max(yMax, dataPoint[1]);
	});

	yMin = Math.round(yMin / 250) * 250 - 250;
	yMax = Math.round(yMax / 250) * 250 + 250;

	return (
		<div className="relative flex min-h-[350px] h-[50vh] w-full items-center justify-center z-10 bg-gradient-to-r from-gray-700 via-gray-900 to-black text-white text-normal-1">
			<img
				src="wow-token.webp"
				alt=""
				className="absolute z-[-10] h-full w-full object-cover  mix-blend-overlay"
				draggable={false}
			/>
			<Suspense
				fallback={<p className="animate-pulse text-header-1">Loading</p>}
			>
				<LineChart
					data={chartData}
					title={`1 Wow Token = ${currentTokenPrice} Gold`}
					yMin={yMin}
					yMax={yMax}
					yAxisName="Price in gold"
					xAxisName="Date"
				/>
			</Suspense>
		</div>
	);
}
