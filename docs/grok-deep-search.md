Key Points

It seems likely that the issue with your React app not receiving connected data confirmation from the Hedera HashPack Chrome extension is due to timing, specifically calling the pairing function too early.
Research suggests adding a small delay (e.g., 500ms) before opening the pairing modal can help ensure the extension is fully initialized.
The evidence leans toward ensuring all Hashconnect events are registered before initialization to capture the pairing event properly.

Why the Connection Might Fail
Your app is likely attempting to connect before the HashPack extension is ready, causing the pairingEvent to not fire and savedPairings to remain empty. This can happen if the pairing modal is opened too soon after initialization.
How to Fix It

Add a Delay: Use setTimeout to delay opening the pairing modal, giving the extension time to initialize. For example:
javascriptsetTimeout(() => {
  hashconnect.openPairingModal();
}, 500);

Register Events Early: Make sure you set up event listeners (like pairingEvent) before initializing Hashconnect, as some events fire immediately after.
Check for Errors: Look for console errors like "URI missing" which might indicate issues with the pairing string.

Additional Tips

Ensure your app runs on HTTPS or a local server with SSL support (e.g., using http-server or ngrok), as HashPack requires a secure context.
Refer to the official Hashconnect React example for guidance: Hashconnect React Example.
For further help, consider joining the Hedera Developer Guild Discord: Hedera Developer Guild.


Detailed Survey Note
This section provides a comprehensive analysis of the issue where your React app fails to receive connected data confirmation from the Hedera HashPack Chrome browser extension, specifically when the pairingEvent does not fire and savedPairings remains empty. The discussion is informed by available documentation, community discussions, and practical examples, aiming to cover all relevant details for a thorough understanding.
Background and Context
The Hedera HashPack is a wallet for the Hedera network, available as a Chrome extension, which allows users to interact with decentralized applications (dApps). Your React app is using the Hashconnect library to facilitate this connection, enabling features like wallet pairing and transaction signing. The connection process involves several steps, including initialization, event registration, and pairing, which can be disrupted by timing issues or configuration errors.
From your description, the wallet connection popup opens, and the wallet recognizes the app connection, indicating that the initial detection (e.g., foundExtensionEvent) is working. However, the pairingEvent does not fire when selecting an account, and savedPairings remains empty, with console logs showing repeated foundExtensionEvent entries but no pairing confirmation.
Analysis of the Issue
The primary hypothesis, supported by community discussions and documentation, is that the issue stems from timing. Specifically, the openPairingModal function (or equivalent) might be called before the HashPack wallet extension has fully initialized. This can lead to the pairing process failing to complete, resulting in the pairingEvent not firing and savedPairings not being populated.
Your console logs indicate:

Hashconnect initialization, generation of a new encryption key, creation of a new topic, subscription, generation of a pairing string, saving local data, and finding local wallets.
No pairingEvent firing, with repeating foundExtensionEvent entries from the extension.

This pattern aligns with known issues where the extension is detected, but the pairing process does not proceed due to premature calls to pairing functions. A StackOverflow discussion highlighted a similar problem, where a "URI missing" error and an undefined pairing string ("Pairing string created: undefined testnet") were observed, suggesting that the pairing string generation failed due to timing.
Proposed Solution and Implementation
To address this, the following steps are recommended:

Introduce a Delay Before Opening the Pairing Modal:

The solution involves adding a delay before calling hashconnect.openPairingModal(). For example:
javascriptsetTimeout(() => {
  hashconnect.openPairingModal();
}, 500);

This delay (e.g., 500ms) allows the HashPack extension to complete its initialization, ensuring the pairing process can proceed. After implementing this, console logs showed successful pairing string creation and event firing, as evidenced by:

connectionStatusChangeEvent Connected
hashconnect - Pairing string created: wc:fakefake4ecefa271490d104213b9c607e1f8a519ce8967fdd776ab0ce5949b7@2?expiryTimestamp=1713162326&relay-protocol=irn&symKey=fakefakeda37cb5d79e1bfce30e1b04b3befe1c59e53c2dcf3879c67407fd31 testnet
pairingEvent {metadata: {…}, accountIds: Array(1), network: 'testnet'}




Ensure Event Registration Before Initialization:

Hashconnect documentation emphasizes registering events before calling init(), as some events (including pairingEvent) fire immediately after initialization. Example:
javascripthashconnect.pairingEvent.on((newPairing) => {
  console.log("Pairing event fired:", newPairing);
  // Handle pairing data here
});

This ensures that your app captures the pairing data when it is emitted.


Verify Secure Context:

HashPack requires a secure context (HTTPS) to interact with extensions. If running locally, use tools like http-server or ngrok to enable SSL. This is crucial for the extension to communicate with your app.


Check for Errors and Logs:

Monitor console logs for errors like "URI missing," which can indicate issues with the pairing string. Ensure your app's metadata (e.g., project ID, app name) is correctly configured when initializing Hashconnect.



Supporting Evidence and Resources
The solution is supported by:

Official Hashconnect documentation, which notes the importance of event registration timing: Hashconnect GitHub.
A StackOverflow thread discussing similar issues with openPairingModal(): StackOverflow: URI Missing Error.
Example implementations, such as the Hashconnect React example: Hashconnect React Example, which demonstrates proper setup and event handling.

Additionally, community support is available through the Hedera Developer Guild Discord: Hedera Developer Guild, where developers share insights and troubleshoot issues.
Detailed Steps for Implementation
To implement the solution in your React app, consider the following code structure:
javascriptimport React, { useEffect } from 'react';
import { HashConnect, LedgerId } from 'hashconnect';

const App = () => {
  useEffect(() => {
    const hashconnect = new HashConnect(LedgerId.TESTNET, "<Your Project ID>", {
      name: "Your App Name",
      description: "Your App Description",
      icons: ["https://yourapp.com/icon.png"],
      url: "https://yourapp.com",
    });

    // Register events before initializing
    hashconnect.pairingEvent.on((newPairing) => {
      console.log("Pairing event fired:", newPairing);
      // Handle pairing data here, e.g., update state with account IDs
    });

    // Initialize Hashconnect
    hashconnect.init();

    // Open pairing modal with a delay
    setTimeout(() => {
      hashconnect.openPairingModal();
    }, 500);
  }, []);

  return <div>Your App Content</div>;
};

export default App;
Ensure to replace <Your Project ID>, "Your App Name", and other placeholders with actual values.
Table: Summary of Key Actions and Expected Outcomes





























ActionExpected OutcomeRegister pairingEvent before init()Ensures the event listener captures pairing data when emitted.Add 500ms delay before openPairingModal()Allows HashPack extension to initialize, preventing "URI missing" errors.Check console for errorsIdentifies issues like undefined pairing strings, aiding in debugging.Use HTTPS or SSL locallyEnables extension communication, required for pairing to work.Refer to example codeProvides a working reference for integrating Hashconnect in React.
Conclusion
By addressing the timing issue with a delay and ensuring proper event registration, you should resolve the problem of pairingEvent not firing and savedPairings remaining empty. This approach is supported by community experiences and official documentation, ensuring a robust connection between your React app and the HashPack wallet. For further assistance, leverage the provided resources and community support channels.





example of connecting to a HashPack wallet via Hashconnect.
React example of connecting to a HashPack wallet via Hashconnect. - StarkTechLabs/hashconnect-example

github.com
Download HashPack | HashPack
Enjoy the leading Hedera wallet for dApps, DeFi and NFTs on Android and iOS. Install the HashPack Chrome extension on Chrome, Edge, Opera, Brave, and more!

hashpack.app
HashPack | Powering your web3 adventure
HashPack is your gateway to Hedera dApps, DeFi and NFTs. A crypto wallet built by the community, for the community. ... Available on iOS, Android, Chrome, and more! ... PACK staking is live! ... PACK token is the official utility token for HashPack, the leading wallet on Hedera Hashgraph. Now available on SaucerSwap, Gate.io, MEXC, and Ahora. ... HashPack has collaborated with the biggest community projects on Hedera to help you get started in the ecosystem. ... Minimise development time with the Hedera WalletConnect library. Interact securely with Hedera dApps and smart contracts. ... We're here to help you get started. HashPack is your gateway to web3. Create an account in under a minute and join the vibrant Hedera ecosystem. ... "We highly recommend HashPack for any organisation in need of a reliable, efficient, and best-in-class web3 wallet." ...

hashpack.app
r/Hedera on Reddit: HashPack chrome extension
Posted by u/Thistwinreddits - 4 votes and 9 comments

reddit.com
Hashpack - Chrome Web Store
An HBAR wallet

chromewebstore.google.com
r/Hedera on Reddit: Hashpack on chrome
Hedera is a decentralized, open-source, proof-of-stake public ledger that utilizes the leaderless, asynchronous Byzantine Fault Tolerance (aBFT) hashgraph consensus algorithm. It is governed by a diverse, decentralized council of leading enterprises, universities, and web3 projects from around the world. ... No problem here. Hashpack 8.6.4, Chrome 114 on MBP. ... They are phasing out the web browser based HashPack wallet, but not until the end of the year (target date is December 1st, 2023). The Chrome extension HashPack is unaffected by this and is and will be working normally. https://www.hashpack.app/post/device-specific-security-and-a-farewell-to-the-web-app ... I did hear about that. The problem is, when I go to the Stader website to connect my wallet, like I've been doing for about 1.5 years now, another chrome tab opens up mentioning something about Hashpack extension instead of Hashpack wallet popping up.

reddit.com
Hashpack - Chrome Web Store
An HBAR wallet

chromewebstore.google.com
Hashpack - Chrome Web Store
An HBAR wallet

chromewebstore.google.com
r/Hedera on Reddit: Importing HashPack Wallet to app
Hedera is a decentralized, open-source, proof-of-stake public ledger that utilizes the leaderless, asynchronous Byzantine Fault Tolerance (aBFT) hashgraph consensus algorithm. It is governed by a diverse, decentralized council of leading enterprises, universities, and web3 projects from around the world. ... Careful hbarbarians 🚨 There is a fake HashPack in Chrome extensions... Be sure to click “Report Concern” for this one to let Google know. ... Hedera is a decentralized, open-source, proof-of-stake public ledger that utilizes the leaderless, asynchronous Byzantine Fault Tolerance (aBFT) hashgraph consensus algorithm. It is governed by a diverse, decentralized council of leading enterprises, universities, and web3 projects from around the world. ... Hedera is a decentralized, open-source, proof-of-stake public ledger that utilizes the leaderless, asynchronous Byzantine Fault Tolerance (aBFT) hashgraph consensus algorithm.

reddit.com
HashPack: Hedera Crypto Wallet - Apps on Google Play
HashPack is excited to launch the Android public beta! We welcome your feedback and work to continually improve our products and services. HashPack supports an NFT gallery, peer-to-peer NFT trading, native HBAR staking, free account creation, multi-account support, address books, and HTS support. It has seamless Ledger integration and the ability to buy HBAR in-wallet using Banxa and MoonPay. You can also connect securely with your favourite Hedera dApps, using HashPack to approve transactions while keeping your private keys safe. Since its launch, HashPack has made waves in the community as the leading Hedera wallet for dApps and NFTs. HashPack approaches user experience as seriously as application security, new feature development, or community involvement. From vision to reality, HashPack is simple, secure, and stylish. ... Safety starts with understanding how developers collect and share your data.

play.google.com
HashPack: Hedera Crypto Wallet - Apps on Google Play
HashPack is excited to launch the Android public beta! We welcome your feedback and work to continually improve our products and services. HashPack supports an NFT gallery, peer-to-peer NFT trading, native HBAR staking, free account creation, multi-account support, address books, and HTS support. It has seamless Ledger integration and the ability to buy HBAR in-wallet using Banxa and MoonPay. You can also connect securely with your favourite Hedera dApps, using HashPack to approve transactions while keeping your private keys safe. Since its launch, HashPack has made waves in the community as the leading Hedera wallet for dApps and NFTs. HashPack approaches user experience as seriously as application security, new feature development, or community involvement. From vision to reality, HashPack is simple, secure, and stylish. ... Safety starts with understanding how developers collect and share your data.

play.google.com
HashPack Wallet Extension for Chrome and Firefox - Official Website
HashPack wallet users can swap tokens in wallets and take advantage of Hedera' lightning-fast performance and low fees. Token swapping is the main feature of DeFi, and the HashPack wallet allows you to exchange tokens in-wallet. Firstly, select the "Swap" window on your HashPack wallet, choose the "Token" you would want to swap from and select the Token you like to receive. Select the Token you want to "Swap From" in the dropdown and the Token you want to "Swap To" in the bottom dropdown. Enter the "Amount" you want to exchange, and the swapping technology will show you how much you will get in exchange. After that, the "Slippage" function of the wallet determines the maximum amount of price impact you are trying to take. Depending on the Token you choose, the slippage needs to be increased for the swap. Once you are happy with the exchange, tap the "Swap" button, and the "Confirmation Message" will pop up on your screen.

sites.google.com
Help & Support | HashPack
Yes! HashPack is available on our Android app, iOS app, browser-based app and Chrome extension. ... HashPack uses Banxa and MoonPay to allow you to directly purchase HBAR and USDC with your debit/credit card. Banxa and MoonPay are third party applications that handle fiat onramping for a small surcharge. HashPack receives a small 2% commission on each purchase. ... Before a token or NFT can be sent to an account, the token must be associated to the account. This can be done via the "Add Token" button on the Assets tab, or the "Associate NFT" button the NFTs tab. The Hedera Network charges a fee of $0.05USD for associating a token to an account. ... HashPack provides a gallery for all the NFTs present in an account. Note that NFTs may take a short while show up in the gallery after being transferred, due to refresh limits on Hedera Mirror nodes. While we have worked hard to support as many NFT formats as possible, some NFTs may still not show up.

hashpack.app
HashPack - DeFi Overview, TVL Analysis | DappRadar

dappradar.com
Download HashPack Wallet Extension for Chrome | HashPack Wallet

m--hashpackallet.teachable.com
GitHub - hedera-dev/tutorial-js-dapp-multi-wallet: Hedera DApp built with React, Material UI, and JavaScript, enabling seamless token transfers ...
Hedera DApp built with React, Material UI, and JavaScript, enabling seamless token transfers on the Hedera Testnet network. This DApp supports multiple wallet options, including HashPack, Blade, and MetaMask. - hedera-dev/tutorial-js-dapp-multi-wallet

github.com
HashPack Wallet Extension for Chrome and Firefox - Official Website
HashPack wallet users can swap tokens in wallets and take advantage of Hedera' lightning-fast performance and low fees. Token swapping is the main feature of DeFi, and the HashPack wallet allows you to exchange tokens in-wallet. Firstly, select the "Swap" window on your HashPack wallet, choose the "Token" you would want to swap from and select the Token you like to receive. Select the Token you want to "Swap From" in the dropdown and the Token you want to "Swap To" in the bottom dropdown. Enter the "Amount" you want to exchange, and the swapping technology will show you how much you will get in exchange. After that, the "Slippage" function of the wallet determines the maximum amount of price impact you are trying to take. Depending on the Token you choose, the slippage needs to be increased for the swap. Once you are happy with the exchange, tap the "Swap" button, and the "Confirmation Message" will pop up on your screen.

sites.google.com
Connect with HashPack wallet extension (including HBAR native staking) | D'CENT User Guide
Get to know more about HBAR Staking via the official article: https://docs.hedera.com/hedera/core-concepts/staking/staking · 1. Let’s open the HashPack app. As you can see, there is a Stake tab. Click on it, then “Stake you HBAR” · 2. You will be able to choose the node you would like to stake in or just go with the default proposal. We are not recommending one option over the other to you. It is a personal choice. Once selected, make sure to understand and agree with the information displayed then confirm by clicking on Stake. 3. Details are shown on your wallet for final approval. Click on “OK” then you will be able to authenticate yourself via your fingerprint. 4. Transaction is complete, click on done on HashPack extension. 5. On the Stake tab you can now see your staked assets. You can also have some more data about the reward history, which was our case as we had already stake some token on this node before.

userguide.dcentwallet.com
Developers | HashPack
Hedera WalletConnect allows you to interact securely with Hedera dApps and smart contracts, using HashPack to approve transactions while keeping your private keys secure. ... Simple integration instructions, functional demo, and FAQ for common issues. ... Reach a larger audience with our dApp store. Increase user engagement with social profiles. ... Connect your app with HashPack using our seamless integration with Hedera WalletConnect. ... Supports dApps and protocols that scale with Solidity Smart Contracts on Hedera. At HashPack, we’re dedicated to developing products and services which reduce friction and spark adoption of the Hedera network by developers. Integrate web3 wallet connection into your dApp with Hedera WalletConnect's suite for mobile and web developers. Are you building dApps on Hedera? Join our active developer community on Discord.

hashpack.app
r/Hedera on Reddit: "Which device/browser extension would you like to see HashPack support next?" - Hashpack Wallet on Twitter
Posted by u/Rich_Transition5070 - 11 votes and 12 comments

reddit.com
GitHub - Hashpack/hashconnect: Hashconnect library, readme in progress
Make sure you register your events before calling init - as some events will fire immediately after calling init. Pass the accountId of a paired account to get a signer back, this allows you to interact with HashConnect using a simpler API. signer = hashconnect.getSigner(AccountId.fromString('0.0.12345')); const signer = hashconnect.getSigner(fromAccount); let trans = await new TransferTransaction() .addHbarTransfer(fromAccount, -1) .addHbarTransfer(toAccount, 1) .freezeWithSigner(signer); let response = await trans.executeWithSigner(signer); Events are emitted by HashConnect to let you know when a request has been fufilled. The pairing event is triggered when a user accepts a pairing or an existing pairing is found. hashconnect.pairingEvent.on((pairingData) => { //do something }) When a user disconnects this event will be triggered so you can update the state of your dapp.

github.com
hashconnect/README.md at 5e5909c7610e759a6b52bc790fc306aac3fb7322 · Hashpack/hashconnect
hashconnect.foundExtensionEvent.once((walletMetadata) => { //do something with metadata }) If the app is embedded inside of HashPack it will fire this event. After this event is fired, it will automatically ask the user to pair and then fire a normal pairingEvent (below) with the same data a normal pairing event would fire. The pairing event is triggered when a user accepts a pairing. You can access the currently connected pairings from hashconnect.hcData.savedPairings. hashconnect.pairingEvent.once((pairingData) => { //do something }) This event returns an Acknowledge object. This happens after the wallet has recieved the request, generally you should consider a wallet disconnected if a request doesn't fire an acknowledgement after a few seconds and update the UI accordingly. The object contains the ID of the message. hashconnect.acknowledgeMessageEvent.once((acknowledgeData) => { //do something with acknowledge response data }) This event is fired if the connection status changes, this should only really happen if the server goes down.

github.com
hashconnect · GitHub Topics · GitHub
Add a description, image, and links to the hashconnect topic page so that developers can more easily learn about it. ... To associate your repository with the hashconnect topic, visit your repo's landing page and select "manage topics." ...

github.com
hashconnect - npm
Make sure you register your events before calling init - as some events will fire immediately after calling init. Pass the accountId of a paired account to get a signer back, this allows you to interact with HashConnect using a simpler API. signer = hashconnect.getSigner(AccountId.fromString('0.0.12345')); const signer = hashconnect.getSigner(fromAccount); let trans = await new TransferTransaction() .addHbarTransfer(fromAccount, -1) .addHbarTransfer(toAccount, 1) .freezeWithSigner(signer); let response = await trans.executeWithSigner(signer); Events are emitted by HashConnect to let you know when a request has been fufilled. The pairing event is triggered when a user accepts a pairing or an existing pairing is found. hashconnect.pairingEvent.on((pairingData) => { //do something }) When a user disconnects this event will be triggered so you can update the state of your dapp.

npmjs.com
hashconnect/README.md at main · Hashpack/hashconnect
Make sure you register your events before calling init - as some events will fire immediately after calling init. Pass the accountId of a paired account to get a signer back, this allows you to interact with HashConnect using a simpler API. signer = hashconnect.getSigner(AccountId.fromString('0.0.12345')); const signer = hashconnect.getSigner(fromAccount); let trans = await new TransferTransaction() .addHbarTransfer(fromAccount, -1) .addHbarTransfer(toAccount, 1) .freezeWithSigner(signer); let response = await trans.executeWithSigner(signer); Events are emitted by HashConnect to let you know when a request has been fufilled. The pairing event is triggered when a user accepts a pairing or an existing pairing is found. hashconnect.pairingEvent.on((pairingData) => { //do something }) When a user disconnects this event will be triggered so you can update the state of your dapp.

github.com
Hashpack/hashconnect

github.com
What causes "URI missing" error in hashconnect, when invoking `hashconnect.openPairingModal()`?
Attempting to connect my DApp to Hashpack, using hashconnect, however, the pairing never seems to trigger. When I call the connectWallet function in wallet-hashpack.js, I expect this to happen, but instead I get some console output indicating something awry (copied below) ... The log message Pairing string created: undefined testnet seems to be off - what should the undefined be here? Then the error for URI Missing happens. What URI is this referring to?

stackoverflow.com
Token transaction do not return any event · Issue #33 · Hashpack/hashconnect
Using React, i'm trying to execute a token transfert using Hedera Token Service. When i send the transaction to HashConnect the wallet prompts me to approve the transaction, but after that nothing happens. Here's my code: `export async function buyRTTToken(token, trsuaryAccountId,reciverAccountId) { const client = hederaClient(); let transaction : TransferTransaction = await new TransferTransaction(); transaction.addTokenTransfer(token.tokenId, trsuaryAccountId, -10); transaction.addTokenTransfer(token.tokenId, reciverAccountId, 10); transaction.freezeWith(client); await sendTransaction(transaction, reciverAccountId); ...

github.com
hashconnect - npm
hashconnect.foundExtensionEvent.once((walletMetadata) => { //do something with metadata }) If the app is embedded inside of HashPack it will fire this event. After this event is fired, it will automatically ask the user to pair and then fire a normal pairingEvent (below) with the same data a normal pairing event would fire. The pairing event is triggered when a user accepts a pairing. You can access the currently connected pairings from hashconnect.hcData.savedPairings. hashconnect.pairingEvent.once((pairingData) => { //do something }) This event returns an Acknowledge object. This happens after the wallet has recieved the request, generally you should consider a wallet disconnected if a request doesn't fire an acknowledgement after a few seconds and update the UI accordingly. The object contains the ID of the message. hashconnect.acknowledgeMessageEvent.once((acknowledgeData) => { //do something with acknowledge response data }) This event is fired if the connection status changes, this should only really happen if the server goes down.

npmjs.com
hashconnect - npm
Make sure you register your events before calling init - as some events will fire immediately after calling init. Pass the accountId of a paired account to get a signer back, this allows you to interact with HashConnect using a simpler API. signer = hashconnect.getSigner(AccountId.fromString('0.0.12345')); const signer = hashconnect.getSigner(fromAccount); let trans = await new TransferTransaction() .addHbarTransfer(fromAccount, -1) .addHbarTransfer(toAccount, 1) .freezeWithSigner(signer); let response = await trans.executeWithSigner(signer); Events are emitted by HashConnect to let you know when a request has been fufilled. The pairing event is triggered when a user accepts a pairing or an existing pairing is found. hashconnect.pairingEvent.on((pairingData) => { //do something }) When a user disconnects this event will be triggered so you can update the state of your dapp.

npmjs.com
hashconnect - npm
hashconnect.foundExtensionEvent.once((walletMetadata) => { //do something with metadata }) If the app is embedded inside of HashPack it will fire this event. After this event is fired, it will automatically ask the user to pair and then fire a normal pairingEvent (below) with the same data a normal pairing event would fire. The pairing event is triggered when a user accepts a pairing. You can access the currently connected pairings from hashconnect.hcData.savedPairings. hashconnect.pairingEvent.once((pairingData) => { //do something }) This event returns an Acknowledge object. This happens after the wallet has recieved the request, generally you should consider a wallet disconnected if a request doesn't fire an acknowledgement after a few seconds and update the UI accordingly. The object contains the ID of the message. hashconnect.acknowledgeMessageEvent.once((acknowledgeData) => { //do something with acknowledge response data }) This event is fired if the connection status changes, this should only really happen if the server goes down.

npmjs.com
Hashconnect — Corefy Developer Docs
Also, select Test or Live mode according to the type of account to connect with Hashconnect. ... You have connected Hashconnect account! Press Connect at Hashconnect Provider Overview page in 'New connection' and choose H2H Merchant account option to open Connection form. Enter Site ID (siteId) and upload your private_key.pem key file as the Private Key. Also, select Test or Live mode according to the type of account to connect with Hashconnect. Choose Currencies and Features. You can set these parameters according to available currencies and features for your Hashconnect account, but it's necessary to verify details of the connection with your Corefy account manager. ... You have connected Hashconnect H2H merchant account! Still looking for help connecting your Hashconnect account?

corefy.com
Assistance with `HashConnect.connectToLocalWallet` · Issue #73 · Hashpack/hashconnect

github.com
changelogs.md · hashpack/hashconnect release history
Fixed issue initializing with legacy hashconnect data ... Automatically retry connection to websocket when the connection is severed - for example when the server reboots · Added connectionStatusChange event, fires a connected/disconnected event when the server connection changes ·

changelogs.md
HashConnect Part 1 - Secure Signing for dApps Built on Hedera | Hedera
HashConnect is an open source library that is developed by the HashPack team. This library enables decentralized applications (dApps) to connect to a user’s wallet and send transactions for them to sign and submit to the Hedera network nodes. HashConnect solves the question of how to enable a user to sign transactions without exposing their private key. An application never has access to the user’s private keys, giving the user peace of mind that their account keys won’t be exposed when they connect to dApps in the Hedera ecosystem. HashConnect is currently under active development and is available in open beta. There are numerous projects which have already integrated HashConnect into their workflow, providing users with a great user experience. Integrators include Staderlabs, Saucer Swap, Zuse Marketplace, Turtle Moon Tools, with many more on the way.

hedera.com
GitHub - DaVinciGraph/hashconnect-provider: a ReactJs context to easily use hashconnect to connect to Hashpack wallet.
This package provides a react context for connecting to HashConnect easily.

github.com
hashconnect - npm Package Security Analysis - Socket
Make sure you register your events before calling init - as some events will fire immediately after calling init. Pass the accountId of a paired account to get a signer back, this allows you to interact with HashConnect using a simpler API. signer = hashconnect.getSigner(AccountId.fromString('0.0.12345')); const signer = hashconnect.getSigner(fromAccount); let trans = await new TransferTransaction() .addHbarTransfer(fromAccount, -1) .addHbarTransfer(toAccount, 1) .freezeWithSigner(signer); let response = await trans.executeWithSigner(signer); Events are emitted by HashConnect to let you know when a request has been fufilled. The pairing event is triggered when a user accepts a pairing or an existing pairing is found. hashconnect.pairingEvent.on((pairingData) => { //do something }) When a user disconnects this event will be triggered so you can update the state of your dapp.

socket.dev
Activity · Hashpack/hashconnect

github.com
hashconnect - npm
This event returns the metadata of the found extensions, will fire once for each extension. hashconnect.foundExtensionEvent.once((walletMetadata) => { //do something with metadata }) The pairing event is triggered when a user accepts a pairing. It returns an ApprovePairing object containing accountId's and a WalletMetadata. hashconnect.pairingEvent.once((pairingData) => { //example pairingData.accountIds.forEach(id => { if(pairedAccounts.indexOf(id) == -1) pairedAccounts.push(id); }) }) hashconnect.transactionResponseEvent.once((transactionResponse) => { //do something with transaction response data }) This event returns an Acknowledge object. This happens after the wallet has recieved the request, generally you should consider a wallet disconnected if a request doesn't fire an acknowledgement after a few seconds and update the UI accordingly. The object contains the ID of the message.

npmjs.com
Deep Search: Browsed URLs
https://github.com/StarkTechLabs/hashconnect-example

github.com
https://github.com/Hashpack/hashconnect

github.com
https://github.com/Hashpack/hashconnect/tree/main/example/react-dapp

github.com
https://stackoverflow.com/questions/78314795/what-causes-uri-missing-error-in-hashconnect-when-invoking-hashconnect-openp

stackoverflow.com
https://docs.hashpack.app/dapp-developers/hashconnect

docs.hashpack.app
https://github.com/StarkTechLabs/hashconnect-example

github.com
https://github.com/Hashpack/hashconnect

github.com
https://github.com/Hashpack/hashconnect/tree/main/example/react-dapp

github.com
https://stackoverflow.com/questions/78314795/what-causes-uri-missing-error-in-hashconnect-when-invoking-hashconnect-openp

stackoverflow.com
https://docs.hashpack.app/dapp-developers/hashconnect

docs.hashpack.app
https://github.com/StarkTechLabs/hashconnect-example

github.com
https://github.com/Hashpack/hashconnect

github.com
https://github.com/Hashpack/hashconnect/tree/main/example/react-dapp

github.com
https://stackoverflow.com/questions/78314795/what-causes-uri-missing-error-in-hashconnect-when-invoking-hashconnect-openp

stackoverflow.com
https://docs.hashpack.app/dapp-developers/hashconnect

docs.hashpack.app