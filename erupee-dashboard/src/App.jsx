import React from 'react';
import WalletConnect from './components/WalletConnect';
import MintLockForm from './components/MintLockForm';

export default function App(){
  return (
    <div style={{padding:20,fontFamily:'Arial'}}>
      <h1>eRupee Dashboard</h1>
      <WalletConnect />
      <hr />
      <MintLockForm />
    </div>
  );
}
