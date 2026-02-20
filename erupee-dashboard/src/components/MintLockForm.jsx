import React, {useState} from 'react';

export default function MintLockForm(){
  const [mintTo,setMintTo] = useState('');
  const [mintAmount,setMintAmount] = useState('0');
  const [lockUser,setLockUser] = useState('');
  const [lockAmount,setLockAmount] = useState('0');
  const [unlockTime,setUnlockTime] = useState('');
  const [docFile,setDocFile] = useState(null);

  async function onMint(e){
    e.preventDefault();
    const res = await fetch('/mint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:mintTo,amount:mintAmount})});
    const j = await res.json();
    alert(JSON.stringify(j));
  }

  async function onLock(e){
    e.preventDefault();
    let cid = null;
    if (docFile) {
      const fd = new FormData();
      fd.append('file', docFile);
      const r = await fetch('/upload', { method: 'POST', body: fd });
      const jr = await r.json();
      cid = jr.cid;
    }
    const body = { user: lockUser, amount: lockAmount, unlockTime: unlockTime };
    if (cid) body.documentCID = cid;
    const res = await fetch('/lock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j = await res.json();
    alert(JSON.stringify(j));
  }

  return (
    <div>
      <h3>Mint</h3>
      <form onSubmit={onMint}>
        <input placeholder="to" value={mintTo} onChange={e=>setMintTo(e.target.value)} />
        <input placeholder="amount" value={mintAmount} onChange={e=>setMintAmount(e.target.value)} />
        <button type="submit">Mint</button>
      </form>

      <h3>Lock (with optional document)</h3>
      <form onSubmit={onLock}>
        <input placeholder="user" value={lockUser} onChange={e=>setLockUser(e.target.value)} />
        <input placeholder="amount" value={lockAmount} onChange={e=>setLockAmount(e.target.value)} />
        <input placeholder="unlockTime (unix)" value={unlockTime} onChange={e=>setUnlockTime(e.target.value)} />
        <input type="file" onChange={e=>setDocFile(e.target.files[0])} />
        <button type="submit">Lock</button>
      </form>
    </div>
  );
}
