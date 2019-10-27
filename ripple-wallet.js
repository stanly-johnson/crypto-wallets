
/**
 * The function to create and broadcast a transaction to the XRP network
 * @param {String} senderAddress
 * @param {String} recipentAddress
 * @param {String} amount_to_transfer
 * @param {String} account_mnemonic
 * @param {String} txnFee
 *
 * Note : To fund a newly created account, get a new account from https://xrpl.org/xrp-testnet-faucet.html and replace the fields Account and signing with
 * the testnet account received
 */
export async function sendXrpTransaction(senderAddress, recipentAddress, amount_to_transfer, account_mnemonic, txnFee) {
    try {
      //initialise and connect to ripple server
      const xrp = new RippleAPI({ server: RIPPLE_SERVER_URL });
      await xrp.connect();
      // fetch the account info related to the sending account
      const accountInfo = await xrp.getAccountInfo(senderAddress);
      // generate the keypair from the mnemonic provided
      const keypair = getXRPKeypairFromSeedWords(account_mnemonic);
      // setup the transaction as per https://xrpl.org/rippleapi-reference.html#preparetransaction
      var transaction = {
        TransactionType: 'Payment',
        Account: senderAddress,
        Fee: '300',
        Destination: recipentAddress,
        Amount: xrp.xrpToDrops(parseInt(amount_to_transfer)),
        Sequence: accountInfo.sequence
      };
      // prepare transaction to format https://xrpl.org/rippleapi-reference.html#preparetransaction
      const preparedTx = await xrp.prepareTransaction(transaction);
      const txJSON = preparedTx.txJSON;
      console.log(txJSON);
  
      // sign using the keypair option https://xrpl.org/rippleapi-reference.html#sign
      const accountKeyPair = { privateKey: keypair.privateKey, publicKey: keypair.publicKey };
      const signedTx = xrp.sign(txJSON, accountKeyPair);
      // submit signed txn to ripple network https://xrpl.org/rippleapi-reference.html#submit
      const result = await xrp.submit(signedTx.signedTransaction);
      const transactionHash = result.tx_json.hash;
      console.log(result, transactionHash);
      // close session with xrp server
      await xrp.disconnect();
      // return txn hash to component
      return transactionHash;
    } catch (error) {
      console.log(error);
      console.log('Error in send XRP transaction');
      throw error;
    }
  }
  
  function getXRPKeypairFromSeedWords(seedWords) {
    const seed = keypairs.generateSeed({ entropy: bip39.mnemonicToSeed(seedWords) });
    // generate the keypairs from the seed
    const keypair = keypairs.deriveKeypair(seed, {
      derivedPath: `m/44/144/0''0/0` //use standard derivation path
    });
    return {
      privateKey: keypair.privateKey,
      publicKey: keypair.publicKey
    };
  }

/**
 * The function will create an XRP HD wallet
 */
export function generateXrpWallet(){
    //Generate an XRP wallet
    console.log('XRP wallet gen');
    // create seed word with entropy 256 seed word
    const seed = keypairs.generateSeed({ entropy: bip39.mnemonicToSeed(mnemonics) });
    // generate the keypairs from the seed
    const keypair = keypairs.deriveKeypair(seed, {
    derivedPath: `m/44/144/0''0/0` //use standard derivation path
    });
    const address = keypairs.deriveAddress(keypair.publicKey);

    const wallet_obj = {
    privateKey: keypair.privateKey,
    publicKey: keypair.publicKey,
    address: address,
    seed: mnemonics
    };

    return wallet_obj;             
}

/**
 * Function to fetch the ripple account balance of an address
 * @param {String} account_address 
 * 
 * @returns
 *  {String} balance of all assets in account
 */
export function getXrpBalanceOfAddress(account_address){
  //Fetch the XRP balance of the address
  try {
    const xrp = new RippleAPI({ server: RIPPLE_SERVER_URL });
    await xrp.connect();
    const xrpBalance = await xrp.getBalances(account_address);
    let xrpBalanceString = '';
    for (let x in xrpBalance) {
      console.log(xrpBalance[x]);
      xrpBalanceString = xrpBalanceString + ' ' + xrpBalance[x]['currency'] + ' ' + xrpBalance[x]['value'] + ' ';
    }
    console.log(xrpBalanceString);
    return xrpBalanceString;
  } catch (error) {
    return 'failed to fetch data | is account initialised?';
  }
}