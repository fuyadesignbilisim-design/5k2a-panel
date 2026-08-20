import { useState, useEffect, useRef, useCallback } from "react";

const SK = { "5K2A":"5k2a_v3","5KTSI":"5ktsi_v1","5KCLAU":"5kclau_v1" };
const C = {
  bg0:"#060b18",bg1:"#0a0f1e",bg2:"#0d1428",
  border:"#1e2d4e",border2:"#0f1930",
  teal:"#00d4aa",orange:"#ff6b35",blue:"#4a9eff",
  green:"#00c853",purple:"#9b59b6",yellow:"#f1c40f",red:"#e74c3c",
  dim:"#2a4a6a",muted:"#3a6080",text:"#c8d0e0",bright:"#e0e8ff",
};
const PCFG={1:{bg:C.orange,l:"P1"},2:{bg:C.green,l:"P2"},3:{bg:C.blue,l:"P3"},4:{bg:C.purple,l:"P4"},5:{bg:C.yellow,l:"P5",tc:"#000"}};

const LISTELER = {
  "5K2A":{label:"5K+2A",renk:C.teal,sutunlar:[
    {key:"oncelikNo",label:"ÖNCELİK",tip:"badge"},
    {key:"tm1",label:"TM1",tip:"sayi",renk:true},
    {key:"sisA",label:"SİS-A",tip:"flag",goster:"A",renk:C.purple},
    {key:"s90",label:"S90",tip:"flag",goster:"S90",renk:C.teal},
    {key:"be5son",label:"5SON",tip:"gun",gunKey:"be5sonGun"},
    {key:"teknikP",label:"TEKNİK P.",tip:"puan"},
    {key:"takasP",label:"TAKAS P.",tip:"puan"},
    {key:"birlesik",label:"BİRLEŞİK",tip:"puan"},
    {key:"takTarih",label:"TAKAS TARİHİ",tip:"tarih"},
    {key:"trend",label:"TREND",tip:"trend"},
  ]},
  "5KTSI":{label:"5K TSI",renk:C.blue,sutunlar:[
    {key:"tumTsi",label:"TUM+TSI",tip:"flag10",renk:C.teal},
    {key:"tumTsiGun",label:"G.GÜN",tip:"sayi"},
    {key:"barFarkPct",label:"BAR FARK%",tip:"pct"},
    {key:"filtreSar",label:"FİLTRE+SAR",tip:"flag10",renk:C.orange},
    {key:"sinyalFiyat",label:"SİNYAL FİY.",tip:"sayi"},
    {key:"tumOnay",label:"TUM ONAY",tip:"flag10",renk:C.green},
    {key:"sliSar12",label:"5Lİ SAR 1-2",tip:"sayi"},
    {key:"tsiHafta",label:"TSI HAFTA",tip:"flag10",renk:C.yellow},
    {key:"sliSar10",label:"5Lİ SAR 1-0",tip:"flag10",renk:C.teal},
    {key:"sliSarGun",label:"SAR G.GÜN",tip:"sayi"},
    {key:"sliSarFark",label:"SAR FARK%",tip:"pct"},
    {key:"ilkGunMax",label:"İLK GÜN MAX",tip:"flag10",renk:C.orange},
    {key:"ikliAylik",label:"2Lİ AYLIK",tip:"sayi"},
    {key:"ikliAylik10",label:"2Lİ AYLIK 1-0",tip:"flag10",renk:C.purple},
    {key:"ikliAylikGun",label:"2Lİ AY.GÜN",tip:"sayi"},
    {key:"takasP",label:"TAKAS P.",tip:"puan"},
    {key:"takTarih",label:"TAKAS TARİHİ",tip:"tarih"},
    {key:"trend",label:"TREND",tip:"trend"},
  ]},
  "5KCLAU":{label:"5K CLAUDE",renk:C.purple,sutunlar:[
    {key:"sinyalAnlik",label:"SİNYAL 1-0",tip:"flag10",renk:C.teal},
    {key:"sinyalSkor",label:"SİNYAL SKOR",tip:"sayi"},
    {key:"sinyalGun",label:"GEÇEN GÜN",tip:"sayi"},
    {key:"var5k",label:"5K VAR",tip:"flag10",renk:C.orange},
    {key:"kutuSkor",label:"KUTU SKOR",tip:"sayi"},
    {key:"canliSkor",label:"CANLI SKOR",tip:"sayi"},
    {key:"skorFarkPct",label:"SKOR FARK%",tip:"pct"},
    {key:"fiyatFarkPct",label:"FİYAT FARK%",tip:"pct"},
    {key:"skorSapma",label:"SKOR SAPMA%",tip:"pct"},
    {key:"g30Fiyat",label:"30G %Fiy.",tip:"pct"},
    {key:"g60Fiyat",label:"60G %Fiy.",tip:"pct"},
    {key:"tier1",label:"TIER1",tip:"flag10",renk:C.orange},
    {key:"tier1Gun",label:"T1 GÜN",tip:"sayi"},
    {key:"tier2",label:"TIER2",tip:"flag10",renk:C.yellow},
    {key:"tier2Gun",label:"T2 GÜN",tip:"sayi"},
    {key:"tier3",label:"TIER3",tip:"flag10",renk:C.green},
    {key:"tier3Gun",label:"T3 GÜN",tip:"sayi"},
    {key:"filtre8k",label:"8K FİLTRE",tip:"sayi"},
    {key:"takasP",label:"TAKAS P.",tip:"puan"},
    {key:"takTarih",label:"TAKAS TARİHİ",tip:"tarih"},
    {key:"trend",label:"TREND",tip:"trend"},
  ]},
};

function loadDB(l){try{const r=localStorage.getItem(SK[l]);return r?JSON.parse(r):{semboller:{},son:null};}catch{return{semboller:{},son:null};}}
function saveDB(l,d){try{localStorage.setItem(SK[l],JSON.stringify(d));}catch(e){console.error(e);}}

function takasP(t){
  if(!t)return null;let p=0;
  const nt=parseFloat(t.netToplam||0);
  if(nt>20)p+=25;else if(nt>10)p+=18;else if(nt>0)p+=10;else if(nt>-5)p+=3;
  const yn=parseFloat(t.yabanciNet||0);
  if(yn>500000)p+=25;else if(yn>100000)p+=20;else if(yn>0)p+=12;else if(yn>-100000)p+=4;
  const ao=parseFloat(t.alimOrt||0),so=parseFloat(t.satimOrt||0);
  if(ao>0&&so>0){if(ao>so)p+=20;else if(ao===so)p+=10;}
  const ia=parseFloat(t.ilk5AlPct||0),is_=parseFloat(t.ilk5SaPct||0);
  if(ia>0&&is_>0){if(ia>is_)p+=15;else if(ia>is_-5)p+=7;}
  const ns=parseFloat(t.netS||0);
  if(ns>0)p+=15;else if(ns>-50000)p+=5;
  return Math.min(100,Math.round(p));
}
function teknikP(s){
  if(!s)return null;let p=0;
  p+=Math.min(30,Math.round((parseInt(s.tm1||0)/7)*30));
  if(s.max==1)p+=7;if(s.s90==1)p+=7;if(s.s30==1)p+=6;
  if(s.sisA==1)p+=10;if(s.sisB==1)p+=8;
  if(s.be5son==1)p+=8;if(s.be5sonSar==1)p+=12;
  return Math.min(100,Math.round(p));
}
function birlesikP(tp,tkp){
  if(tp===null&&tkp===null)return null;
  if(tp===null)return tkp;if(tkp===null)return tp;
  return Math.round(tp*0.55+tkp*0.45);
}
function trendHesap(g){
  if(!g||g.length<2)return null;
  const sorted=[...g].sort((a,b)=>new Date(a.tarih)-new Date(b.tarih));
  const pp=sorted.map(t=>takasP(t)).filter(x=>x!==null);
  if(pp.length<2)return null;
  const d=pp[pp.length-1]-pp[pp.length-2];
  if(d>10)return"↑↑";if(d>3)return"↑";if(d<-10)return"↓↓";if(d<-3)return"↓";return"→";
}
function trendPuanFark(g){
  if(!g||g.length<2)return null;
  const sorted=[...g].sort((a,b)=>new Date(a.tarih)-new Date(b.tarih));
  const pp=sorted.map(t=>takasP(t)).filter(x=>x!==null);
  if(pp.length<2)return null;
  return pp[pp.length-1]-pp[pp.length-2];
}
function puanRenk(v){
  if(v===null||v===undefined)return C.dim;
  return v>=75?C.teal:v>=55?C.yellow:v>=35?C.orange:C.red;
}

function Sparkline({puanlar,w=52,h=18}){
  if(!puanlar||puanlar.length<2)return null;
  const mn=Math.min(...puanlar),mx=Math.max(...puanlar),rng=mx-mn||1;
  const pts=puanlar.map((p,i)=>`${(i/(puanlar.length-1))*w},${h-((p-mn)/rng)*h}`).join(" ");
  const rc=puanRenk(puanlar[puanlar.length-1]);
  const lp=pts.split(" ").pop().split(",");
  return <svg width={w} height={h} style={{verticalAlign:"middle"}}><polyline points={pts} fill="none" stroke={rc} strokeWidth={1.5}/><circle cx={lp[0]} cy={lp[1]} r={2} fill={rc}/></svg>;
}

function Hucre({tip,val,sutun,s}){
  const dim=<span style={{color:C.dim}}>—</span>;
  if(tip==="badge"){const cfg=PCFG[val];return cfg?<span style={{background:cfg.bg,color:cfg.tc||"#fff",borderRadius:3,padding:"2px 8px",fontSize:10,fontWeight:700}}>{cfg.l}</span>:dim;}
  if(tip==="sayi") return val!==undefined&&val!==null&&val!==""&&val!=="0"?<span style={{color:C.text}}>{val}</span>:dim;
  if(tip==="pct"){const n=parseFloat(val);if(isNaN(n))return dim;const renk=n>0?C.teal:n<0?C.red:C.muted;return <span style={{color:renk}}>{n>0?"+":""}{n.toFixed(2)}%</span>;}
  if(tip==="flag10") return val==1?<span style={{color:sutun.renk||C.teal,fontWeight:700}}>✓</span>:dim;
  if(tip==="flag") return val==1?<span style={{color:sutun.renk||C.teal,fontWeight:700}}>{sutun.goster}</span>:dim;
  if(tip==="gun"){
    if(val==1){const g=parseInt(s?.[sutun.gunKey]||0);return <span style={{color:C.blue}}>{g>0?`${g}g`:"✓"}</span>;}
    return dim;
  }
  if(tip==="puan"){if(val===null||val===undefined)return dim;return <span style={{color:puanRenk(val),fontWeight:700}}>{val}<span style={{color:C.dim,fontSize:9}}>/100</span></span>;}
  if(tip==="tarih") return val?<span style={{color:C.muted,fontSize:10}}>{val}</span>:dim;
  if(tip==="trend"){
    const trc={"↑↑":C.teal,"↑":C.blue,"→":C.muted,"↓":C.orange,"↓↓":C.red}[val]||C.dim;
    const pp=s?._pp||[];
    return <div style={{display:"flex",alignItems:"center",gap:5}}>
      {pp.length>=2&&<Sparkline puanlar={pp}/>}
      {val?<span style={{color:trc,fontWeight:700,fontSize:13}}>{val}</span>:dim}
    </div>;
  }
  return dim;
}

function satirHazirla(s,liste){
  const tek=s.teknik||{};
  const tkp=takasP(s.sonTakas);
  const gecmis=s.takasGecmis||[];
  const pp=gecmis.map(t=>takasP(t)).filter(x=>x!==null);
  const tr_=trendHesap(gecmis);
  const tFark=trendPuanFark(gecmis);
  const zaman=s.teknikZaman?new Date(s.teknikZaman).getTime():0;

  if(liste==="5K2A"){
    const tp=teknikP(tek);
    return {oncelikNo:tek.oncelikNo||0,tm1:tek.tm1,sisA:tek.sisA,s90:tek.s90,
      be5son:tek.be5son,be5sonGun:tek.be5sonGun,teknikP:tp,takasP:tkp,
      birlesik:birlesikP(tp,tkp),takTarih:s.sonTakas?.tarih||null,trend:tr_,
      _pp:pp,_tFark:tFark,_zaman:zaman,_oncelik:tek.oncelikNo||99};
  }
  if(liste==="5KTSI"){
    return {tumTsi:tek.tumTsi,tumTsiGun:tek.tumTsiGun,barFarkPct:tek.barFarkPct,
      filtreSar:tek.filtreSar,sinyalFiyat:tek.sinyalFiyat,tumOnay:tek.tumOnay,
      sliSar12:tek.sliSar12,tsiHafta:tek.tsiHafta,sliSar10:tek.sliSar10,
      sliSarGun:tek.sliSarGun,sliSarFark:tek.sliSarFark,ilkGunMax:tek.ilkGunMax,
      ikliAylik:tek.ikliAylik,ikliAylik10:tek.ikliAylik10,ikliAylikGun:tek.ikliAylikGun,
      takasP:tkp,takTarih:s.sonTakas?.tarih||null,trend:tr_,
      _pp:pp,_tFark:tFark,_zaman:zaman,_oncelik:parseInt(tek.tumTsiGun||999)};
  }
  if(liste==="5KCLAU"){
    return {sinyalAnlik:tek.sinyalAnlik,sinyalSkor:tek.sinyalSkor,sinyalGun:tek.sinyalGun,
      var5k:tek.var5k,kutuSkor:tek.kutuSkor,canliSkor:tek.canliSkor,
      skorFarkPct:tek.skorFarkPct,fiyatFarkPct:tek.fiyatFarkPct,skorSapma:tek.skorSapma,
      g30Fiyat:tek.g30Fiyat,g60Fiyat:tek.g60Fiyat,tier1:tek.tier1,tier1Gun:tek.tier1Gun,
      tier2:tek.tier2,tier2Gun:tek.tier2Gun,tier3:tek.tier3,tier3Gun:tek.tier3Gun,
      filtre8k:tek.filtre8k,takasP:tkp,takTarih:s.sonTakas?.tarih||null,trend:tr_,
      _pp:pp,_tFark:tFark,_zaman:zaman,_oncelik:parseFloat(tek.sinyalSkor||0)*-1};
  }
  return {};
}

// TREND GÖRÜNÜMÜ — özel sütunlar
const TREND_SUTUNLAR=[
  {key:"takasP",label:"TAKAS P.",tip:"puan"},
  {key:"trend",label:"TREND",tip:"trend"},
  {key:"trendFark",label:"PUAN FARKI",tip:"trendFark"},
  {key:"takTarih",label:"SON TARİH",tip:"tarih"},
  {key:"teknikP",label:"TEKNİK P.",tip:"puan"},
  {key:"birlesik",label:"BİRLEŞİK",tip:"puan"},
];

export default function App(){
  const [aktifListe,setAktifListe]=useState("5K2A");
  const [dbler,setDbler]=useState({"5K2A":loadDB("5K2A"),"5KTSI":loadDB("5KTSI"),"5KCLAU":loadDB("5KCLAU")});
  const [siralama,setSiralama]=useState("varsayilan");
  const [donem,setDonem]=useState("1G");
  const [panelAcik,setPanelAcik]=useState(false);
  const [ekleMenu,setEkleMenu]=useState(false);
  const [ekleModal,setEkleModal]=useState(null);
  const [hisse,setHisse]=useState("");
  const [donemEkle,setDonemEkle]=useState("1G");
  const [veriBox,setVeriBox]=useState(false);
  const [veriInput,setVeriInput]=useState("");
  const [log,setLog]=useState(["Panel hazır — 3 liste aktif."]);
  const [flash,setFlash]=useState(null);
  const ref=useRef(null);
  const dblRef=useRef(dbler);
  dblRef.current=dbler;

  const logEkle=useCallback((m)=>setLog(p=>[`[${new Date().toLocaleTimeString("tr-TR")}] ${m}`,...p.slice(0,50)]),[]);
  const kaydet=useCallback((liste,yeni)=>{
    setDbler(prev=>({...prev,[liste]:yeni}));
    dblRef.current={...dblRef.current,[liste]:yeni};
    saveDB(liste,yeni);
  },[]);

  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setEkleMenu(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const receiveData=useCallback((payload)=>{
    const liste=payload.liste||aktifListe;
    const current=dblRef.current[liste];
    const yeni={...current,semboller:{...current.semboller},son:new Date().toLocaleString("tr-TR")};
    let eklenen=0,guncellendi=0;
    if(payload.tip==="tarama"&&Array.isArray(payload.veri)){
      for(const item of payload.veri){
        const s=item.sembol.toUpperCase();
        const mevcut=yeni.semboller[s]||{sembol:s};
        yeni.semboller[s]={...mevcut,sembol:s,teknik:item.teknik,donem:item.donem||"1G",teknikZaman:new Date().toISOString()};
        if(current.semboller[s])guncellendi++;else eklenen++;
      }
      logEkle(`✅ [${liste}] ${eklenen} yeni · ${guncellendi} güncellendi · Dönem: ${payload.donem||"1G"}`);
      setFlash("tarama");setTimeout(()=>setFlash(null),2500);
    }
    if(payload.tip==="takas"&&payload.sembol&&payload.veri){
      const s=payload.sembol.toUpperCase();
      const mevcut=yeni.semboller[s]||{sembol:s};
      const gecmis=[...(mevcut.takasGecmis||[])];
      const tkVeri={...payload.veri,tarih:payload.tarih,donem:payload.donem||"1G"};
      const idx=gecmis.findIndex(t=>t.tarih===payload.tarih);
      if(idx>=0)gecmis[idx]=tkVeri;else gecmis.push(tkVeri);
      gecmis.sort((a,b)=>new Date(a.tarih)-new Date(b.tarih));
      yeni.semboller[s]={...mevcut,sembol:s,takasGecmis:gecmis.slice(-50),sonTakas:tkVeri,takasZaman:new Date().toISOString()};
      logEkle(`✅ [${liste}] ${s} takas (${payload.tarih}) Puan:${takasP(tkVeri)}/100 Trend:${trendHesap(gecmis.slice(-50))||"—"}`);
      setFlash("takas");setTimeout(()=>setFlash(null),2500);
    }
    if(payload.tip==="sifirla"&&payload.sembol){
      delete yeni.semboller[payload.sembol.toUpperCase()];
      logEkle(`🗑 [${liste}] ${payload.sembol.toUpperCase()} silindi.`);
    }
    kaydet(liste,yeni);
    return{ok:true};
  },[kaydet,logEkle,aktifListe]);

  useEffect(()=>{window.receiveData=receiveData;return()=>{delete window.receiveData;};},[receiveData]);

  function veriUygula(){
    try{const p=JSON.parse(veriInput.trim());receiveData(p);setVeriInput("");setVeriBox(false);}
    catch(e){logEkle(`❌ JSON hatası: ${e.message}`);}
  }
  function temizleData(){
    if(!window.confirm(`[${LISTELER[aktifListe].label}] listesindeki TÜM veri silinecek. Emin misiniz?`))return;
    const bos={semboller:{},son:null};
    kaydet(aktifListe,bos);
    logEkle(`🗑 [${aktifListe}] liste temizlendi.`);
  }

  function exportData(){
    const blob=new Blob([JSON.stringify(dbler,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="5k_panel_yedek.json";a.click();
    URL.revokeObjectURL(url);logEkle("📦 Yedeklendi.");
  }
  function importData(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const parsed=JSON.parse(ev.target.result);
        if(parsed["5K2A"]||parsed["5KTSI"]||parsed["5KCLAU"]){
          Object.entries(parsed).forEach(([l,v])=>{if(SK[l]){saveDB(l,v);setDbler(p=>({...p,[l]:v}));}});
          logEkle("📥 Tüm listeler içe aktarıldı.");
        }else{kaydet(aktifListe,parsed);logEkle(`📥 [${aktifListe}] içe aktarıldı.`);}
      }catch{logEkle("❌ Geçersiz dosya.");}
    };
    reader.readAsText(file);e.target.value="";
  }

  const db=dbler[aktifListe];
  const listeKfg=LISTELER[aktifListe];
  const tumSemboller=Object.values(db.semboller);

  // Dönem filtresi
  const donemFiltreli=tumSemboller.filter(s=>{
    
    return s.donem===donem;
  });

  // Satır hazırla
  let liste=donemFiltreli.map(s=>({...s,...satirHazirla(s,aktifListe)}));

  // TREND görünümünde sadece 2+ takas olanlar
  const trendGorunum=siralama==="trend";
  if(trendGorunum){
    liste=liste.filter(s=>(s._pp||[]).length>=2);
    liste.sort((a,b)=>(b._tFark||0)-(a._tFark||0));
  } else {
    if(siralama==="varsayilan") liste.sort((a,b)=>(a._oncelik||99)-(b._oncelik||99));
    else if(siralama==="teknik") liste.sort((a,b)=>(b.teknikP||0)-(a.teknikP||0));
    else if(siralama==="takas") liste.sort((a,b)=>(b.takasP||0)-(a.takasP||0));
    else if(siralama==="birlesik") liste.sort((a,b)=>(b.birlesik||0)-(a.birlesik||0));
    else if(siralama==="canli") liste.sort((a,b)=>(b._zaman||0)-(a._zaman||0));
  }

  const sayimYap=(liste,d)=>Object.values(dbler[liste].semboller).filter(s=>s.donem===d).length;
  const ozet={"5K2A":sayimYap("5K2A",donem),"5KTSI":sayimYap("5KTSI",donem),"5KCLAU":sayimYap("5KCLAU",donem)};

  const th={padding:"7px 12px",color:C.dim,fontSize:9,letterSpacing:0.8,borderBottom:`1px solid ${C.border}`,background:C.bg2,whiteSpace:"nowrap",position:"sticky",top:0};
  const td={padding:"8px 12px",borderBottom:`1px solid ${C.border2}`,whiteSpace:"nowrap"};
  const btn=(active,color=C.teal)=>({
    background:active?color:"transparent",
    color:active?(color===C.teal||color===C.blue?"#060b18":"#fff"):C.muted,
    border:`1px solid ${active?color:C.border}`,borderRadius:4,
    padding:"4px 12px",fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:active?700:400
  });
  const flashBorder=flash==="tarama"?C.teal:flash==="takas"?C.yellow:listeKfg.renk;

  const sutunlar=trendGorunum?TREND_SUTUNLAR:listeKfg.sutunlar;

  return(
    <div style={{background:C.bg1,minHeight:"100vh",fontFamily:"'Courier New',monospace",fontSize:12,color:C.text,display:"flex",flexDirection:"column",border:`2px solid ${flashBorder}`,transition:"border-color 0.4s"}}>

      {/* HEADER */}
      <div style={{background:C.bg2,borderBottom:`1px solid ${C.border}`,padding:"9px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:C.teal,fontWeight:700,fontSize:14,letterSpacing:1}}>5K TAKİP</span>
          {Object.entries(LISTELER).map(([key,cfg])=>(
            <button key={key} onClick={()=>{setAktifListe(key);setSiralama("varsayilan");setDonem("1G");}}
              style={{background:aktifListe===key?cfg.renk:"transparent",
                color:aktifListe===key?"#060b18":C.muted,
                border:`1px solid ${aktifListe===key?cfg.renk:C.border}`,
                borderRadius:4,padding:"4px 14px",fontSize:11,cursor:"pointer",
                fontFamily:"inherit",fontWeight:aktifListe===key?700:400}}>
              {cfg.label}<span style={{marginLeft:4,fontSize:9,opacity:0.8}}>{ozet[key]}</span>
            </button>
          ))}
          <span style={{color:C.dim,fontSize:9,marginLeft:4}}>{db.son||"—"}</span>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}} ref={ref}>
          <button onClick={exportData} style={{...btn(false),fontSize:9,padding:"3px 8px"}}>📦 Yedek</button>
          <button onClick={temizleData} style={{...btn(false,C.red),fontSize:9,padding:"3px 8px",color:C.red}}>🗑 Temizle</button>
          <label style={{...btn(false),fontSize:9,padding:"3px 8px",cursor:"pointer"}}>
            📥 Yükle<input type="file" accept=".json" onChange={importData} style={{display:"none"}}/>
          </label>
          <button onClick={()=>setVeriBox(v=>!v)} style={{...btn(veriBox,C.green),fontSize:10}}>VERİ UYGULA</button>
          <div style={{position:"relative"}}>
            <button onClick={()=>setEkleMenu(v=>!v)}
              style={{background:C.orange,color:"#fff",border:"none",borderRadius:4,padding:"5px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              + EKLE
            </button>
            {ekleMenu&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,zIndex:100,minWidth:160}}>
                <div onClick={()=>{setEkleMenu(false);setEkleModal("tarama");}}
                  style={{padding:"9px 14px",cursor:"pointer",color:C.teal,borderBottom:`1px solid ${C.border}`,fontSize:11}}>Tarama Listesi</div>
                <div onClick={()=>{setEkleMenu(false);setEkleModal("takas");setHisse("");}}
                  style={{padding:"9px 14px",cursor:"pointer",color:C.yellow,fontSize:11}}>Takas Verisi</div>
              </div>
            )}
          </div>
          <button onClick={()=>setPanelAcik(v=>!v)} style={btn(panelAcik,C.blue)}>PANEL</button>
        </div>
      </div>

      {/* VERİ UYGULA */}
      {veriBox&&(
        <div style={{background:C.bg0,borderBottom:`2px solid ${C.green}`,padding:"10px 16px",flexShrink:0}}>
          <div style={{color:C.green,fontSize:10,fontWeight:700,marginBottom:5}}>
            VERİ UYGULA — aktif liste: [{listeKfg.label}]
            <span style={{color:C.dim,fontSize:9,marginLeft:8}}>Farklı liste için JSON'a "liste":"5KTSI" ekleyin</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <textarea value={veriInput} onChange={e=>setVeriInput(e.target.value)}
              placeholder={'{"tip":"tarama","liste":"5K2A","donem":"1G","veri":[...]}'}
              style={{flex:1,background:C.bg1,border:`1px solid ${C.border}`,color:C.text,padding:"8px 10px",borderRadius:4,fontSize:11,fontFamily:"inherit",height:72,resize:"vertical",outline:"none"}}/>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <button onClick={veriUygula} style={{background:C.green,color:"#fff",border:"none",borderRadius:4,padding:"8px 16px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>UYGULA</button>
              <button onClick={()=>{setVeriBox(false);setVeriInput("");}} style={{background:"transparent",color:C.dim,border:`1px solid ${C.border}`,borderRadius:4,padding:"8px 16px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* EKLE MODAL */}
      {ekleModal&&(
        <div style={{background:C.bg0,borderBottom:`1px solid ${C.border}`,padding:"9px 16px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{color:listeKfg.renk,fontWeight:700,fontSize:11}}>[{listeKfg.label}] {ekleModal==="tarama"?"TARAMA":"TAKAS"}</span>
            {ekleModal==="takas"&&(
              <input value={hisse} onChange={e=>setHisse(e.target.value.toUpperCase())}
                placeholder="Hisse kodu"
                style={{background:C.bg1,border:`1px solid ${C.border}`,color:C.text,padding:"4px 9px",borderRadius:4,fontSize:11,fontFamily:"inherit",width:130,outline:"none"}}/>
            )}
            <span style={{color:C.dim,fontSize:9}}>Dönem:</span>
            {["1G","1H","1AY"].map(d=><button key={d} onClick={()=>setDonemEkle(d)} style={btn(donemEkle===d)}>{d}</button>)}
            <button onClick={()=>{logEkle(`Claude'a ilet: "${ekleModal==="tarama"?`tarama veri ${aktifListe} ${donemEkle}`:`takas veri ${aktifListe} ${hisse||"SEMBOL"} ${donemEkle}`}"`);setEkleModal(null);}}
              style={{background:C.teal,color:"#060b18",border:"none",borderRadius:4,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Claude'a Bildir ↗
            </button>
            <button onClick={()=>setEkleModal(null)} style={{background:"transparent",color:C.dim,border:"none",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>iptal</button>
          </div>
          <div style={{marginTop:3,color:C.dim,fontSize:9}}>Claude konuşmasına ekran görüntüsü ekleyip gönderin → JSON alın → VERİ UYGULA'ya yapıştırın.</div>
        </div>
      )}

      {/* PANEL DRAWER */}
      {panelAcik&&(
        <div style={{background:C.bg0,borderBottom:`2px solid ${C.border}`,padding:"10px 16px",flexShrink:0}}>
          <div style={{color:C.dim,fontSize:9,marginBottom:6}}>PANEL — JSON Format Referansı</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {[
              {l:"Tarama 5K2A",r:C.teal,j:'{"tip":"tarama","liste":"5K2A","donem":"1G","veri":[{"sembol":"MOGAN","teknik":{...}}]}'},
              {l:"Tarama 5KTSI",r:C.blue,j:'{"tip":"tarama","liste":"5KTSI","donem":"1G","veri":[{"sembol":"KORDS","teknik":{...}}]}'},
              {l:"Tarama 5KCLAU",r:C.purple,j:'{"tip":"tarama","liste":"5KCLAU","donem":"1G","veri":[{"sembol":"HATSN","teknik":{...}}]}'},
              {l:"Takas",r:C.yellow,j:'{"tip":"takas","liste":"5K2A","sembol":"MOGAN","tarih":"19.08.2026","donem":"1G","veri":{...}}'},
              {l:"Sıfırla",r:C.red,j:'{"tip":"sifirla","liste":"5K2A","sembol":"MOGAN"}'},
            ].map(({l,r,j})=>(
              <div key={l} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:4,padding:"6px 10px",maxWidth:320}}>
                <div style={{color:r,fontSize:9,fontWeight:700,marginBottom:2}}>{l}</div>
                <div style={{color:C.dim,fontSize:8}}>{j}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIRALAMA + DÖNEM BARI */}
      <div style={{background:C.bg0,borderBottom:`1px solid ${C.border}`,padding:"6px 16px",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",flexShrink:0}}>
        <span style={{color:C.dim,fontSize:9}}>SIRALA</span>
        {[
          {v:"varsayilan",l:"VARSAYILAN",c:C.teal},
          {v:"teknik",l:"TEKNİK",c:C.teal},
          {v:"takas",l:"TAKAS",c:C.teal},
          {v:"birlesik",l:"BİRLEŞİK",c:C.teal},
          {v:"canli",l:"CANLI",c:C.orange},
          {v:"trend",l:"TREND",c:C.yellow},
        ].map(({v,l,c})=>(
          <button key={v} onClick={()=>setSiralama(v)} style={btn(siralama===v,c)}>{l}</button>
        ))}
        <div style={{width:1,height:14,background:C.border,margin:"0 4px"}}/>
        <span style={{color:C.dim,fontSize:9}}>DÖNEM</span>
        {["1G","1H","1AY"].map(d=>(
          <button key={d} onClick={()=>setDonem(d)} style={btn(donem===d)}>{d}</button>
        ))}
        <span style={{marginLeft:"auto",color:C.dim,fontSize:9}}>
          {liste.length} kayıt · {listeKfg.label}
          {trendGorunum&&<span style={{color:C.yellow,marginLeft:6}}>↕ Takas trend değişimi</span>}
          {siralama==="canli"&&<span style={{color:C.orange,marginLeft:6}}>● En son güncellenen üstte</span>}
        </span>
      </div>

      {/* TABLO */}
      <div style={{overflowX:"auto",flex:1}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr>
              <th style={th}>SEMBOL</th>
              {trendGorunum&&<th style={th}>DÖNEM</th>}
              {sutunlar.map(s=><th key={s.key} style={th}>{s.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {liste.length===0?(
              <tr><td colSpan={sutunlar.length+2} style={{...td,color:C.dim,textAlign:"center",padding:60}}>
                {trendGorunum?"Trend verisi yok — en az 2 takas girişi olan semboller görünür":`[${listeKfg.label}] Veri yok — + EKLE ile başlayın`}
              </td></tr>
            ):liste.map((s,i)=>{
              const canliZaman=s._zaman?new Date(s._zaman).toLocaleString("tr-TR"):"—";
              return(
                <tr key={s.sembol||i} style={{background:i%2===0?C.bg1:C.bg0}}>
                  <td style={{...td,color:C.bright,fontWeight:700,fontSize:13}}>
                    {s.sembol||"?"}
                    {siralama==="canli"&&<div style={{color:C.dim,fontSize:8}}>{canliZaman}</div>}
                  </td>
                  {trendGorunum&&<td style={{...td,color:C.dim,fontSize:10}}>{s.donem||"—"}</td>}
                  {sutunlar.map(sut=>{
                    let val=s[sut.key];
                    if(sut.key==="trendFark"){
                      const f=s._tFark;
                      if(f===null||f===undefined)return <td key={sut.key} style={td}><span style={{color:C.dim}}>—</span></td>;
                      const renk=f>0?C.teal:f<0?C.red:C.muted;
                      return <td key={sut.key} style={td}><span style={{color:renk,fontWeight:700}}>{f>0?"+":""}{f}</span></td>;
                    }
                    return <td key={sut.key} style={td}><Hucre tip={sut.tip} val={val} sutun={sut} s={s}/></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* LOG */}
      <div style={{background:C.bg0,borderTop:`1px solid ${C.border}`,padding:"3px 16px",maxHeight:50,overflowY:"auto",flexShrink:0}}>
        {log.map((m,i)=>(
          <div key={i} style={{fontSize:9,color:i===0?C.muted:C.dim,padding:"1px 0",borderBottom:`1px solid ${C.border2}`}}>
            <span style={{color:C.border,marginRight:5}}>›</span>{m}
          </div>
        ))}
      </div>
    </div>
  );
}
