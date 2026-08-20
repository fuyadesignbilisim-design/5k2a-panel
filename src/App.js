import { useState, useEffect, useRef, useCallback } from "react";

const SK = "5k2a_v3";
const C = {
  bg0:"#060b18",bg1:"#0a0f1e",bg2:"#0d1428",
  border:"#1e2d4e",border2:"#0f1930",
  teal:"#00d4aa",orange:"#ff6b35",blue:"#4a9eff",
  green:"#00c853",purple:"#9b59b6",yellow:"#f1c40f",red:"#e74c3c",
  dim:"#2a4a6a",muted:"#3a6080",text:"#c8d0e0",bright:"#e0e8ff",
};
const PCFG = {
  1:{bg:C.orange,l:"P1"},2:{bg:C.green,l:"P2"},
  3:{bg:C.blue,l:"P3"},4:{bg:C.purple,l:"P4"},
  5:{bg:C.yellow,l:"P5",tc:"#000"},
};

function loadDB() {
  try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : { semboller:{}, son:null }; }
  catch { return { semboller:{}, son:null }; }
}
function saveDB(d) {
  try { localStorage.setItem(SK, JSON.stringify(d)); } catch(e) { console.error(e); }
}

function takasP(t) {
  if (!t) return null; let p = 0;
  const nt = parseFloat(t.netToplam||0);
  if(nt>20)p+=25;else if(nt>10)p+=18;else if(nt>0)p+=10;else if(nt>-5)p+=3;
  const yn = parseFloat(t.yabanciNet||0);
  if(yn>500000)p+=25;else if(yn>100000)p+=20;else if(yn>0)p+=12;else if(yn>-100000)p+=4;
  const ao=parseFloat(t.alimOrt||0),so=parseFloat(t.satimOrt||0);
  if(ao>0&&so>0){if(ao>so)p+=20;else if(ao===so)p+=10;}
  const ia=parseFloat(t.ilk5AlPct||0),is_=parseFloat(t.ilk5SaPct||0);
  if(ia>0&&is_>0){if(ia>is_)p+=15;else if(ia>is_-5)p+=7;}
  const ns=parseFloat(t.netS||0);
  if(ns>0)p+=15;else if(ns>-50000)p+=5;
  return Math.min(100, Math.round(p));
}
function teknikP(s) {
  if(!s)return null; let p=0;
  p+=Math.min(30,Math.round((parseInt(s.tm1||0)/7)*30));
  if(s.max==1)p+=7;if(s.s90==1)p+=7;if(s.s30==1)p+=6;
  if(s.sisA==1)p+=10;if(s.sisB==1)p+=8;
  if(s.be5son==1)p+=8;if(s.be5sonSar==1)p+=12;
  return Math.min(100, Math.round(p));
}
function birlesikP(tp,tkp) {
  if(tp===null&&tkp===null)return null;
  if(tp===null)return tkp;if(tkp===null)return tp;
  return Math.round(tp*0.55+tkp*0.45);
}
function trendHesap(g) {
  if(!g||g.length<2)return null;
  const sorted=[...g].sort((a,b)=>new Date(a.tarih)-new Date(b.tarih));
  const pp=sorted.map(t=>takasP(t)).filter(x=>x!==null);
  if(pp.length<2)return null;
  const d=pp[pp.length-1]-pp[pp.length-2];
  if(d>10)return"↑↑";if(d>3)return"↑";
  if(d<-10)return"↓↓";if(d<-3)return"↓";return"→";
}
function puanRenk(v) {
  if(v===null||v===undefined)return C.dim;
  return v>=75?C.teal:v>=55?C.yellow:v>=35?C.orange:C.red;
}

function Sparkline({ puanlar, w=60, h=20 }) {
  if(!puanlar||puanlar.length<2) return <span style={{color:C.dim}}>···</span>;
  const mn=Math.min(...puanlar),mx=Math.max(...puanlar),rng=mx-mn||1;
  const pts=puanlar.map((p,i)=>`${(i/(puanlar.length-1))*w},${h-((p-mn)/rng)*h}`).join(" ");
  const rc=puanRenk(puanlar[puanlar.length-1]);
  const lp=pts.split(" ").pop().split(",");
  return (
    <svg width={w} height={h} style={{verticalAlign:"middle"}}>
      <polyline points={pts} fill="none" stroke={rc} strokeWidth={1.5}/>
      <circle cx={lp[0]} cy={lp[1]} r={2.5} fill={rc}/>
    </svg>
  );
}

const PANEL_K = [
  {k:"tablo 1g",ac:"Günlük tablo",r:C.teal},
  {k:"tablo 1h",ac:"Haftalık tablo",r:C.teal},
  {k:"tablo 1ay",ac:"Aylık tablo",r:C.teal},
  {k:"tablo 3ay",ac:"3 Aylık tablo",r:C.teal},
  {k:"takas trend",ac:"Tüm takas trendleri",r:C.yellow},
  {k:"p1 takas",ac:"P1 + Takas >60",r:C.orange},
  {k:"en güçlü",ac:"Teknik+Takas top 10",r:C.orange},
  {k:"hafta özet",ac:"Haftalık takas özeti",r:C.blue},
  {k:"özet",ac:"Sistem metrikleri",r:C.muted},
  {k:"sıfırla SEMBOL",ac:"Sembol verisini sil",r:C.red},
];

export default function App() {
  const [db, setDb] = useState(() => loadDB());
  const [gorunum, setGorunum] = useState("tablo");
  const [donem, setDonem] = useState("TUM");
  const [filtre, setFiltre] = useState(0);
  const [siralama, setSiralama] = useState("oncelik");
  const [panelAcik, setPanelAcik] = useState(false);
  const [ekleMenu, setEkleMenu] = useState(false);
  const [ekleModal, setEkleModal] = useState(null);
  const [hisse, setHisse] = useState("");
  const [donemEkle, setDonemEkle] = useState("1G");
  const [veriInput, setVeriInput] = useState("");
  const [veriBox, setVeriBox] = useState(false);
  const [log, setLog] = useState(["Panel hazır — Veri Uygula kutusuna receiveData kodunu yapıştırın."]);
  const [flash, setFlash] = useState(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  const ref = useRef(null);
  const dbRef = useRef(db);
  dbRef.current = db;

  const logEkle = useCallback((m) => {
    setLog(p => [`[${new Date().toLocaleTimeString("tr-TR")}] ${m}`, ...p.slice(0,50)]);
  }, []);

  const kaydet = useCallback((yeni) => {
    setDb(yeni); dbRef.current = yeni; saveDB(yeni);
  }, []);

  useEffect(() => {
    const h = (e) => { if(ref.current&&!ref.current.contains(e.target)) setEkleMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── receiveData: Claude'dan gelen veriyi işler ──────────────────
  const receiveData = useCallback((payload) => {
    const current = dbRef.current;
    const yeni = { ...current, semboller:{...current.semboller}, son:new Date().toLocaleString("tr-TR") };
    let eklenen=0, guncellenen=0;

    if (payload.tip === "tarama" && Array.isArray(payload.veri)) {
      for (const item of payload.veri) {
        const s = item.sembol.toUpperCase();
        const mevcut = yeni.semboller[s] || { sembol:s };
        yeni.semboller[s] = { ...mevcut, sembol:s, teknik:item.teknik, donem:item.donem||"1G", teknikZaman:new Date().toISOString() };
        if (current.semboller[s]) guncellenen++; else eklenen++;
      }
      logEkle(`✅ Tarama işlendi — ${eklenen} yeni, ${guncellenen} güncellendi (${payload.donem||"1G"})`);
      setFlash("tarama"); setTimeout(()=>setFlash(null), 2500);
    }

    if (payload.tip === "takas" && payload.sembol && payload.veri) {
      const s = payload.sembol.toUpperCase();
      const mevcut = yeni.semboller[s] || { sembol:s };
      const gecmis = [...(mevcut.takasGecmis||[])];
      const tkVeri = { ...payload.veri, tarih:payload.tarih, donem:payload.donem||"1G" };
      const idx = gecmis.findIndex(t=>t.tarih===payload.tarih);
      if(idx>=0) gecmis[idx]=tkVeri; else gecmis.push(tkVeri);
      gecmis.sort((a,b)=>new Date(a.tarih)-new Date(b.tarih));
      const sonGecmis = gecmis.slice(-50);
      yeni.semboller[s] = { ...mevcut, sembol:s, takasGecmis:sonGecmis, sonTakas:tkVeri, takasZaman:new Date().toISOString() };
      const tp = takasP(tkVeri);
      const tr_ = trendHesap(sonGecmis);
      logEkle(`✅ ${s} takas eklendi (${payload.tarih}) — Puan: ${tp}/100  Trend: ${tr_||"—"}`);
      setFlash("takas"); setTimeout(()=>setFlash(null), 2500);
    }

    if (payload.tip === "sifirla" && payload.sembol) {
      const s = payload.sembol.toUpperCase();
      delete yeni.semboller[s];
      logEkle(`🗑 ${s} silindi.`);
    }

    kaydet(yeni);
    return { ok:true, toplam:Object.keys(yeni.semboller).length };
  }, [kaydet, logEkle]);

  // Global erişim — Claude konsoldan da çağırabilir
  useEffect(() => {
    window.receiveData = receiveData;
    return () => { delete window.receiveData; };
  }, [receiveData]);

  // Veri kutusu — JSON yapıştır, çalıştır
  function veriUygula() {
    try {
      const payload = JSON.parse(veriInput.trim());
      receiveData(payload);
      setVeriInput("");
      setVeriBox(false);
    } catch(e) {
      logEkle(`❌ JSON hatası: ${e.message}`);
    }
  }

  // Export JSON
  function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="5k2a_yedek.json"; a.click();
    URL.revokeObjectURL(url);
    logEkle("📦 Yedek indirildi.");
  }

  // Import JSON
  function importData(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        kaydet(parsed);
        logEkle(`📥 İçe aktarıldı — ${Object.keys(parsed.semboller||{}).length} sembol`);
      } catch { logEkle("❌ Geçersiz dosya."); }
    };
    reader.readAsText(file);
    e.target.value="";
  }

  const semboller = Object.values(db.semboller);
  let liste = semboller.filter(s => {
    if(donem!=="TUM"&&s.donem&&s.donem!==donem) return false;
    if(filtre>0&&(s.teknik?.oncelikNo||0)!==filtre) return false;
    return true;
  });
  liste.sort((a,b) => {
    const at=teknikP(a.teknik),bt=teknikP(b.teknik);
    const ak=takasP(a.sonTakas),bk=takasP(b.sonTakas);
    if(siralama==="teknik") return (bt||0)-(at||0);
    if(siralama==="takas") return (bk||0)-(ak||0);
    if(siralama==="birlesik") return (birlesikP(bt,bk)||0)-(birlesikP(at,ak)||0);
    return (a.teknik?.oncelikNo||99)-(b.teknik?.oncelikNo||99);
  });

  const ozet = {
    toplam:semboller.length,
    p1:semboller.filter(s=>s.teknik?.oncelikNo===1).length,
    p2:semboller.filter(s=>s.teknik?.oncelikNo===2).length,
    p3:semboller.filter(s=>s.teknik?.oncelikNo===3).length,
    takasli:semboller.filter(s=>s.takasGecmis?.length>0).length,
    teknikOrt:semboller.length?Math.round(semboller.reduce((a,s)=>a+(teknikP(s.teknik)||0),0)/semboller.length):0,
    takasOrt:(()=>{const t=semboller.filter(s=>s.sonTakas);return t.length?Math.round(t.reduce((a,s)=>a+(takasP(s.sonTakas)||0),0)/t.length):0;})(),
  };

  const th = { padding:"8px 12px",color:C.dim,fontSize:10,letterSpacing:0.8,borderBottom:`1px solid ${C.border}`,background:C.bg2,whiteSpace:"nowrap",position:"sticky",top:0 };
  const td = { padding:"9px 12px",borderBottom:`1px solid ${C.border2}`,whiteSpace:"nowrap" };
  const btn = (active, color=C.teal) => ({
    background:active?color:"transparent",
    color:active?(color===C.teal||color===C.blue?"#060b18":"#fff"):C.muted,
    border:`1px solid ${active?color:C.border}`,borderRadius:4,
    padding:"4px 12px",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400
  });

  const flashBorder = flash==="tarama"?C.teal:flash==="takas"?C.yellow:C.border;

  return (
    <div style={{background:C.bg1,minHeight:"100vh",fontFamily:"'Courier New',monospace",fontSize:12,color:C.text,display:"flex",flexDirection:"column",border:`2px solid ${flashBorder}`,transition:"border-color 0.4s"}}>

      {/* ── HEADER ── */}
      <div style={{background:C.bg2,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{color:C.teal,fontWeight:700,fontSize:14,letterSpacing:1}}>5K+2A TAKİP</span>
          <span style={{background:"#0a2a1a",color:C.teal,fontSize:9,padding:"2px 7px",borderRadius:2,border:`1px solid ${C.teal}`}}>localStorage</span>
          <span style={{color:C.dim,fontSize:10}}>{semboller.length} sembol · {ozet.takasli} takas · {db.son||"—"}</span>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}} ref={ref}>
          <button onClick={exportData} style={{...btn(false),fontSize:9,padding:"3px 8px",color:C.muted}}>📦 Yedek</button>
          <label style={{...btn(false),fontSize:9,padding:"3px 8px",cursor:"pointer"}}>
            📥 Yükle <input type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
          </label>
          <button onClick={()=>setVeriBox(v=>!v)}
            style={{...btn(veriBox,C.green),fontSize:10}}>VERİ UYGULA</button>
          <div style={{position:"relative"}}>
            <button onClick={()=>setEkleMenu(v=>!v)}
              style={{background:C.orange,color:"#fff",border:"none",borderRadius:4,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              + EKLE
            </button>
            {ekleMenu && (
              <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,zIndex:100,minWidth:160}}>
                <div onClick={()=>{setEkleMenu(false);setEkleModal("tarama");setHisse("");}}
                  style={{padding:"10px 14px",cursor:"pointer",color:C.teal,borderBottom:`1px solid ${C.border}`,fontSize:11}}>Tarama Listesi</div>
                <div onClick={()=>{setEkleMenu(false);setEkleModal("takas");setHisse("");}}
                  style={{padding:"10px 14px",cursor:"pointer",color:C.yellow,fontSize:11}}>Takas Verisi</div>
              </div>
            )}
          </div>
          <button onClick={()=>{setPanelAcik(v=>!v);setGorunum("tablo");}} style={btn(panelAcik,C.blue)}>PANEL</button>
          <button onClick={()=>{setGorunum(v=>v==="ozet"?"tablo":"ozet");setPanelAcik(false);}} style={btn(gorunum==="ozet",C.purple)}>ÖZET</button>
        </div>
      </div>

      {/* ── VERİ UYGULA KUTUSU ── */}
      {veriBox && (
        <div style={{background:C.bg0,borderBottom:`2px solid ${C.green}`,padding:"12px 16px",flexShrink:0}}>
          <div style={{color:C.green,fontSize:10,fontWeight:700,marginBottom:8}}>VERİ UYGULA — Claude'dan gelen JSON kodu buraya yapıştırın</div>
          <div style={{display:"flex",gap:8}}>
            <textarea
              value={veriInput}
              onChange={e=>setVeriInput(e.target.value)}
              placeholder={'{\n  "tip": "tarama",\n  "donem": "1G",\n  "veri": [...]\n}'}
              style={{flex:1,background:C.bg1,border:`1px solid ${C.border}`,color:C.text,padding:"8px 10px",borderRadius:4,fontSize:11,fontFamily:"inherit",height:80,resize:"vertical",outline:"none"}}
            />
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <button onClick={veriUygula}
                style={{background:C.green,color:"#fff",border:"none",borderRadius:4,padding:"8px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                UYGULA
              </button>
              <button onClick={()=>{setVeriBox(false);setVeriInput("");}}
                style={{background:"transparent",color:C.dim,border:`1px solid ${C.border}`,borderRadius:4,padding:"8px 16px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EKLE MODAL ── */}
      {ekleModal && (
        <div style={{background:C.bg0,borderBottom:`1px solid ${C.border}`,padding:"10px 16px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{color:ekleModal==="tarama"?C.teal:C.yellow,fontWeight:700,fontSize:11}}>
              {ekleModal==="tarama"?"TARAMA LİSTESİ":"TAKAS VERİSİ"}
            </span>
            {ekleModal==="takas" && (
              <input value={hisse} onChange={e=>setHisse(e.target.value.toUpperCase())}
                placeholder="Hisse kodu (örn: MOGAN)"
                style={{background:C.bg1,border:`1px solid ${C.border}`,color:C.text,padding:"5px 10px",borderRadius:4,fontSize:11,fontFamily:"inherit",width:160,outline:"none"}}/>
            )}
            <span style={{color:C.dim,fontSize:10}}>Dönem:</span>
            {["1G","1H","1AY","3AY"].map(d=>(
              <button key={d} onClick={()=>setDonemEkle(d)} style={btn(donemEkle===d)}>{d}</button>
            ))}
            <button onClick={()=>{
              if(ekleModal==="tarama") window.open(`https://claude.ai/new?q=tarama+veri+${donemEkle}`,"_blank");
              else if(hisse.trim()) window.open(`https://claude.ai/new?q=takas+veri+${hisse.trim().toUpperCase()}+${donemEkle}`,"_blank");
              else { logEkle("Hata: Hisse kodu girin."); return; }
              setEkleModal(null);
            }} style={{background:ekleModal==="tarama"?C.teal:C.yellow,color:"#060b18",border:"none",borderRadius:4,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Claude'a Git ↗
            </button>
            <button onClick={()=>setEkleModal(null)}
              style={{background:"transparent",color:C.dim,border:"none",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>iptal</button>
          </div>
          <div style={{marginTop:5,color:C.dim,fontSize:9}}>
            Claude sekmesinde ekran görüntüsünü ekleyip gönderin. Claude size JSON kodu verecek — kopyalayıp VERİ UYGULA kutusuna yapıştırın.
          </div>
        </div>
      )}

      {/* ── PANEL DRAWER ── */}
      {panelAcik && (
        <div style={{background:C.bg0,borderBottom:`2px solid ${C.border}`,padding:"12px 16px",flexShrink:0}}>
          <div style={{color:C.dim,fontSize:9,marginBottom:8,letterSpacing:0.8}}>PANEL — Komut Referansı</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {PANEL_K.map(({k,ac,r})=>(
              <div key={k}
                onClick={()=>{
                  navigator.clipboard.writeText(k).then(()=>{
                    setKopyalandi(k);setTimeout(()=>setKopyalandi(null),1500);
                  });
                }}
                style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,padding:"7px 11px",cursor:"pointer",display:"flex",gap:8,alignItems:"center"}}>
                <span style={{color:r,fontSize:10,fontWeight:700}}>{kopyalandi===k?"✅ kopyalandı":k}</span>
                <span style={{color:C.muted,fontSize:9}}>{ac}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FİLTRE BARI ── */}
      {gorunum==="tablo" && (
        <div style={{background:C.bg0,borderBottom:`1px solid ${C.border}`,padding:"7px 16px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",flexShrink:0}}>
          <span style={{color:C.dim,fontSize:9}}>ÖNCELİK</span>
          {[{v:0,l:"TÜM",c:C.teal},...[1,2,3,4].map(n=>({v:n,l:`P${n}`,c:PCFG[n].bg}))].map(({v,l,c})=>(
            <button key={v} onClick={()=>setFiltre(v)} style={btn(filtre===v,c)}>{l}</button>
          ))}
          <div style={{width:1,height:16,background:C.border}}/>
          <span style={{color:C.dim,fontSize:9}}>DÖNEM</span>
          {["1G","1H","1AY","3AY","TUM"].map(d=>(
            <button key={d} onClick={()=>setDonem(d)} style={btn(donem===d)}>{d}</button>
          ))}
          <div style={{width:1,height:16,background:C.border}}/>
          <span style={{color:C.dim,fontSize:9}}>SIRALA</span>
          {[{v:"oncelik",l:"ÖNCELİK"},{v:"teknik",l:"TEKNİK"},{v:"takas",l:"TAKAS"},{v:"birlesik",l:"BİRLEŞİK"}].map(({v,l})=>(
            <button key={v} onClick={()=>setSiralama(v)} style={btn(siralama===v)}>{l}</button>
          ))}
          <span style={{marginLeft:"auto",color:C.dim,fontSize:9}}>{liste.length} kayıt</span>
        </div>
      )}

      {/* ── ÖZET ── */}
      {gorunum==="ozet" && (
        <div style={{padding:16,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,flexShrink:0}}>
          {[
            {l:"Toplam Sembol",v:ozet.toplam,c:C.teal},
            {l:"P1 Sinyal",v:ozet.p1,c:C.orange},
            {l:"P2 Sinyal",v:ozet.p2,c:C.green},
            {l:"P3 Sinyal",v:ozet.p3,c:C.blue},
            {l:"Takas Verili",v:ozet.takasli,c:C.yellow},
            {l:"Ort. Teknik P.",v:ozet.teknikOrt,c:puanRenk(ozet.teknikOrt)},
            {l:"Ort. Takas P.",v:ozet.takasOrt,c:puanRenk(ozet.takasOrt)},
          ].map(({l,v,c})=>(
            <div key={l} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:6,padding:"14px 16px"}}>
              <div style={{color:C.dim,fontSize:9,marginBottom:6,letterSpacing:0.8}}>{l.toUpperCase()}</div>
              <div style={{color:c,fontSize:26,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── ANA TABLO ── */}
      {gorunum==="tablo" && (
        <div style={{overflowX:"auto",flex:1}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr>
                {["SEMBOL","ÖNCELİK","TM1","SİS-A","S90","5SON","TEKNİK P.","TAKAS P.","BİRLEŞİK","TAKAS TARİHİ","TREND"].map(h=>(
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {liste.length===0 ? (
                <tr><td colSpan={11} style={{...td,color:C.dim,textAlign:"center",padding:60,fontSize:13}}>
                  Veri yok — <span style={{color:C.muted}}>+ EKLE ile başlayın veya VERİ UYGULA ile JSON yapıştırın</span>
                </td></tr>
              ) : liste.map((s,i)=>{
                const tek=s.teknik||{};
                const tp=teknikP(tek),tkp=takasP(s.sonTakas),bp=birlesikP(tp,tkp);
                const gecmis=s.takasGecmis||[];
                const pp=gecmis.map(t=>takasP(t)).filter(x=>x!==null);
                const tr_=trendHesap(gecmis);
                const trc={"↑↑":C.teal,"↑":C.blue,"→":C.muted,"↓":C.orange,"↓↓":C.red}[tr_]||C.dim;
                const pcfg=PCFG[tek.oncelikNo||0];
                return (
                  <tr key={s.sembol||i} style={{background:i%2===0?C.bg1:C.bg0}}>
                    <td style={{...td,color:C.bright,fontWeight:700,fontSize:13}}>{s.sembol||"?"}</td>
                    <td style={td}>
                      {pcfg
                        ?<span style={{background:pcfg.bg,color:pcfg.tc||"#fff",borderRadius:4,padding:"3px 9px",fontSize:11,fontWeight:700}}>{pcfg.l}</span>
                        :<span style={{color:C.dim}}>—</span>}
                    </td>
                    <td style={{...td,color:parseInt(tek.tm1)>=6?C.teal:parseInt(tek.tm1)>=4?C.yellow:C.muted,fontWeight:700}}>
                      {tek.tm1||"—"}
                    </td>
                    <td style={td}>
                      {tek.sisA==1?<span style={{color:C.purple,fontWeight:700}}>A</span>:<span style={{color:C.dim}}>—</span>}
                    </td>
                    <td style={td}>
                      {tek.s90==1?<span style={{color:C.teal,fontSize:11,fontWeight:700}}>S90</span>:<span style={{color:C.dim}}>—</span>}
                    </td>
                    <td style={td}>
                      {tek.be5son==1
                        ?<span style={{color:C.blue}}>{parseInt(tek.be5sonGun)>0?`${tek.be5sonGun}g`:"✓"}</span>
                        :<span style={{color:C.dim}}>—</span>}
                    </td>
                    <td style={td}>
                      {tp!==null
                        ?<span style={{color:puanRenk(tp),fontWeight:700}}>{tp}<span style={{color:C.dim,fontSize:9}}>/100</span></span>
                        :<span style={{color:C.dim}}>—</span>}
                    </td>
                    <td style={td}>
                      {tkp!==null
                        ?<span style={{color:puanRenk(tkp),fontWeight:700}}>{tkp}<span style={{color:C.dim,fontSize:9}}>/100</span></span>
                        :<span style={{color:C.dim}}>—</span>}
                    </td>
                    <td style={td}>
                      {bp!==null
                        ?<span style={{color:puanRenk(bp),fontWeight:700}}>{bp}<span style={{color:C.dim,fontSize:9}}>/100</span></span>
                        :<span style={{color:C.dim}}>—</span>}
                    </td>
                    <td style={{...td,color:C.muted,fontSize:10}}>{s.sonTakas?.tarih||"—"}</td>
                    <td style={td}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {pp.length>=2 && <Sparkline puanlar={pp}/>}
                        {tr_?<span style={{color:trc,fontWeight:700,fontSize:14}}>{tr_}</span>:<span style={{color:C.dim}}>—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── LOG ── */}
      <div style={{background:C.bg0,borderTop:`1px solid ${C.border}`,padding:"4px 16px",maxHeight:60,overflowY:"auto",flexShrink:0}}>
        {log.map((m,i)=>(
          <div key={i} style={{fontSize:9,color:i===0?C.muted:C.dim,padding:"1px 0",borderBottom:`1px solid ${C.border2}`}}>
            <span style={{color:C.border,marginRight:6}}>›</span>{m}
          </div>
        ))}
      </div>

    </div>
  );
}
