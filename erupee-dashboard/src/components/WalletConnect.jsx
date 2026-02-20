import React, {useState} from 'react';
import { ethers } from 'ethers';

export default function WalletConnect(){
  const [address,setAddress] = useState('');

  async function connect(){
    if (!window.ethereum) return alert('Install MetaMask');
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAddress(addr);
  }

  return (
    <div>
      <button onClick={connect}>Connect MetaMask</button>
      {address && <div>Connected: {address}</div>}
    </div>
  );
}
