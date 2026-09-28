import React, {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Heart, Bookmark, Share2, History, Settings, Shield, Search, ChevronLeft, X, Plus, Trash2, Ban, ExternalLink, RefreshCw, Play, Youtube} from 'lucide-react';
import './styles.css';

const CATEGORIES = ['All','Study','Discipline','Success','Money','Mindset','Confidence'];
const QUERIES = {
  Study:'study motivation shorts student exam focus', Discipline:'discipline motivation shorts consistency no excuses', Success:'success motivation shorts goals ambition', Money:'money motivation shorts business wealth mindset', Mindset:'mindset motivation shorts self improvement', Confidence:'confidence motivation shorts self belief'
};
const KEY='mindfuel_v1';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{saved:[],history:[],hidden:[],channels:[],apiKey:'',category:'All',theme:'dark'}}catch{return {saved:[],history:[],hidden:[],channels:[],apiKey:'',category:'All',theme:'dark'}}};
function saveState(s){localStorage.setItem(KEY,JSON.stringify(s));}

async function yt(url, params){const u=new URL(url); Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v)); const r=await fetch(u); const j=await r.json(); if(!r.ok||j.error) throw new Error(j.error?.message||'YouTube API error'); return j;}
async function resolveChannel(apiKey,input){
  if(!input) throw new Error('Enter a channel URL, @handle, or channel ID.');
  if(input.includes('/channel/')) return input.split('/channel/')[1].split(/[/?#]/)[0];
  const handle=(input.match(/@([\w.-]+)/)||[])[1] || (input.startsWith('@')?input.slice(1):null);
  if(handle){const j=await yt('https://www.googleapis.com/youtube/v3/channels',{part:'id,snippet',forHandle:handle,key:apiKey}); if(j.items?.[0]) return j.items[0].id;}
  const j=await yt('https://www.googleapis.com/youtube/v3/search',{part:'snippet',q:input.replace(/^https?:\/\/.*youtube\.com\//,''),type:'channel',maxResults:1,key:apiKey});
  if(j.items?.[0]) return j.items[0].snippet.channelId; throw new Error('Channel not found.');
}
async function fetchVideos(apiKey, category, channels){
  const results=[];
  const add=async (j, source)=>{
    const ids=(j.items||[]).map(x=>x.id?.videoId||x.id).filter(Boolean); if(!ids.length)return;
    const d=await yt('https://www.googleapis.com/youtube/v3/videos',{part:'snippet,contentDetails',id:ids.join(','),key:apiKey});
    for(const v of d.items||[]){const dur=v.contentDetails?.duration||''; if(!/^PT/.test(dur))continue; const sec=isoSeconds(dur); if(sec<=180) results.push({id:v.id,title:v.snippet.title,channel:v.snippet.channelTitle,thumb:v.snippet.thumbnails?.high?.url||v.snippet.thumbnails?.medium?.url,category:category==='All'?'Mindset':category,source});}
  };
  const cats=category==='All'?CATEGORIES.slice(1):[category];
  for(const c of cats.slice(0,2)){const j=await yt('https://www.googleapis.com/youtube/v3/search',{part:'snippet',q:QUERIES[c],type:'video',videoDuration:'short',maxResults:12,order:'relevance',key:apiKey}); await add(j,'search');}
  for(const c of channels.slice(0,8)){const j=await yt('https://www.googleapis.com/youtube/v3/search',{part:'snippet',channelId:c.id,type:'video',videoDuration:'short',order:'date',maxResults:8,key:apiKey}); await add(j,'channel');}
  return results;
}
function isoSeconds(s){const m=s.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);return (+(m?.[1]||0))*3600+(+(m?.[2]||0))*60+(+(m?.[3]||0));}

function App(){
 const [s,setS]=useState(load); const [feed,setFeed]=useState([]); const [loading,setLoading]=useState(false); const [err,setErr]=useState(''); const [tab,setTab]=useState('feed'); const [admin,setAdmin]=useState(false); const [channelInput,setChannelInput]=useState(''); const [search,setSearch]=useState(''); const feedRef=useRef();
 const update=(patch)=>setS(prev=>{const n={...prev,...patch};saveState(n);return n});
 const refresh=async()=>{if(!s.apiKey){setErr('Add your YouTube Data API key in Settings first.');setTab('settings');return} setLoading(true);setErr('');try{const v=await fetchVideos(s.apiKey,s.category,s.channels); const hidden=new Set(s.hidden); const seen=new Set(); const clean=v.filter(x=>!hidden.has(x.id)&&!seen.has(x.id)&&seen.add(x.id)).sort(()=>Math.random()-.5);setFeed(clean);setTimeout(()=>feedRef.current?.scrollTo(0,0),0);}catch(e){setErr(e.message)}finally{setLoading(false)}};
 useEffect(()=>{if(s.apiKey&&tab==='feed'&&!feed.length)refresh()},[s.apiKey,s.category]);
 const visible=useMemo(()=>feed.filter(v=>!search||v.title.toLowerCase().includes(search.toLowerCase())||v.channel.toLowerCase().includes(search.toLowerCase())),[feed,search]);
 const isSaved=id=>s.saved.includes(id);
 const toggleSaved=id=>update({saved:isSaved(id)?s.saved.filter(x=>x!==id):[id,...s.saved]});
 const hide=id=>{update({hidden:[id,...s.hidden]});setFeed(f=>f.filter(x=>x.id!==id))};
 const addHistory=id=>{if(!s.history.includes(id))update({history:[id,...s.history].slice(0,100)})};
 const share=async(v)=>{const url=`https://www.youtube.com/shorts/${v.id}`;try{await navigator.clipboard.writeText(url);alert('Short link copied.')}catch{window.open(url,'_blank')}};
 const addChannel=async()=>{try{if(!s.apiKey)throw new Error('Add API key first.');const id=await resolveChannel(s.apiKey,channelInput); if(s.channels.some(x=>x.id===id)){throw new Error('Channel already added.')} const j=await yt('https://www.googleapis.com/youtube/v3/channels',{part:'snippet',id,key:s.apiKey});const c=j.items?.[0]; if(!c)throw new Error('Channel not found.'); update({channels:[...s.channels,{id,name:c.snippet.title}]});setChannelInput('');}catch(e){alert(e.message)}};
 return <div className="app">
  <header className="top"><div className="brand"><span className="brandMark">M</span><div><b>MindFuel</b><small>motivation without distraction</small></div></div><div className="topActions"><button onClick={()=>setTab('search')}><Search/></button><button onClick={refresh} disabled={loading}><RefreshCw className={loading?'spin':''}/></button><button onClick={()=>setTab('settings')}><Settings/></button></div></header>
  {tab==='feed'&&<>
   <div className="chips">{CATEGORIES.map(c=><button className={s.category===c?'chip active':'chip'} onClick={()=>{update({category:c});setFeed([])}} key={c}>{c}</button>)}</div>
   {err&&<div className="notice">{err}</div>}
   <main className="feed" ref={feedRef}>{loading&&!feed.length?<div className="empty"><div className="loader"></div><p>Fueling your feed…</p></div>:visible.length?visible.map(v=><Reel key={v.id} v={v} saved={isSaved(v.id)} onSave={()=>toggleSaved(v.id)} onShare={()=>share(v)} onHide={()=>hide(v.id)} onOpen={()=>{addHistory(v.id);window.open(`https://www.youtube.com/shorts/${v.id}`,'_blank')}}/>):<div className="empty"><Play/><h2>No Shorts yet</h2><p>Add your API key and refresh, or add approved channels in Admin.</p></div>}</main>
  </>}
  {tab==='search'&&<SearchPanel search={search} setSearch={setSearch} feed={feed} onOpen={v=>{addHistory(v.id);window.open(`https://www.youtube.com/shorts/${v.id}`,'_blank')}} onBack={()=>setTab('feed')}/>} 
  {tab==='saved'&&<ListPanel title="Saved" ids={s.saved} feed={feed} onOpen={v=>window.open(`https://www.youtube.com/shorts/${v.id}`,'_blank')} empty="Save Shorts from your feed to see them here."/>}
  {tab==='history'&&<ListPanel title="History" ids={s.history} feed={feed} onOpen={v=>window.open(`https://www.youtube.com/shorts/${v.id}`,'_blank')} empty="Your watched Shorts will appear here."/>}
  {tab==='settings'&&<SettingsPanel s={s} update={update} onBack={()=>setTab('feed')}/>} 
  {admin&&<Admin s={s} update={update} input={channelInput} setInput={setChannelInput} addChannel={addChannel} onClose={()=>setAdmin(false)}/>} 
  <nav className="nav"><button className={tab==='feed'?'selected':''} onClick={()=>setTab('feed')}>🔥<span>Feed</span></button><button onClick={()=>{setTab('feed');update({category:'Study'});setFeed([])}}>📚<span>Categories</span></button><button className={tab==='saved'?'selected':''} onClick={()=>setTab('saved')}>🔖<span>Saved</span></button><button className={tab==='history'?'selected':''} onClick={()=>setTab('history')}>🕘<span>History</span></button></nav>
  <button className="adminFab" onClick={()=>setAdmin(true)} title="Admin"><Shield/></button>
 </div>
}
function Reel({v,saved,onSave,onShare,onHide,onOpen}){const [seen,setSeen]=useState(false);return <article className="reel" onClick={()=>{if(!seen){setSeen(true);}}}><div className="videoWrap" onClick={onOpen}><img src={v.thumb} /><div className="playOverlay"><Play fill="white"/></div><div className="youtubeBadge"><Youtube/> YouTube</div></div><div className="reelInfo"><span className="pill">{v.category}</span><h2>{v.title}</h2><p>@{v.channel}</p></div><div className="reelActions"><button onClick={e=>{e.stopPropagation();onSave()}} className={saved?'liked':''}><Bookmark fill={saved?'currentColor':'none'}/><span>{saved?'Saved':'Save'}</span></button><button onClick={e=>{e.stopPropagation();onShare()}}><Share2/><span>Share</span></button><button onClick={e=>{e.stopPropagation();onHide()}}><Ban/><span>Hide</span></button></div><div className="swipeHint">↑ swipe / scroll</div></article>}
function SearchPanel({search,setSearch,feed,onOpen,onBack}){const list=feed.filter(v=>v.title.toLowerCase().includes(search.toLowerCase())||v.channel.toLowerCase().includes(search.toLowerCase()));return <section className="panel"><button className="back" onClick={onBack}><ChevronLeft/>Back</button><h1>Search</h1><div className="searchBox"><Search/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search loaded motivation…"/></div><div className="grid">{list.map(v=><button className="card" key={v.id} onClick={()=>onOpen(v)}><img src={v.thumb}/><b>{v.title}</b><small>{v.channel}</small></button>)}</div></section>}
function ListPanel({title,ids,feed,onOpen,empty}){const list=ids.map(id=>feed.find(v=>v.id===id)).filter(Boolean);return <section className="panel"><h1>{title}</h1>{list.length?<div className="grid">{list.map(v=><button className="card" key={v.id} onClick={()=>onOpen(v)}><img src={v.thumb}/><b>{v.title}</b><small>{v.channel}</small></button>)}</div>:<div className="empty"><Bookmark/><p>{empty}</p></div>}</section>}
function SettingsPanel({s,update,onBack}){const [key,setKey]=useState(s.apiKey);return <section className="panel settings"><button className="back" onClick={onBack}><ChevronLeft/>Back</button><h1>Settings</h1><label>YouTube Data API v3 key<input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="AIza…"/></label><button className="primary" onClick={()=>{update({apiKey:key.trim()});alert('API key saved locally on this device.')}}>Save API key</button><div className="info"><b>Privacy</b><p>Your API key, saved videos, history and channel list are stored in this browser's local storage. This personal version has no server-side account system.</p></div><div className="info"><b>YouTube setup</b><p>Create a Google Cloud project, enable “YouTube Data API v3”, create an API key, and restrict the key to your GitHub Pages domain if desired.</p></div></section>}
function Admin({s,update,input,setInput,addChannel,onClose}){return <div className="modal"><div className="modalInner"><div className="modalHead"><h1>Admin</h1><button onClick={onClose}><X/></button></div><p className="muted">Personal feed controls. Changes stay on this device.</p><div className="addRow"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="YouTube channel URL, @handle, or ID"/><button onClick={addChannel}><Plus/>Add</button></div><h3>Approved channels</h3>{s.channels.length?s.channels.map(c=><div className="channelRow" key={c.id}><div><b>{c.name}</b><small>{c.id}</small></div><button onClick={()=>update({channels:s.channels.filter(x=>x.id!==c.id)})}><Trash2/></button></div>):<p className="muted">No approved channels yet.</p>}<h3>Hidden Shorts</h3><button className="secondary" onClick={()=>{update({hidden:[]});alert('Hidden list cleared.')}}>Clear hidden list</button></div></div>}

createRoot(document.getElementById('root')).render(<App/>);
