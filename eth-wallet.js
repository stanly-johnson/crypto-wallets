var Web3 = require('web3');
var Tx = require('ethereumjs-tx');
import hdkey from 'ethereumjs-wallet/hdkey';
/**
 * The function will generate an HD wallet with 24 seed words
 * @param {String} mnemonic
 * @param {String} index
 * 
 * @returns
 *  {
 *  privateKey,
 *  publicKey,
 *  address,
 *  seed
 *  }
 */
export function generateEthHdWallet(mnemonic, index = '0'){
    // use menmonics if given else generate randomly
    const mnemonics = mnemonic ? mnemonic : generateRandomMnemonic();
    let hdWallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonics));
    // Use bip44 standard for derivation path.
    let path = `m/44'/60'/0'/0/${index}`;
    let wallet = hdWallet.derivePath(path).getWallet();
    const pubKey = ethUtil.privateToPublic(wallet._privKey);
    const addr = ethUtil.publicToAddress(pubKey).toString('hex');

    const wallet_obj = {
      privateKey: wallet._privKey.toString('hex'),
      publicKey: pubKey.toString('hex'),
      address: '0x' + addr,
      seed: mnemonics
    };
    return wallet_obj;

}


export function generateRandomMnemonic() {
    return bip39.generateMnemonic(256);
  }

/**
 * Function to fetch the ETH balance of an account
 * @param {String} account_address 
 * 
 * @returns 
 *  final balance in ETH
 */
export async function getEthBalance(account_address){
    //Fetch the ETH balance of the address
    account_address = web3.utils.toHex(account_address);
    try {
      const wei_balance = await web3.eth.getBalance(account_address);
      const final_balance = web3.utils.fromWei(wei_balance, 'ether');
      return `${final_balance}`;
    } catch (error) {
      console.log(error);
      return 'cannot compute';
    }
}