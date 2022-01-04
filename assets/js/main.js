// Contract
const contractAddress = "0x95021fc8dd017f6c67AB66E9FD59c4846eDdB13f";
const contractABI = getAbi();

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const ethereum = window.ethereum;
const screenWidth = window.screen.width;
const decimals = 18;

let provider;
let ethersProvider;

let web3Modal;
let contract;
let signerContract;
let accounts;

let currentTab = 'main';

async function init() {	
	
}

async function onConnect() {
	const providerOptions = {
		walletconnect: {
			package: WalletConnectProvider,
			options: {
			  rpc: {
				 97: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
			  },
			}
		}
	};
	web3Modal = new Web3Modal({
		cacheProvider: false, // o
		providerOptions, // r
		disableInjectedProvider: false, // o
		theme: "dark"
	});
	
	console.log("Opening a dialog", web3Modal);
	try {
		provider = await web3Modal.connect();
	} catch (e) {
		console.log("Could not get a wallet connection", e);
		return;
	}
  
	ethersProvider = new ethers.providers.Web3Provider(provider);
	contract = new ethers.Contract(contractAddress, contractABI, ethersProvider);
	signerContract = contract.connect(ethersProvider.getSigner(provider.selectedAddress));
	document.querySelector("#walletID").innerHTML = "<a href='https://bscscan.com/address/" + provider.selectedAddress + "'>" + cutAdress(provider.selectedAddress) + "</a>";
	document.querySelector("#isConnected").style.display = "block";
	document.querySelector("#walletID").style.display = "block";
	document.querySelector("#connectNow").style.display = "none";
	document.querySelector("#disconnectNow").style.display = "block";
	autoUpdate();
}

//disconnect button
async function onDisconnect() {
  console.log("Killing the wallet connection", provider);

  // Which providers have close method?
  if (provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  // Set the UI back to the initial state
	document.querySelector("#connectNow").style.display = "block";
	document.querySelector("#disconnectNow").style.display = "none";
	document.querySelector("#walletID").textContent = "";
	ResetAll();
}
function fromWei(number, zeros=0) {
	
	return parseFloat(ethers.utils.formatUnits(number, decimals)).toFixed(zeros);
}

function numberWithSpaces(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.join(".");
}

// burn to hell button
async function burnHell() {
	if (provider) {	
		await signerContract.sendToHell(ethers.utils.parseUnits("1000", decimals));
	}
	else {
		console.log('Please install MetaMask!');
	}
	
}

async function setAutoClaimToggle() {
	if( document.getElementById("autoClaimToggle").getAttribute("aria-pressed") === 'false') { 
		await signerContract.setMyAutoPayout(true)
	}
	else { 
		await signerContract.setMyAutoPayout(false)
	}
	
}

//claimReward button
async function claimReward() {
	if (provider) {	
		await signerContract.claimMyReflections();
	}
	else {
		console.log('Please install MetaMask!');
	}
	
}

//button event listereners
window.addEventListener("load", async () => {
  init();
  document.querySelector("#burnToHell").addEventListener("click", burnHell);
  document.querySelector("#claimReward").addEventListener("click", claimReward);
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);
});

function cutAdress(adress) {
	//return adress
	return adress.slice(0,4) + '...' + adress.slice(-4)
}

function ResetAll() {
  provider = null;
  document.querySelector("#wallbal").textContent = "0";    
  document.querySelector("#wallbalusd").textContent = "($0)"; 
  document.querySelector("#notClaimed").textContent = "0"; 
  document.querySelector("#totalEarned").textContent = "0";
  document.querySelector("#userBurnPercent").textContent = "0%"; 
  document.querySelector("#burnProgressBar").innerHTML = '<div class="progress-bar l-blue" role="progressbar" aria-valuenow="' + 0 + '" aria-valuemin="0" aria-valuemax="100" style="width: ' +  + '%;"></div>';
  document.querySelector("#totalReflection").textContent = "0";
  document.querySelector("#totalLottery").textContent = "0";
  document.querySelector("#totalJackpot").textContent = "0";
  document.querySelector("#burnToHell").addEventListener("click", burnHell);
  document.querySelector("#claimReward").addEventListener("click", claimReward);
  document.querySelector("#claimReward").setAttribute("disabled", "disabled");
  document.querySelector("#burnToHell").setAttribute("disabled", "disabled");
}

async function loadContract() {
	ethersProvider = new ethers.providers.Web3Provider(provider);
	contract = new ethers.Contract(contractAddress, contractABI, ethersProvider);
    return contract;
}

async function setReflectionsTokenShare() {
	const reflectionsTokenShare = document.getElementById("hellfireSliderInput").value;
	await signerContract.setMyReflectionsTokenShare(reflectionsTokenShare);
}

async function resetReflectionsTokenShare() {
	loadSlidersData(await signerContract.getMyReflectionsTokenShare());
}


async function loadSlidersData(reflectionsTokenShare) {
	document.getElementById("hellfireSliderSpan").textContent = reflectionsTokenShare + "%";
	document.getElementById("bnbSliderSpan").textContent = (100 - reflectionsTokenShare) + "%";
	document.getElementById("hellfireSliderInput").value = reflectionsTokenShare;
	document.getElementById("bnbSliderInput").value = 100 - reflectionsTokenShare;
}

async function refreshMainTab(isAuto = 0) {
	currentTab = 'main';
	$("#connectLoading").fadeIn();
	const functionsMap = [contract.balanceOf(provider.selectedAddress),
				 contract.checkTotalBurnedByAddress(provider.selectedAddress),
				 contract.totalBurned(),
				 contract.totalSupply(),
				 contract.checkAvailableReflections(provider.selectedAddress),
				 signerContract.getMyAutoPayoutStatus(),
				 contract.distributedReflections(),
				 contract.totalLotteryWon(),
				 contract.totalLotteryWinners(),
				 contract.totalJackpotWon(),
				 contract.totalJackpotWinners(),
				 signerContract.getMyReflectionsTokenShare()
				];
	const functionMapResults = await Promise.all(functionsMap);
	const walletbalance = functionMapResults[0];
	const burnedByAddress = functionMapResults[1];
	const totalBurned = functionMapResults[2];
	const totalSupply = functionMapResults[3];
	const rewardsToClaim = functionMapResults[4];
	const toggleIsActive = functionMapResults[5];
	const totalReflection = functionMapResults[6];
	const totalLottery = functionMapResults[7];
	const totalLotteryWinners = functionMapResults[8];
	const totalJackpot = functionMapResults[9];
	const totalJackpotWinners = functionMapResults[10];
	const tokensPriceInBNB = await contract.getTokensPriceInBNB(walletbalance);
	const bnbPriceInBUSD = await contract.getBNBPriceInBUSD(tokensPriceInBNB);
	const walletbal = fromWei(walletbalance, 0);
	const userBurnPercent = burnedByAddress / totalBurned;
	const allBurnPercent = totalBurned /totalSupply;
	const notClaimed = fromWei(rewardsToClaim, 0);
	const totalEarned = parseInt(totalLottery) + parseInt(totalJackpot) + parseInt(totalReflection);
	const reflectionsTokenShare = parseInt(functionMapResults[11]);
	document.querySelector("#wallbal").textContent = numberWithSpaces(walletbal);
	document.querySelector("#wallbalusd").textContent = numberWithSpaces(fromWei(bnbPriceInBUSD, 2)) + "$";
	document.querySelector("#notClaimed").textContent = numberWithSpaces(notClaimed);
	document.querySelector("#totalEarned").textContent = numberWithSpaces(fromWei(totalEarned + '', 6));
	document.querySelector("#burnToHell").addEventListener("click", burnHell);
	document.querySelector("#claimReward").addEventListener("click", claimReward);
	document.querySelector("#autoClaimToggle").addEventListener("click", setAutoClaimToggle);
	document.querySelector("#userBurnPercent").textContent = userBurnPercent.toFixed(15) + " %";
	document.querySelector("#totalBurnPercent").textContent = allBurnPercent.toFixed(15) + " %";
	//document.querySelector("#burnProgressBar").innerHTML = '<div class="progress-bar l-blue" role="progressbar" aria-valuenow="' + allBurnPercent + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + allBurnPercent + '%;"></div>';
	document.querySelector("#totalReflection").textContent = numberWithSpaces(fromWei(totalReflection + '', 6));
    document.querySelector("#totalLottery").textContent = numberWithSpaces(fromWei(totalLottery + '', 6));
	document.querySelector("#totalLotteryWinners").textContent = "(" + totalLotteryWinners + " winners)";
    document.querySelector("#totalJackpot").textContent = numberWithSpaces(fromWei(totalJackpot + '', 6));
	document.querySelector("#totalJackpotWinners").textContent = "(" + totalJackpotWinners + " winners)";
	document.getElementById("setReflectionsTokenShare").addEventListener("click", setReflectionsTokenShare);
	document.getElementById("resetReflectionsTokenShare").addEventListener("click", resetReflectionsTokenShare);
	document.getElementById("setReflectionsTokenShare").disabled = false;
	$("[class='fadeInLabels']").fadeIn();
	if (!isAuto) {
		loadSlidersData(reflectionsTokenShare);
	}
	if (walletbal > 0) {
		document.querySelector("#claimReward").disabled = false;
		document.querySelector("#burnToHell").disabled = false;
	}
	if (toggleIsActive) {
		document.querySelector("#autoClaimToggle").classList.add('active');
		document.querySelector("#autoClaimToggle").setAttribute("aria-pressed", "true");
	}
	else {
		if (document.querySelector("#autoClaimToggle").classList.contains('active')) {
			document.querySelector("#autoClaimToggle").classList.remove('active');
		}
		document.querySelector("#autoClaimToggle").setAttribute("aria-pressed", "false");
	}
	$("#connectLoading").fadeOut();
}

async function loadNavBarButtons() {
	$(document).ready(function() {
    $('[class="navbarbutton"]').click(function(){
		
	$('[class="active open"]').removeClass("active open");
	$(this).parent().addClass('active open');
    
    var toLoad = $(this).attr('taburl')+' #content';
    $('#content').hide('fast',loadContent);
//    $('#load').remove();
//    $('#wrapper').append('<span id="load">LOADING...</span>');
//    $('#load').fadeIn('normal');
    function loadContent() {
		$('#content').load(toLoad,'',showNewContent())
		
		if (toLoad == "burners.html #content") {
			currentTab = 'burners';
			console.log("burners tab");
			autoUpdate();
		}
		else if (toLoad == "winnings.html #content") {
			currentTab = 'winnings';
			if (contract != undefined) {
				refreshWinnersTab();
				refreshWinnersTable();				
			}
		}
		else if (toLoad == "index.html #content") {
			currentTab = 'main';
			console.log("main tab");
			autoUpdate();
		}
		else if (toLoad == "game1.html #content") {
			currentTab = 'game1';
			console.log(currentTab);
			refreshGame1();
		}
		else {
			currentTab = 'other';
		}
    }
    function showNewContent() {
		$('#content').show('normal',hideLoader());
	}
    function hideLoader() {
	 $("body").removeClass("overlay-open");
	 $(".overlay").css("display", "none");
//     $('#load').fadeOut('normal');
    }
	$('#tableBurnd').hide('fast');
	//if (currentTab == 'game1') {
			
	//	}
    return false;
    });
});
	
}

async function refreshBurnersTable() {
	$("#connectLoading").fadeIn();
	//contractTable = await contract.getAllBurners();
	sortedContractTable = [...(await contract.getAllBurners())];
	sortedContractTable.sort(function(a, b) {return b[1] - a[1];});
	totalBurned = await contract.totalBurned();
	async function createTableBody() {
		let rows = sortedContractTable.length;
		let table = document.getElementById('burnersTable');  
		table.innerHTML = ("<tr class='text-light'>" + "<th></th>" + "</tr>").repeat(rows);
	};

	async function tableFill() {
		let tr = document.querySelectorAll('#burnersTable tr');
		let th = document.querySelectorAll('#burnersTable th');
		for(let i = 0; i < sortedContractTable.length; i++) {
			th[i].innerHTML = (i + 1);
		}
		for( let i = 0; i < sortedContractTable.length; i++ ) {
			let adress = (screenWidth < 600) ? (cutAdress(sortedContractTable[i][0])) : sortedContractTable[i][0];
			tr[i].innerHTML = tr[i].innerHTML + ("<td><a href='https://bscscan.com/address/" + sortedContractTable[i][0] + "'>" + adress + "</td><td>" + numberWithSpaces((await fromWei(sortedContractTable[i][1]))) + "</td><td><p style='margin-bottom: 0px;'>" + (100 * parseFloat(sortedContractTable[i][1])/parseFloat(totalBurned)).toFixed(4) + '%</p><div class="progress"><div class="progress-bar l-amber" role="progressbar" aria-valuenow="' + (100 * parseFloat(sortedContractTable[i][1])/parseFloat(totalBurned)).toFixed(0) + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + (100 * parseFloat(sortedContractTable[i][1])/parseFloat(totalBurned)).toFixed(0) + '%;"></div></div></td>');
		}
	}

	createTableBody();
	tableFill();
	$("#burnersTableHead").fadeIn();
	$("#connectLoading").fadeOut();
}

async function animateShowJackpots() {
	$("#winnersTableHead").fadeOut("fast");
	await showJackpots();
}

async function animateRefreshWinnersTable() {
	$("#winnersTableHead").fadeOut("fast");
	document.getElementById('isJackpotCol').style.display = "block";
	setTimeout(refreshWinnersTable, 500);
}

async function refreshWinnersTab() {
	const functionsMap = [contract.TotalLotteryWon(provider.selectedAddress),
				 contract.TotalJackpotWon(provider.selectedAddress),
				 contract.TotalReflectionsClaimed(provider.selectedAddress),
				 contract.totalLotteryWon(),
				 contract.totalLotteryWinners(),
				 contract.totalJackpotWon(),
				 contract.totalJackpotWinners(),
				];
	const functionMapResults = await Promise.all(functionsMap);
	const lotteryWin = functionMapResults[0];
	const jackpotWin = functionMapResults[1];
	const reflectionsClaimed = functionMapResults[2];
	const totalLotteryWon = functionMapResults[3];
	const totalLotteryWinners = functionMapResults[4];
	const totalJackpotWon = functionMapResults[5];
	const totalJackpotWinners = functionMapResults[6];
	document.getElementById('lotteryWinnings').textContent = fromWei(lotteryWin) + "$";
	document.getElementById('allLottery').textContent = fromWei(totalLotteryWon, 15) + ' won by ' + totalLotteryWinners + " burners";
	document.getElementById('jackpotWinnings').textContent = fromWei(jackpotWin) + "$";
	document.getElementById('allJackpot').textContent = fromWei(totalJackpotWon, 15) + ' won by ' + totalJackpotWinners + " burners";
	if  (reflectionsClaimed != "0") {
		document.getElementById('lotteryWinningsPercent').textContent = " (" + (parseFloat(lotteryWin) / parseFloat(reflectionsClaimed)) + " % of your received rewards)";
		document.getElementById('jackpotWinningsPercent').textContent = " (" + (parseFloat(jackpotWin) / parseFloat(reflectionsClaimed)) + " % of your received rewards)";
	}
	
}

async function showJackpots() {
	$("#connectLoading").fadeIn();
	document.getElementById('isJackpotCol').style.display = "none";
	sortedContractTable = [...(await contract.getAllWinners())];
	sortedContractTable.sort(function(a, b) {return b[5] - a[5];});
	function createTableBody() {
		let rows = 0
		for (let i = 0; i < sortedContractTable.length; i++) {
			if (sortedContractTable[i][0] == 1) {
				rows += 1;
			}
		}
		let table = document.getElementById('winnersTable');
		if (rows == 0) {
			table.innerHTML = ("<h4 style='width: 100%; margin: 0 auto'>No winners yet</h4>");
		}
		else {
			table.innerHTML = ("<tr>" + "<th></th>" + "</tr>").repeat(rows);
		}
		return rows;
	};
	function tableFill() {
		let tr = document.querySelectorAll('#winnersTable tr');
		let th = document.querySelectorAll('#winnersTable th');
		for(let i = 0; i < sortedContractTable.length; i++) {
			th[i].innerHTML = (i + 1);
		}
		for( let i = 0; i < sortedContractTable.length; i++ ) {
			if (sortedContractTable[i][0] == 1) {
				let winningsInBUSD = (sortedContractTable[i][1] == "0") ? '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i>' : sortedContractTable[i][4];
				let isPaid = (sortedContractTable[i][1] == "0") ? '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i>' : '<i class="zmdi zmdi-check"></i>';
				let adress = (screenWidth < 600) ? cutAdress(sortedContractTable[i][2]) : sortedContractTable[i][2];
				tr[i].innerHTML = tr[i].innerHTML + ("<td><p><a href='https://bscscan.com/address/" + sortedContractTable[i][2] + "'>" + adress + "</p></td><td><p>" + numberWithSpaces(fromWei(sortedContractTable[i][3], decimals))  + "</p></td><td><p>" + winningsInBUSD + "</p></td><td><p>" + timeConverter(sortedContractTable[i][5]) + "</p></td><td><p>" + parseFloat(sortedContractTable[i][6])/1000000000 + "</p></td><td><p>" + isPaid + "</p></td>");
			}
		}
	}

	let rows = createTableBody();
	if (rows != 0) {
		tableFill();
	}
	$("#winnersTableHead").fadeIn();
	document.querySelector("#toggleJackpots").addEventListener("click", toggleJackpots);
	$("#connectLoading").fadeOut();
}

async function toggleJackpots() {
	if( document.getElementById("toggleJackpots").getAttribute("aria-pressed") === 'false') { await animateShowJackpots() }
	else { await animateRefreshWinnersTable() }
}

async function refreshWinnersTable() {
	$("#connectLoading").fadeIn();
	
	sortedContractTable = [...(await contract.getAllWinners())];
	sortedContractTable.sort(function(a, b) {return b[5] - a[5];});
	function createTableBody() {
		let rows = sortedContractTable.length;
		let table = document.getElementById('winnersTable');  
		if (rows == 0) {
			table.innerHTML = ("<h4 style='width: 100%; margin: 0 auto'>No winners yet</h4>");
		}
		else {
			table.innerHTML = ("<tr>" + "<th></th>" + "</tr>").repeat(rows);
		}
		return rows;
	};

	function tableFill() {
		let tr = document.querySelectorAll('#winnersTable tr');
		let th = document.querySelectorAll('#winnersTable th');
		for(let i = 0; i < sortedContractTable.length; i++) {
			th[i].innerHTML = (i + 1);
		}
		for( let i = 0; i < sortedContractTable.length; i++ ) {
			let winningsInBUSD = (sortedContractTable[i][1] == "0") ? '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i>' : sortedContractTable[i][4];
			let isPaid = (sortedContractTable[i][1] == "0") ? '<i class="zmdi zmdi-refresh zmdi-hc-spin"></i>' : '<i class="zmdi zmdi-check"></i>';
			let adress = (screenWidth < 600) ? cutAdress(sortedContractTable[i][2]) : sortedContractTable[i][2];
			if (sortedContractTable[i][0] == "1") {
				tr[i].style.backgroundColor = "#99ff99";
				tr[i].innerHTML = tr[i].innerHTML + ("<td><p style='font-weight: bold;'><a href='https://bscscan.com/address/" + sortedContractTable[i][2] + "'>" + adress + "</p></td><td><p style='font-weight: bold;'>" + numberWithSpaces(fromWei(sortedContractTable[i][3], decimals)) + "</p></td><td><p style='font-weight: bold;'>" + winningsInBUSD + "</p></td><td><p style='font-weight: bold;'>" + timeConverter(sortedContractTable[i][5]) + "</p></td><td><p style='font-weight: bold;'>" + parseFloat(sortedContractTable[i][6])/1000000000 + "</p></td><td><p style='font-weight: bold;'>" + "Yes" + "</p></td><td><p style='font-weight: bold;'>" + isPaid + "</p></td>");
			} else {
				tr[i].innerHTML = tr[i].innerHTML + ("<td><p><a href='https://bscscan.com/address/" + sortedContractTable[i][2] + "'>" + adress + "</p></td><td><p>" + numberWithSpaces(fromWei(sortedContractTable[i][3], decimals))  + "</p></td><td><p>" + winningsInBUSD + "</p></td><td><p>" + timeConverter(sortedContractTable[i][5]) + "</p></td><td><p>" + parseFloat(sortedContractTable[i][6])/1000000000 + "</p></td><td><p>" + "No" + "</p></td><td><p>" + isPaid + "</p></td>");
			}
		}
	}

	let rows = createTableBody();
	if (rows != 0) {
		tableFill();
	}
	$("#winnersTableHead").fadeIn();
	document.querySelector("#toggleJackpots").addEventListener("click", toggleJackpots);
	$("#connectLoading").fadeOut();
}

function refreshGame1() {
	$( document ).ajaxComplete(function() {
		try {
			new ChiefSlider('.slider', {
				loop: false,
				autoplay: false,
				interval: 5000,
				refresh: true,
			});
			sliderLoaded = true;
		}
		catch(e) {
			console.log();
		}
	});
}

function timeConverter(UNIX){
	const milliseconds = UNIX * 1000 
	const dateObject = new Date(milliseconds)
	const humanDateFormat = dateObject.toLocaleString()
	return humanDateFormat;
}

async function autoUpdate(isAuto) {
	if (contract != undefined) {
		document.querySelector("#walletID").innerHTML = "<a href='https://bscscan.com/address/" + provider.selectedAddress + "'>" + cutAdress(provider.selectedAddress) + "</a>";
		document.querySelector("#isConnected").style.display = "block";
		document.querySelector("#walletID").style.display = "block";
		if (currentTab == 'main') {
			await refreshMainTab(isAuto);
			await loadSliders();
		}
		else if (currentTab == 'winnings') {
			await refreshWinnersTab();
			if( document.getElementById("toggleJackpots").getAttribute("aria-pressed") === 'true') { await showJackpots() }
			else { await refreshWinnersTable() }
		}
		else if (currentTab == 'burners') {
			refreshBurnersTable();
		}
		//else if (currentTab == 'game1') {
		//	await refreshGame1();
		//}
	}
}

// Start function
const start = async function() {
	await init();
}

// Call start
start();
setInterval(
  () => autoUpdate(1),
  3000
);