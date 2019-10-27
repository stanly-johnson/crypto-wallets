const isMainnet = false; // false for testnet, true for mainnet
import StellarHDWallet from 'stellar-hd-wallet';
import bip39 from 'bip39';
var StellarSdk = require('stellar-sdk');
XLM_SERVER = isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'; 

/**
 * The function will generate a new XLM wallet as per the standard derivation format and return to calling component.
 * If a mnemonic is passed, then the given mnemonic will be used, else a new mnemonic will be randomly generated with default strength
 * of 256 (24 word seedwords)
 *
 * Note : the testnet account can be funded from https://www.stellar.org/laboratory/#account-creator?network=test
 *
 * @param {String} mnemonic (Optional)
 * @returns {Obj} wallet_obj
 */
export function generateXlmWallet(mnemonic = false) {
  console.log('XLM wallet gen');
  // Create an instance of bip32 wallet with bip39 mnemonics
  // default is 256 strength -> 24 word seed
  const mnemonics = mnemonic ? mnemonic : generateRandomMnemonic();
  // create wallet from mnemonic
  const wallet = StellarHDWallet.fromMnemonic(mnemonics);
  // => GDKYMXOAJ5MK4EVIHHNWRGAAOUZMNZYAETMHFCD6JCVBPZ77TUAZFPKT
  // => SCVVKNLBHOWBNJYHD3CNROOA2P3K35I5GNTYUHLLMUHMHWQYNEI7LVED
  //wallet.getKeypair(0); // => StellarBase.Keypair for account 0
  //wallet.derive(`m/44'/148'/0'`); // => raw key for account 0 as a Buffer

  // create wallet obj to return to component
  const wallet_obj = {
    privateKey: wallet.getSecret(0),
    publicKey: wallet.getPublicKey(0),
    address: wallet.getPublicKey(0),
    seed: mnemonics
  };
  console.log(wallet_obj);

  return wallet_obj;
}

/**
 * Generate a random mnemonic with default strength of 256
 */
function generateRandomMnemonic() {
  return bip39.generateMnemonic(256);
}

/**
 * The function will connect to the horizon server and fetch the balance of the account
 * @param {String} account_address
 */
export function getXlmBalance(account_address) {
  // init horizon server connection
  var server = new StellarSdk.Server(XLM_SERVER);
  // fetch the account balance from horizon server
  return server
    .accounts()
    .accountId(account_address)
    .call()
    .then(function(accountResult) {
      console.log(accountResult);
      console.log(accountResult.balances[0].balance);
      // return the balance of the native asset (XLM)
      return accountResult.balances[0].balance;
    })
    .catch(function(err) {
      // the horizon api usually throws an error for new accounts with no txn history
      // display the error and then return 0 to component
      console.error(err);
      return '0';
    });
}

/**
 * The function will take the following params from the component and execute the XLM transaction
 * @param {String} recipentAddress
 * @param {String} amount_to_transfer
 * @param {String} publicKey
 * @param {String} privateKey
 *
 * Returns :
 *  {String} tx_hash
 */
export async function sendXlmTransaction(recipentAddress, amount_to_transfer, publicKey, privateKey) {
  return new Promise(async (resolve, reject) => {
    // init horizon server connection
    var server = new StellarSdk.Server(XLM_SERVER);
    // fetch account info
    const account = await server.loadAccount(publicKey);
    // get fee estimate
    const fee = await server.fetchBaseFee();
    // assign XLM network
    const XLM_NETWORK = isMainnet ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET;
    // build transaction
    const transaction = new StellarSdk.TransactionBuilder(account, { fee, networkPassphrase: XLM_NETWORK })
      .addOperation(
        // this operation send the amount to recipent account
        StellarSdk.Operation.payment({
          destination: recipentAddress,
          asset: StellarSdk.Asset.native(),
          amount: amount_to_transfer
        })
      )
      .setTimeout(30)
      .build();

    // sign the transaction
    transaction.sign(StellarSdk.Keypair.fromSecret(privateKey));

    try {
      const transactionResult = await server.submitTransaction(transaction);
      console.log(transactionResult);
      // expected response format
      //{_links: {transaction: {href: "https://horizon-testnet.stellar.org/transactions/0…023e777751d73ebbda102cfe7c1ea1047654bd53a1f3874e9"}}, hash: "0b7b0eaa384632c023e777751d73ebbda102cfe7c1ea1047654bd53a1f3874e9", ledger: 1233198, envelope_xdr: "AAAAAGiEMeV3+groppYd1XQ0Zs8dKjS5nP269GtQZJEQ3xPmAA…X4ujYa9aAl53pnfQ2Ss+L8sBpMYmQUy1rqyRlhPUcry0RCwg=", result_xdr: "AAAAAAAAAGQAAAAAAAAAAQAAAAAAAAABAAAAAAAAAAA=", …}
      console.log(transactionResult._links.transaction.href);
      resolve(transactionResult._links.transaction.href);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

/**
 * The function will take the following params from the component and execute the XLM transaction
 * @param {String} recipentAddress
 * @param {String} amount_to_transfer
 * @param {String} mnemonic_of_sender_account
 *
 * Returns :
 *  {String} tx_hash
 */
export function sendXlmTransactionWithMnemonic(recipentAddress, amount_to_transfer, mnemonic_of_sender_account){
  // create wallet from mnemonic
  const wallet = StellarHDWallet.fromMnemonic(mnemonic_of_sender_account);
  // get keypair
  const publicKey = wallet.getPublicKey(0);
  const privateKey = wallet.getSecret(0);

  return sendXlmTransaction(recipentAddress, amount_to_transfer, publicKey, privateKey)
}