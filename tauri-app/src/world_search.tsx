
const WORLD_SEARCH = () => {

function downloadViaAnchor(url: string, filename: string): void{
	const anchor = document.createElement('a');	
	anchor.href = url;
	anchor.download = filename;

	document.body.appendChild(anchor);
	anchor.click();

	document.body.removeChild(anchor);
	console.log(`Donwloading: ${filename} from ${url}`);
}

let intervalId: number | undefined;
let imageCounter = 0;

function startFeedDownload(peerIp: string, peerPort: string){
	if (intervalId) return;

	intervalId = setInterval(() => {
		imageCounter++;	
		const imageUrl = `http://${peerIp}:${peerPort}`;
		const filename = `download.png`;

		downloadViaAnchor(imageUrl, filename);
	
	}, 1000);
}

function stopLiveFeedDownload(){
	if (intervalId) {
		clearInterval(intervalId);	
		intervalId = undefined;
		console.log("down load stop");
	}
}

	return (
		<div>	
		<button onClick={() => startFeedDownload("127.0.0.1", "8080")}>
			Start Live Feed
		</button>
		<button onClick={stopLiveFeedDownload}>
			stop Live Feed
		</button>
		</div>	

	)
}
export default WORLD_SEARCH;
