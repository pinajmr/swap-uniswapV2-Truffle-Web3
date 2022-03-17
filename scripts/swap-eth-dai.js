const { legos } = require('@studydefi/money-legos');
const moment = require('moment');

// Kovan DAI Token: https://kovan.etherscan.io/address/0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa
const DAI_ABI = legos.erc20.dai.abi;
const DAI_ADDRESS = '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa';
const daiContract = new web3.eth.Contract(DAI_ABI, DAI_ADDRESS);

// Kovan Uniswap UniswapV2Router02: https://kovan.etherscan.io/address/0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
const EXCHANGE_ABI = legos.uniswapV2.router02.abi;
const EXCHANGE_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
const exchangeContract = new web3.eth.Contract(EXCHANGE_ABI, EXCHANGE_ADDRESS);

//Set Deadline 1 minute from now
const now = moment().unix();
const DEADLINE = now + 60;

//Transaction Setting
const SETTINGS = {
    gasLimit: 6000000,
    gasPrice: web3.utils.toWei('10', 'Gwei'),
    from: '0x4317c44fD3143D8AC5723865CF046238A2cd8FD3',
    value: web3.utils.toWei('0.001', 'Ether')
}
/** Script converts 0.01 ETH to DAI. Script:
 *  # gets WETH address - WETH()
 *  # checks how much DAI can be swapped for 0.01 ETH - getAmountsOut()
 *  # performs swap - swapETHForExactTokens()
 */
module.exports = async function (callback) {
    try {
        let balance;

        //Check Ether balance BEFORE swap
        balance = await web3.eth.getBalance(SETTINGS.from);
        balance = web3.utils.fromWei(balance, 'Ether');
        console.log(`The balance of Ether is: ${balance} ETH`);

        //Check Dai balance BEFORE swap 
        balance = await daiContract.methods.balanceOf(SETTINGS.from).call();
        balance = web3.utils.fromWei(balance, 'Ether');
        console.log(`The Dai balance is: ${balance} DAI`);

        //Get WETH address
        const WETH_ADDRESS = await exchangeContract.methods.WETH().call();

        //Array of tokens address
        const pairArray = [WETH_ADDRESS, DAI_ADDRESS];

        //Get DAI amount for 0.001 ETH 
        const tokenAmount = await exchangeContract.methods.getAmountsOut(SETTINGS.value, pairArray).call();
        console.log(`${SETTINGS.value} ETH will be swapped to ${web3.utils.fromWei(tokenAmount[1], 'Ether')} DAI`);

        //Perform Swap
        console.log(`\nPerfoming swap . . . . `);
        let result = await exchangeContract.methods.swapETHForExactTokens(tokenAmount[1].toString(), pairArray, SETTINGS.from, DEADLINE).send(SETTINGS);
        console.log(`Successful swap: https://ropsten.etherscan.io/tx/${result.transactionHash}`)

        //Check Ether balance AFTER swap
        balance = await web3.eth.getBalance(SETTINGS.from);
        balance = web3.utils.fromWei(balance, 'Ether');
        console.log(`\n The ether balance: ${balance} ETH`);

        //Check Dai balance AFTER swap
        balance = await daiContract.methods.balanceOf(SETTINGS.from).call();
        balance = web3.utils.fromWei(balance, 'Ether');
        console.log(`\nThe dai balance is: ${balance} DAI`)

    }
    catch (error) {
        console.error(error);
    }
    callback();
}