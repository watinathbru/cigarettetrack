import { useState, useEffect, useRef } from "react";

// ── helpers ───────────────────────────────────────────────────────────────────
const today    = () => new Date().toISOString().slice(0,10);
const fmtShort = (d) => new Date(d+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
const msm      = (t) => { if(!t)return null; const[h,m]=t.split(":").map(Number); return h*60+m; };
const fmtDur   = (m) => { if(m===null||m===undefined||isNaN(m))return"–"; if(m<60)return`${m} min`; return`${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`; };
const nowHHMM  = () => { const n=new Date(); return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`; };

const SK    = "smk_tracker_v6";
const SET_K = "smk_settings_v6";
const loadData     = () => { try{ return JSON.parse(localStorage.getItem(SK))||{}; }catch{return{};} };
const loadSettings = () => { try{ const s=JSON.parse(localStorage.getItem(SET_K)); return s?{...defSettings(),...s}:defSettings(); }catch{return defSettings();} };
const saveData     = (d) => localStorage.setItem(SK, JSON.stringify(d));
const saveSettings = (s) => localStorage.setItem(SET_K, JSON.stringify(s));
const defDay       = () => ({ cigs:[], cigFactors:{}, cigCravings:{}, wakeUp:"", lunch:"", dinner:"", bedtime:"", goal:10, note:"", difficulty:null });
const defSettings  = () => ({
  defaultGoal:10, name:"", currency:"€", pricePerPack:12, cigsPerPack:20, usualCigs:20,
  darkMode:false,
  showFactors:true, showCravings:true, showEvents:true,
});

const getBg = (count, goal, dark) => {
  if(dark) return "linear-gradient(135deg,#1a2030,#0f1a28)";
  const r=goal>0?Math.min(count/goal,1):0;
  return `linear-gradient(135deg,rgb(${Math.round(180+r*70)},${Math.round(220-r*60)},${Math.round(180-r*60)}),rgb(${Math.round(160+r*80)},${Math.round(210-r*80)},${Math.round(200-r*80)}))`;
};

// ── FACTORS ───────────────────────────────────────────────────────────────────
const FACTORS = [
  { id:"cafe",      emoji:"☕", label:"Café"       },
  { id:"stress",    emoji:"😰", label:"Stress"     },
  { id:"alcool",    emoji:"🍺", label:"Alcool"     },
  { id:"travail",   emoji:"💼", label:"Travail"    },
  { id:"ennui",     emoji:"😴", label:"Ennui"      },
  { id:"repas",     emoji:"🍽️", label:"Repas"      },
  { id:"social",    emoji:"🎉", label:"Social"     },
  { id:"sport",     emoji:"🏃", label:"Sport"      },
  { id:"ecran",     emoji:"📱", label:"Écran"      },
  { id:"pause",     emoji:"⏸️", label:"Pause"      },
  { id:"fatigue",   emoji:"😓", label:"Fatigue"    },
  { id:"motiv",     emoji:"💪", label:"Motivation" },
  { id:"conduite",  emoji:"🚗", label:"Conduite"   },
  { id:"tel",       emoji:"📞", label:"Téléphone"  },
  { id:"colere",    emoji:"😡", label:"Colère"     },
  { id:"reveil",    emoji:"⏰", label:"Réveil"     },
  { id:"attente",   emoji:"⏳", label:"Attente"    },
  { id:"digestion", emoji:"🫃", label:"Digestion"  },
  { id:"autre",     emoji:"🔘", label:"Autre"      },
];
const factorById = Object.fromEntries(FACTORS.map(f=>[f.id,f]));

// ── ICONS ─────────────────────────────────────────────────────────────────────
const Icon = ({name,size=20,color="currentColor"}) => {
  const icons = {
    moon:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    target:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    clock:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    user:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    coin:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2m-4-6h8"/></svg>,
    brain:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.07-4.6A3 3 0 1 1 9.5 2M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.07-4.6A3 3 0 1 0 14.5 2"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    sun:      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>,
    utensils: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
    home:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    plus:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    trash:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    chart:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg>,
    trophy:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>,
    savings:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M18 2v4h4"/></svg>,
    zoomin:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
    zoomout:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
    edit:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  };
  return icons[name]||null;
};

// ── Stable controlled input — fixes keyboard dismiss bug ──────────────────────
const StableInput = ({value, onCommit, type="text", min, max, placeholder="", style={}}) => {
  const [local, setLocal] = useState(String(value??''));
  const prevValue = useRef(value);
  useEffect(() => {
    if(prevValue.current !== value) { setLocal(String(value??'')); prevValue.current = value; }
  }, [value]);
  return (
    <input type={type} value={local} min={min} max={max} placeholder={placeholder}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { prevValue.current = local; onCommit(local); }}
      style={style}
    />
  );
};

// ── Toggle switch ─────────────────────────────────────────────────────────────
const Toggle = ({val, onChange, label, desc, dark}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${dark?"rgba(255,255,255,0.07)":"rgba(200,180,170,0.15)"}`}}>
    <div>
      <div style={{fontSize:14,color:dark?"#dde8e2":"#5a3a30",fontWeight:600}}>{label}</div>
      {desc&&<div style={{fontSize:11,color:dark?"#7a9a8a":"#a07868",marginTop:2}}>{desc}</div>}
    </div>
    <div onClick={()=>onChange(!val)} style={{width:48,height:26,borderRadius:99,background:val?"#4ade80":"rgba(200,180,170,0.4)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0,marginLeft:12}}>
      <div style={{position:"absolute",top:3,left:val?22:3,width:20,height:20,borderRadius:"50%",background:"white",boxShadow:"0 1px 4px rgba(0,0,0,0.25)",transition:"left 0.2s"}}/>
    </div>
  </div>
);

// ── Card & Label ──────────────────────────────────────────────────────────────
const Card = ({children,style={},dark=false}) => (
  <div style={{background:dark?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.62)",backdropFilter:"blur(12px)",borderRadius:20,padding:20,boxShadow:"0 4px 24px rgba(0,0,0,0.07)",border:dark?"1px solid rgba(255,255,255,0.09)":"1px solid rgba(255,255,255,0.8)",marginBottom:14,...style}}>
    {children}
  </div>
);
const Lbl = ({children,dark=false}) => (
  <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:dark?"#7ab09a":"#a0857a",textTransform:"uppercase",marginBottom:8}}>
    {children}
  </div>
);

// ── Event time modal ──────────────────────────────────────────────────────────
const EventModal = ({label, emoji, currentTime, onConfirm, onCancel}) => {
  const [time, setTime] = useState(currentTime||nowHHMM());
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(80,50,40,0.45)",backdropFilter:"blur(6px)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onCancel}>
      <div style={{background:"rgba(255,253,250,0.98)",borderRadius:"24px 24px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:"rgba(200,180,170,0.5)",borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{fontSize:28,textAlign:"center",marginBottom:4}}>{emoji}</div>
        <div style={{fontSize:16,fontWeight:800,color:"#5a3a30",marginBottom:16,textAlign:"center"}}>{label}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:22}}>
          <span style={{fontSize:13,color:"#a07868"}}>Heure :</span>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)}
            style={{border:"1.5px solid rgba(200,180,170,0.4)",background:"rgba(255,255,255,0.9)",borderRadius:12,padding:"8px 16px",fontSize:20,fontFamily:"'DM Sans',sans-serif",color:"#5a4a40",outline:"none"}}/>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"12px",borderRadius:14,border:"none",background:"rgba(200,180,170,0.2)",fontSize:14,fontWeight:600,color:"#a07868",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
          <button onClick={()=>onConfirm(time)} style={{flex:2,padding:"12px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#86efac,#4ade80)",fontSize:15,fontWeight:700,color:"#1a4a30",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✓ Confirmer</button>
        </div>
      </div>
    </div>
  );
};

// ── Factor / Cig Modal ────────────────────────────────────────────────────────
const FactorModal = ({onConfirm, onCancel, settings}) => {
  const [selected, setSelected] = useState(null);
  const [craving, setCraving]   = useState(null);
  const [customTime, setCustomTime] = useState(nowHHMM());
  const [useCustom, setUseCustom]   = useState(false);
  const cravingLabels = ["","Légère","Modérée","Forte","Très forte","Irrésistible"];
  const dark = false;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(80,50,40,0.45)",backdropFilter:"blur(6px)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onCancel}>
      <div style={{background:"rgba(255,253,250,0.98)",borderRadius:"24px 24px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:480,boxShadow:"0 -8px 40px rgba(0,0,0,0.15)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:"rgba(200,180,170,0.5)",borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{fontSize:16,fontWeight:800,color:"#5a3a30",marginBottom:4,textAlign:"center"}}>Nouvelle cigarette</div>
        <div style={{fontSize:12,color:"#a07868",textAlign:"center",marginBottom:18}}>Réponds à ces questions pour mieux analyser tes habitudes</div>

        {settings.showCravings&&<div style={{marginBottom:16,background:"rgba(196,181,253,0.15)",borderRadius:14,padding:"12px 14px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5a3a90",marginBottom:10}}>🌡️ Note d'envie</div>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:6}}>
            {[1,2,3,4,5].map(n=>(
              <button key={n} onClick={()=>setCraving(craving===n?null:n)}
                style={{width:46,height:46,borderRadius:12,border:"2px solid",borderColor:craving&&craving>=n?"#8b5cf6":"rgba(200,180,170,0.3)",background:craving&&craving>=n?"rgba(196,181,253,0.35)":"rgba(255,255,255,0.5)",fontSize:18,cursor:"pointer",transition:"all 0.15s",fontWeight:700,color:craving&&craving>=n?"#6d28d9":"#a07868"}}>
                {n}
              </button>
            ))}
          </div>
          <div style={{textAlign:"center",fontSize:11,color:"#7a5a90",fontWeight:600,minHeight:16}}>{craving?cravingLabels[craving]:"Non renseigné"}</div>
        </div>}

        {settings.showFactors&&<div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5a3a30",marginBottom:10}}>🔍 Facteur déclenchant <span style={{fontSize:11,fontWeight:400,color:"#a07868"}}>(optionnel)</span></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
            {FACTORS.map(f=>(
              <button key={f.id} onClick={()=>setSelected(selected===f.id?null:f.id)}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"9px 4px",borderRadius:14,border:selected===f.id?"2.5px solid #fb7185":"2px solid rgba(200,180,170,0.25)",background:selected===f.id?"rgba(252,165,165,0.2)":"rgba(255,255,255,0.7)",cursor:"pointer",transition:"all 0.15s"}}>
                <span style={{fontSize:20}}>{f.emoji}</span>
                <span style={{fontSize:9,fontWeight:600,color:selected===f.id?"#c05040":"#a07868",textAlign:"center",lineHeight:1.2}}>{f.label}</span>
              </button>
            ))}
          </div>
        </div>}

        <div style={{marginBottom:16,background:"rgba(253,230,138,0.2)",borderRadius:14,padding:"12px 14px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:useCustom?10:0}}>
            <span style={{fontSize:13,color:"#7a6030",fontWeight:600}}>⏰ Cigarette oubliée ?</span>
            <button onClick={()=>setUseCustom(u=>!u)}
              style={{background:useCustom?"rgba(253,230,138,0.6)":"rgba(255,255,255,0.7)",border:`1.5px solid ${useCustom?"#f59e0b":"rgba(200,180,170,0.3)"}`,borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:700,color:useCustom?"#7a6030":"#a07868",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              {useCustom?"✓ Activé":"Changer l'heure"}
            </button>
          </div>
          {useCustom&&<div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,color:"#a07868"}}>Heure réelle :</span>
            <input type="time" value={customTime} onChange={e=>setCustomTime(e.target.value)}
              style={{border:"1.5px solid rgba(200,180,170,0.4)",background:"rgba(255,255,255,0.8)",borderRadius:10,padding:"6px 10px",fontSize:15,fontFamily:"'DM Sans',sans-serif",color:"#5a4a40",outline:"none"}}/>
          </div>}
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{flex:1,padding:"12px",borderRadius:14,border:"none",background:"rgba(200,180,170,0.2)",fontSize:14,fontWeight:600,color:"#a07868",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
          <button onClick={()=>onConfirm(selected,useCustom?customTime:null,craving)}
            style={{flex:2,padding:"12px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#fca5a5,#fb7185)",fontSize:15,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 4px 14px rgba(251,113,133,0.35)"}}>
            🚬 Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Timeline with zoom ────────────────────────────────────────────────────────
const TimelineBar = ({dayData, dark=false}) => {
  const [tip, setTip]   = useState(null);
  const [zoom, setZoom] = useState(1);   // 1=24h, 2=12h, 4=6h
  const [offset, setOff]= useState(0);  // visible window start in hours

  const windowH = 24/zoom;
  const startH  = Math.min(offset, 24-windowH);

  const pctInView = (t) => {
    const m=msm(t); if(m===null)return null;
    const h=m/60;
    if(h<startH||h>startH+windowH)return null;
    return ((h-startH)/windowH)*100;
  };

  const evs = [];
  if(dayData.wakeUp)  evs.push({p:pctInView(dayData.wakeUp), c:"#86efac",l:"Lever",    t:dayData.wakeUp, sz:14});
  if(dayData.lunch)   evs.push({p:pctInView(dayData.lunch),  c:"#fcd34d",l:"Déjeuner", t:dayData.lunch,  sz:14});
  if(dayData.dinner)  evs.push({p:pctInView(dayData.dinner), c:"#fb923c",l:"Dîner",    t:dayData.dinner, sz:14});
  if(dayData.bedtime) evs.push({p:pctInView(dayData.bedtime),c:"#c4b5fd",l:"Coucher",  t:dayData.bedtime,sz:14});
  dayData.cigs.forEach((t,i)=>{
    const p2=pctInView(t);
    if(p2!==null){
      const fid=(dayData.cigFactors||{})[i];
      evs.push({p:p2,c:"#fca5a5",l:`Cig n°${i+1}${fid?` (${factorById[fid]?.label})`:""}`,t,sz:11,cig:true});
    }
  });

  const tickStep = zoom===1?6:zoom===2?3:1;
  const ticks=[];
  for(let h=Math.ceil(startH/tickStep)*tickStep;h<=startH+windowH+0.01;h+=tickStep){
    if(h>=0&&h<=24)ticks.push(Math.round(h));
  }

  const pan = (dir) => setOff(o=>Math.max(0,Math.min(24-windowH, o+dir*(windowH/3))));
  const zoomIn  = () => { if(zoom<4)setZoom(z=>z*2); };
  const zoomOut = () => { if(zoom>1){setZoom(z=>z/2); if(zoom===2)setOff(0);} };

  const tc = dark?"#7ab09a":"#a07868";

  return (
    <div style={{padding:"0 4px",userSelect:"none"}}>
      {/* Legend */}
      <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
        {[["Lever","#86efac"],["Déjeuner","#fcd34d"],["Dîner","#fb923c"],["Coucher","#c4b5fd"],["Cigarette","#fca5a5"]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:3}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:c}}/>
            <span style={{fontSize:9,color:tc}}>{l}</span>
          </div>
        ))}
      </div>
      {/* Zoom controls */}
      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:5,marginBottom:6}}>
        {zoom>1&&<button onClick={()=>pan(-1)} style={{background:"rgba(255,255,255,0.4)",border:"none",borderRadius:8,padding:"3px 8px",fontSize:13,cursor:"pointer",color:"#7a5a50",lineHeight:1}}>◀</button>}
        <button onClick={zoomOut} disabled={zoom===1} style={{background:zoom>1?"rgba(200,130,110,0.2)":"rgba(200,180,170,0.1)",border:"none",borderRadius:8,padding:"4px 8px",cursor:zoom>1?"pointer":"default",opacity:zoom===1?0.4:1}}>
          <Icon name="zoomout" size={13} color="#7a5a50"/>
        </button>
        <span style={{fontSize:10,color:tc,fontWeight:700,minWidth:28,textAlign:"center"}}>{zoom===1?"24h":zoom===2?"12h":"6h"}</span>
        <button onClick={zoomIn} disabled={zoom===4} style={{background:zoom<4?"rgba(200,130,110,0.2)":"rgba(200,180,170,0.1)",border:"none",borderRadius:8,padding:"4px 8px",cursor:zoom<4?"pointer":"default",opacity:zoom===4?0.4:1}}>
          <Icon name="zoomin" size={13} color="#7a5a50"/>
        </button>
        {zoom>1&&<button onClick={()=>pan(1)} style={{background:"rgba(255,255,255,0.4)",border:"none",borderRadius:8,padding:"3px 8px",fontSize:13,cursor:"pointer",color:"#7a5a50",lineHeight:1}}>▶</button>}
      </div>
      {/* Bar */}
      <div style={{position:"relative",height:54}} onClick={()=>setTip(null)}>
        <div style={{position:"absolute",top:"50%",left:0,right:0,height:8,transform:"translateY(-50%)",background:"rgba(255,255,255,0.35)",borderRadius:99,boxShadow:"inset 0 2px 6px rgba(0,0,0,0.08)"}}/>
        {/* Night zones */}
        {(()=>{
          const wp=dayData.wakeUp?(msm(dayData.wakeUp)/60-startH)/windowH*100:null;
          const bp=dayData.bedtime?(msm(dayData.bedtime)/60-startH)/windowH*100:null;
          return <>
            {wp!==null&&<div style={{position:"absolute",top:"50%",left:0,width:`${Math.min(Math.max(wp,0),100)}%`,height:8,transform:"translateY(-50%)",background:"rgba(100,100,160,0.18)",borderRadius:"99px 0 0 99px",pointerEvents:"none"}}/>}
            {bp!==null&&<div style={{position:"absolute",top:"50%",left:`${Math.min(Math.max(bp,0),100)}%`,right:0,height:8,transform:"translateY(-50%)",background:"rgba(100,100,160,0.18)",borderRadius:"0 99px 99px 0",pointerEvents:"none"}}/>}
          </>;
        })()}
        {ticks.map(h=>(
          <div key={h} style={{position:"absolute",left:`${((h-startH)/windowH)*100}%`,top:"50%",transform:"translate(-50%,-50%)",width:1,height:18,background:"rgba(0,0,0,0.1)"}}/>
        ))}
        {tip&&<div style={{position:"absolute",bottom:"calc(100% + 6px)",left:`${Math.min(Math.max(tip.x,8),88)}%`,transform:"translateX(-50%)",background:"rgba(70,40,30,0.93)",color:"white",borderRadius:10,padding:"5px 12px",fontSize:12,fontWeight:700,whiteSpace:"nowrap",zIndex:20,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,0.25)"}}>
          {tip.l} · <span style={{fontFamily:"monospace"}}>{tip.t}</span>
          <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"5px solid rgba(70,40,30,0.93)"}}/>
        </div>}
        {evs.map((ev,i)=>ev.p!==null&&(
          <div key={i} onClick={e=>{e.stopPropagation();setTip(t=>t&&t.l+t.t===ev.l+ev.t?null:{...ev,x:ev.p});}}
            style={{position:"absolute",left:`${ev.p}%`,top:"50%",transform:"translate(-50%,-50%)",width:ev.sz,height:ev.sz,borderRadius:"50%",background:ev.c,border:`${ev.cig?1.5:2}px solid white`,boxShadow:tip&&tip.l===ev.l&&tip.t===ev.t?"0 0 0 3px rgba(90,58,48,0.35),0 3px 10px rgba(0,0,0,0.2)":"0 2px 6px rgba(0,0,0,0.15)",cursor:"pointer",zIndex:ev.cig?2:3}}/>
        ))}
      </div>
      {/* Tick labels */}
      <div style={{position:"relative",height:14,marginTop:2}}>
        {ticks.map(h=>(
          <div key={h} style={{position:"absolute",left:`${((h-startH)/windowH)*100}%`,transform:"translateX(-50%)",fontSize:9,color:dark?"#6a9a8a":"#bbb",fontFamily:"monospace"}}>{h}h</div>
        ))}
      </div>
    </div>
  );
};

// ── DayStatsPanel ─────────────────────────────────────────────────────────────
const DayStatsPanel = ({dayData, dark=false}) => {
  const d=dayData;
  if(!d||d.cigs.length===0) return <div style={{textAlign:"center",color:dark?"#6a9a8a":"#c4a882",fontSize:14,padding:"16px 0"}}>Aucune donnée pour ce jour 🌿</div>;
  const cm=d.cigs.map(msm).filter(m=>m!==null).sort((a,b)=>a-b);
  const ivs=[]; for(let i=1;i<cm.length;i++) ivs.push(cm[i]-cm[i-1]);
  const avg=arr=>arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):null;
  const da=(ref)=>{ if(!ref)return null; const rm=msm(ref); const nx=cm.filter(m=>m>=rm)[0]; return nx!==undefined?nx-rm:null; };
  const goal=d.goal||10, ratio=Math.min(d.cigs.length/goal,1);
  const gc=ratio<0.7?"#3a7a50":ratio<1?"#a07020":"#c05040";
  const rowBdr=dark?"rgba(255,255,255,0.07)":"rgba(200,180,170,0.15)";
  const SR=({e,l,v,c="#5a3a30"})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${rowBdr}`}}>
      <span style={{fontSize:13,color:dark?"#9ab0a8":"#7a6a60"}}>{e} {l}</span>
      <span style={{fontSize:14,fontWeight:700,color:c}}>{v}</span>
    </div>
  );
  const cf=d.cigFactors||{};
  const factorCounts={};
  Object.values(cf).forEach(fid=>{ if(fid)factorCounts[fid]=(factorCounts[fid]||0)+1; });
  const sortedFactors=Object.entries(factorCounts).sort((a,b)=>b[1]-a[1]);
  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:12}}>
        <div style={{flex:1,background:"rgba(252,165,165,0.2)",borderRadius:14,padding:"12px",textAlign:"center"}}>
          <div style={{fontSize:36,fontWeight:900,color:"#5a3a30",lineHeight:1}}>{d.cigs.length}</div>
          <div style={{fontSize:11,color:"#a07868"}}>cigarettes</div>
        </div>
        <div style={{flex:1,background:"rgba(134,239,172,0.2)",borderRadius:14,padding:"12px",textAlign:"center"}}>
          <div style={{fontSize:36,fontWeight:900,color:gc,lineHeight:1}}>{goal}</div>
          <div style={{fontSize:11,color:"#a07868"}}>objectif</div>
        </div>
        {avg(ivs)!==null&&<div style={{flex:1,background:"rgba(196,181,253,0.2)",borderRadius:14,padding:"12px",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#5a3a90",lineHeight:1}}>{fmtDur(avg(ivs))}</div>
          <div style={{fontSize:11,color:"#a07868"}}>intervalle moy.</div>
        </div>}
      </div>
      {ivs.length>0&&<div style={{background:"rgba(255,255,255,0.5)",borderRadius:14,padding:"10px 14px",marginBottom:10}}>
        <Lbl>⏱️ Intervalles</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {[["Moyen",fmtDur(avg(ivs)),"#5a3a90"],["Min",fmtDur(Math.min(...ivs)),"#3a7a50"],["Max",fmtDur(Math.max(...ivs)),"#c05040"]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:10,color:"#a07868"}}>{l}</div></div>
          ))}
        </div>
      </div>}
      <SR e="☀️" l="1ère cig après lever" v={fmtDur(da(d.wakeUp))} c="#5a3a30"/>
      <SR e="🍽️" l="1ère cig après déjeuner" v={fmtDur(da(d.lunch))} c="#5a3a30"/>
      <SR e="🌙" l="1ère cig après dîner" v={fmtDur(da(d.dinner))} c="#5a3a30"/>
      {sortedFactors.length>0&&<div style={{background:"rgba(255,255,255,0.5)",borderRadius:14,padding:"10px 14px",marginTop:10}}>
        <Lbl>🔍 Facteurs du jour</Lbl>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {sortedFactors.map(([fid,count])=>{const f=factorById[fid];return f&&(
            <div key={fid} style={{display:"flex",alignItems:"center",gap:5,background:"rgba(252,165,165,0.2)",borderRadius:99,padding:"5px 12px",fontSize:13,color:"#8a3a30",fontWeight:600}}>
              <span>{f.emoji}</span><span>{f.label}</span><span style={{background:"rgba(252,165,165,0.4)",borderRadius:99,padding:"1px 7px",fontSize:11}}>{count}×</span>
            </div>
          );})}
        </div>
      </div>}
      {d.note&&<div style={{marginTop:10,background:"rgba(253,230,138,0.3)",borderRadius:12,padding:"8px 14px",fontSize:13,color:"#7a6030"}}>📝 {d.note}</div>}
    </div>
  );
};

// ── Chrono ────────────────────────────────────────────────────────────────────
const LastCigChrono = ({cigs}) => {
  const [elapsed,setElapsed] = useState(0);
  const lastRef = useRef(null);
  if(cigs.length>0){
    const [h,m]=cigs[cigs.length-1].split(":").map(Number);
    const n=new Date();
    lastRef.current=new Date(n.getFullYear(),n.getMonth(),n.getDate(),h,m,0);
  } else { lastRef.current=null; }
  useEffect(()=>{
    if(!lastRef.current)return;
    const tick=()=>setElapsed(Math.max(0,Math.floor((Date.now()-lastRef.current.getTime())/1000)));
    tick(); const id=setInterval(tick,60000); return()=>clearInterval(id);
  },[cigs.length>0?cigs[cigs.length-1]:null]);

  if(!cigs.length) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,margin:"14px 0 4px"}}>
      <div style={{background:"rgba(134,239,172,0.25)",borderRadius:99,padding:"8px 20px",display:"inline-flex",alignItems:"center",gap:8}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#86efac"}}/>
        <span style={{fontSize:13,fontWeight:700,color:"#3a7a50"}}>Aucune cigarette aujourd'hui 🌿</span>
      </div>
    </div>
  );
  const h=Math.floor(elapsed/3600),m=Math.floor((elapsed%3600)/60);
  const urg=elapsed<1800?"#f87171":elapsed<3600?"#fbbf24":"#4ade80";
  const urgBg=elapsed<1800?"rgba(248,113,113,0.12)":elapsed<3600?"rgba(251,191,36,0.12)":"rgba(74,222,128,0.12)";
  const label=h>0?`${h}h ${String(m).padStart(2,"0")}m`:`${m}m`;
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",margin:"14px 0 4px"}}>
      <div style={{background:urgBg,borderRadius:99,padding:"10px 24px",display:"inline-flex",alignItems:"center",gap:12,border:`1.5px solid ${urg}40`}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:urg,boxShadow:`0 0 8px ${urg}`}}/>
        <div>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#a0857a",textTransform:"uppercase",marginBottom:1}}>Depuis la dernière</div>
          <div style={{fontSize:26,fontWeight:900,color:urg,fontFamily:"monospace",lineHeight:1}}>{label}</div>
        </div>
      </div>
    </div>
  );
};

// ── Date range picker ─────────────────────────────────────────────────────────
const DateRangePicker = ({startDate, endDate, onApply}) => {
  const [s,setS]=useState(startDate||"");
  const [e,setE]=useState(endDate||"");
  const inp={border:"1.5px solid rgba(200,180,170,0.4)",background:"rgba(255,255,255,0.85)",borderRadius:10,padding:"7px 10px",fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#5a4a40",outline:"none"};
  return (
    <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"center",marginTop:6}}>
      <input type="date" value={s} max={e||today()} onChange={ev=>setS(ev.target.value)} style={inp}/>
      <span style={{color:"#a07868",fontSize:14,fontWeight:700}}>→</span>
      <input type="date" value={e} min={s} max={today()} onChange={ev=>setE(ev.target.value)} style={inp}/>
      <button onClick={()=>onApply(s,e)} disabled={!s||!e}
        style={{background:"linear-gradient(135deg,#fca5a5,#fb7185)",border:"none",borderRadius:10,padding:"8px 18px",fontSize:13,fontWeight:700,color:"white",cursor:s&&e?"pointer":"default",opacity:s&&e?1:0.5,fontFamily:"'DM Sans',sans-serif"}}>
        OK
      </button>
    </div>
  );
};

// ── Period buttons + custom range hook ───────────────────────────────────────
const usePeriodFilter = (data) => {
  const [period,setPeriodRaw]  = useState("week");
  const [customStart,setCS]    = useState("");
  const [customEnd,  setCE]    = useState("");
  const [showRange,  setRange] = useState(false);

  const setPeriod = (v) => { setPeriodRaw(v); if(v!=="custom")setRange(false); else setRange(true); };
  const applyRange = (s,e) => { setCS(s); setCE(e); setRange(false); };

  const allKeys=Object.keys(data).sort();
  let keys;
  if(period==="today"){ keys=[today()].filter(k=>data[k]); }
  else if(period==="custom"){ keys=allKeys.filter(k=>customStart&&customEnd&&k>=customStart&&k<=customEnd); }
  else {
    const now=new Date(), cutoff=new Date(now);
    if(period==="week") cutoff.setDate(now.getDate()-7);
    else cutoff.setDate(now.getDate()-30);
    keys=allKeys.filter(k=>k>=cutoff.toISOString().slice(0,10));
  }

  const PeriodBar = ({showToday=true}) => {
    const btn=(v,l)=>(
      <button onClick={()=>setPeriod(v)}
        style={{background:period===v?"rgba(200,130,110,0.4)":"rgba(255,255,255,0.5)",border:period===v?"2px solid rgba(200,130,110,0.6)":"2px solid transparent",borderRadius:99,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#5a3a30",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
        {l}
      </button>
    );
    return (
      <div style={{marginBottom:8}}>
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap",marginBottom:6}}>
          {showToday&&btn("today","Aujourd'hui")}
          {btn("week","7 jours")}
          {btn("month","30 jours")}
          {btn("custom","📅 Période")}
        </div>
        {showRange&&<DateRangePicker startDate={customStart} endDate={customEnd} onApply={applyRange}/>}
      </div>
    );
  };

  return {period, keys, PeriodBar, customStart, customEnd};
};

// ══════════════════════════════════════════════════════════════════════════════
// HOME TAB
// ══════════════════════════════════════════════════════════════════════════════
const HomeTab = ({data,setData,settings}) => {
  const [showModal,  setShowModal]  = useState(false);
  const [eventModal, setEventModal] = useState(null); // {key,label,emoji}
  const dark = settings.darkMode||false;
  const dk   = today();
  const day  = data[dk]||defDay();

  const upd = (p) => { const n={...data,[dk]:{...(data[dk]||defDay()),...p}}; setData(n); saveData(n); };

  // Badge toast
  const [newBadge,setNewBadge]   = useState(null);
  const prevUnlocked = useRef(new Set(BADGES.filter(b=>b.check(data)).map(b=>b.id)));
  useEffect(()=>{
    const now=new Set(BADGES.filter(b=>b.check(data)).map(b=>b.id));
    for(const id of now){ if(!prevUnlocked.current.has(id)){ const b=BADGES.find(x=>x.id===id); setNewBadge(b); prevUnlocked.current.add(id); setTimeout(()=>setNewBadge(null),4000); break; } }
  },[data]);

  const confirmCig = (factorId,customTime,craving) => {
    const t=customTime||nowHHMM();
    const newCigs=[...day.cigs,t].sort();
    const idx=newCigs.lastIndexOf(t);
    const oldF={...(day.cigFactors||{})},oldC={...(day.cigCravings||{})};
    const nF={},nC={};
    let oi=0;
    newCigs.forEach((_,ni)=>{
      if(ni===idx){ if(factorId)nF[ni]=factorId; if(craving)nC[ni]=craving; }
      else{ if(oldF[oi]!==undefined)nF[ni]=oldF[oi]; if(oldC[oi]!==undefined)nC[ni]=oldC[oi]; oi++; }
    });
    upd({cigs:newCigs,cigFactors:nF,cigCravings:nC});
    setShowModal(false);
  };

  const remCig = (i) => {
    const newCigs=day.cigs.filter((_,j)=>j!==i);
    const nF={},nC={};
    newCigs.forEach((_,ni)=>{ const oi=ni>=i?ni+1:ni; if((day.cigFactors||{})[oi])nF[ni]=(day.cigFactors||{})[oi]; if((day.cigCravings||{})[oi])nC[ni]=(day.cigCravings||{})[oi]; });
    upd({cigs:newCigs,cigFactors:nF,cigCravings:nC});
  };

  const ratio=day.goal>0?Math.min(day.cigs.length/day.goal,1):0;
  const remaining=Math.max(0,day.goal-day.cigs.length);
  const cpCig=settings.pricePerPack/settings.cigsPerPack;
  const costToday=(day.cigs.length*cpCig).toFixed(2);

  const tC  = dark?"#dde8e2":"#5a3a30";
  const stC = dark?"#7ab0a0":"#a07868";

  // Events config
  const EVENTS=[
    {key:"wakeUp", label:"Lever",    emoji:"☀️"},
    {key:"lunch",  label:"Déjeuner", emoji:"🍽️"},
    {key:"dinner", label:"Dîner",    emoji:"🌙"},
    {key:"bedtime",label:"Coucher",  emoji:"😴"},
  ];

  const handleEvent = (ev) => {
    // If not set yet → set to now; if already set → open modal to change
    if(!day[ev.key]){ upd({[ev.key]:nowHHMM()}); }
    else { setEventModal(ev); }
  };

  return (
    <div>
      {showModal&&<FactorModal onConfirm={confirmCig} onCancel={()=>setShowModal(false)} settings={settings}/>}
      {eventModal&&<EventModal label={eventModal.label} emoji={eventModal.emoji} currentTime={day[eventModal.key]} onConfirm={t=>{upd({[eventModal.key]:t});setEventModal(null);}} onCancel={()=>setEventModal(null)}/>}
      {newBadge&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:200,background:"linear-gradient(135deg,rgba(253,230,138,0.97),rgba(252,200,100,0.97))",borderRadius:16,padding:"12px 20px",boxShadow:"0 8px 32px rgba(180,130,40,0.3)",display:"flex",alignItems:"center",gap:12,maxWidth:340,width:"90%",border:"1.5px solid rgba(252,200,100,0.6)"}}>
          <span style={{fontSize:32}}>{newBadge.emoji}</span>
          <div><div style={{fontSize:11,fontWeight:700,color:"#7a5a20",textTransform:"uppercase",letterSpacing:"0.05em"}}>Badge débloqué !</div><div style={{fontSize:14,fontWeight:800,color:"#5a3a10"}}>{newBadge.label}</div></div>
        </div>
      )}

      {/* Counter card */}
      <Card dark={dark} style={{textAlign:"center",padding:"24px 20px"}}>
        {settings.name&&<div style={{fontSize:13,color:stC,marginBottom:2}}>Bonjour {settings.name} 👋</div>}
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:stC,textTransform:"uppercase",marginBottom:4}}>
          {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
        </div>
        <div style={{fontSize:80,fontWeight:900,lineHeight:1,color:tC,margin:"8px 0"}}>{day.cigs.length}</div>
        <div style={{fontSize:14,color:stC}}>cigarette{day.cigs.length!==1?"s":""} fumée{day.cigs.length!==1?"s":""}</div>
        <LastCigChrono cigs={day.cigs}/>
        <div style={{margin:"14px 0 6px",background:"rgba(200,170,160,0.2)",borderRadius:99,height:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${ratio*100}%`,background:ratio<0.7?"#86efac":ratio<1?"#fcd34d":"#fca5a5",borderRadius:99,transition:"width 0.5s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:stC}}>
          <span>{remaining>0?`Encore ${remaining} avant l'objectif (${day.goal})`:`⚠️ Dépassé de ${day.cigs.length-day.goal}`}</span>
          <span>~{costToday}{settings.currency}</span>
        </div>

        {/* Main action button */}
        <button onClick={()=>setShowModal(true)}
          style={{marginTop:18,background:"linear-gradient(135deg,#fca5a5,#fb7185)",border:"none",borderRadius:999,padding:"14px 40px",fontSize:16,fontWeight:700,color:"white",cursor:"pointer",boxShadow:"0 6px 20px rgba(251,113,133,0.35)",fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:10,transition:"transform 0.1s"}}
          onTouchStart={e=>e.currentTarget.style.transform="scale(0.96)"} onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}>
          <Icon name="plus" size={20} color="white"/> Fumer une cigarette
        </button>

        {/* Event buttons — side by side below */}
        {settings.showEvents&&(
          <div style={{marginTop:12,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {EVENTS.map(ev=>{
              const set=!!day[ev.key];
              return (
                <button key={ev.key} onClick={()=>handleEvent(ev)}
                  style={{background:set?"rgba(134,239,172,0.3)":"rgba(255,255,255,0.5)",border:`1.5px solid ${set?"rgba(134,239,172,0.7)":"rgba(200,180,170,0.4)"}`,borderRadius:12,padding:"8px 4px",fontSize:11,fontWeight:700,color:set?"#2a6a40":stC,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.2s"}}>
                  <span style={{fontSize:18}}>{ev.emoji}</span>
                  <span>{set?day[ev.key]:ev.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Timeline */}
      <Card dark={dark}><Lbl dark={dark}>Timeline du jour</Lbl><TimelineBar dayData={day} dark={dark}/></Card>

      {/* Cig list */}
      <Card dark={dark}>
        <Lbl dark={dark}>Cigarettes ({day.cigs.length})</Lbl>
        {day.cigs.length===0
          ?<div style={{color:dark?"#6a9a8a":"#c4a882",fontSize:14,textAlign:"center",padding:"12px 0"}}>Aucune cigarette pour l'instant 🌿</div>
          :<div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {day.cigs.map((t,i)=>{
              const fid=(day.cigFactors||{})[i];
              const f=fid?factorById[fid]:null;
              const cr=(day.cigCravings||{})[i];
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(252,165,165,0.25)",borderRadius:99,padding:"6px 12px",fontSize:13,color:"#8a3a30"}}>
                  {f?<span>{f.emoji}</span>:<span>🚬</span>} {t}
                  {cr&&settings.showCravings&&<span style={{fontSize:10,background:"rgba(196,181,253,0.4)",borderRadius:99,padding:"1px 6px",color:"#5a3a90",fontWeight:700}}>{cr}/5</span>}
                  <button onClick={()=>remCig(i)} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center"}}>
                    <Icon name="trash" size={13} color="#f87171"/>
                  </button>
                </div>
              );
            })}
          </div>}
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR TAB — with add cigs to past days
// ══════════════════════════════════════════════════════════════════════════════
const CalendarTab = ({data,setData,settings}) => {
  const dark = settings.darkMode||false;
  const [sel,setSel]         = useState(today());
  const [cal,setCal]         = useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});
  const [editNote,setEditNote]   = useState(false);
  const [addCigOpen,setAddCigOpen] = useState(false);
  const [cigTime,setCigTime]   = useState("12:00");

  const dim=new Date(cal.y,cal.m+1,0).getDate();
  const fd=(new Date(cal.y,cal.m,1).getDay()+6)%7;
  const day=data[sel]||defDay();

  const updDay=(p)=>{ const n={...data,[sel]:{...(data[sel]||defDay()),...p}}; setData(n); saveData(n); };

  const addCigToDay = () => {
    const d=data[sel]||defDay();
    const newCigs=[...d.cigs,cigTime].sort();
    const n={...data,[sel]:{...d,cigs:newCigs}};
    setData(n); saveData(n); setAddCigOpen(false);
  };

  const tC = dark?"#dde8e2":"#5a3a30";
  const ml = new Date(cal.y,cal.m,1).toLocaleDateString("fr-FR",{month:"long",year:"numeric"});

  return (
    <div>
      <Card dark={dark}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <button onClick={()=>setCal(p=>{const d=new Date(p.y,p.m-1);return{y:d.getFullYear(),m:d.getMonth()};})}
            style={{background:dark?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.7)",border:"none",borderRadius:10,padding:"6px 14px",cursor:"pointer",fontSize:18,color:"#b08070"}}>‹</button>
          <span style={{fontWeight:700,fontSize:15,color:tC,textTransform:"capitalize"}}>{ml}</span>
          <button onClick={()=>setCal(p=>{const d=new Date(p.y,p.m+1);return{y:d.getFullYear(),m:d.getMonth()};})}
            style={{background:dark?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.7)",border:"none",borderRadius:10,padding:"6px 14px",cursor:"pointer",fontSize:18,color:"#b08070"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,textAlign:"center"}}>
          {["Lu","Ma","Me","Je","Ve","Sa","Di"].map(d=><div key={d} style={{fontSize:11,fontWeight:700,color:"#c4a882",padding:"4px 0"}}>{d}</div>)}
          {Array.from({length:fd}).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:dim}).map((_,i)=>{
            const n=i+1, k=`${cal.y}-${String(cal.m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
            const d=data[k], cnt=d?.cigs?.length||0, g=d?.goal||10, r=g>0?Math.min(cnt/g,1):0;
            const isT=k===today(), isS=k===sel;
            const bg=cnt>0?`rgba(${Math.round(180+r*70)},${Math.round(220-r*60)},${Math.round(180-r*60)},0.65)`:"rgba(255,255,255,0.4)";
            return (
              <div key={k} onClick={()=>{setSel(k);setEditNote(false);setAddCigOpen(false);}}
                style={{borderRadius:10,padding:"6px 2px",cursor:"pointer",background:isS?"rgba(200,140,120,0.35)":bg,border:isT?"2px solid #fb7185":isS?"2px solid #c4a882":"2px solid transparent",minHeight:46,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
                <div style={{fontSize:11,fontWeight:isT?800:600,color:"#8a6a60",lineHeight:1}}>{n}</div>
                {cnt>0&&<div style={{fontSize:18,fontWeight:900,color:"#5a3a30",lineHeight:1}}>{cnt}</div>}
                {d?.note&&<div style={{fontSize:8,lineHeight:1}}>📝</div>}
              </div>
            );
          })}
        </div>
      </Card>
      <Card dark={dark}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <Lbl dark={dark}>{fmtShort(sel)}</Lbl>
            {sel===today()&&<span style={{fontSize:11,background:"rgba(251,113,133,0.15)",borderRadius:99,padding:"2px 8px",color:"#d05a60",fontWeight:600}}>Aujourd'hui</span>}
          </div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>{setAddCigOpen(a=>!a);setEditNote(false);}}
              style={{background:"rgba(252,165,165,0.3)",border:"none",borderRadius:10,padding:"5px 10px",cursor:"pointer",fontSize:12,color:"#c05040",fontWeight:700}}>
              + Cig
            </button>
            <button onClick={()=>{setEditNote(e=>!e);setAddCigOpen(false);}}
              style={{background:"rgba(253,230,138,0.4)",border:"none",borderRadius:10,padding:"5px 10px",cursor:"pointer",fontSize:12,color:"#7a6030",fontWeight:600}}>
              {editNote?"✓ Fermer":"📝 Note"}
            </button>
          </div>
        </div>

        {/* Add cig to any day */}
        {addCigOpen&&<div style={{marginBottom:14,background:"rgba(252,165,165,0.12)",borderRadius:14,padding:"12px 14px",border:"1.5px solid rgba(252,165,165,0.3)"}}>
          <div style={{fontSize:13,fontWeight:700,color:"#c05040",marginBottom:10}}>🚬 Ajouter une cigarette</div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:12,color:"#a07868"}}>Heure :</span>
            <input type="time" value={cigTime} onChange={e=>setCigTime(e.target.value)}
              style={{border:"1.5px solid rgba(200,180,170,0.4)",background:"rgba(255,255,255,0.85)",borderRadius:10,padding:"6px 10px",fontSize:16,fontFamily:"'DM Sans',sans-serif",color:"#5a4a40",outline:"none",flex:1}}/>
            <button onClick={addCigToDay}
              style={{background:"linear-gradient(135deg,#fca5a5,#fb7185)",border:"none",borderRadius:10,padding:"8px 16px",fontSize:13,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              Ajouter
            </button>
          </div>
        </div>}

        {editNote&&<div style={{marginBottom:14}}>
          <textarea value={day.note||""} onChange={e=>updDay({note:e.target.value})} placeholder="Événement, stress, sortie…"
            style={{width:"100%",background:"rgba(255,255,255,0.7)",border:"1.5px solid rgba(200,180,170,0.3)",borderRadius:12,padding:12,fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#5a4a40",outline:"none",resize:"none",minHeight:72,boxSizing:"border-box"}}/>
        </div>}

        <TimelineBar dayData={day} dark={dark}/>
        <div style={{marginTop:16}}><DayStatsPanel dayData={day} dark={dark}/></div>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// STATS TAB
// ══════════════════════════════════════════════════════════════════════════════
const StatsTab = ({data,settings}) => {
  const dark = settings.darkMode||false;
  const {period,keys,PeriodBar} = usePeriodFilter(data);

  const allKeys=Object.keys(data).sort();
  const days=keys.map(k=>data[k]).filter(Boolean);
  const total=days.reduce((s,d)=>s+d.cigs.length,0);
  const avg=days.length?(total/days.length).toFixed(1):0;
  const maxDay=days.reduce((m,d)=>Math.max(m,d.cigs.length),0);
  const dwd=days.filter(d=>d.cigs.length>0);
  const gr=days.filter(d=>d.cigs.length<=d.goal).length;
  const grPct=days.length?Math.round((gr/days.length)*100):0;

  // Median
  const sorted=[...dwd].map(d=>d.cigs.length).sort((a,b)=>a-b);
  const median=sorted.length?sorted[Math.floor(sorted.length/2)]:null;

  const cpCig=settings.pricePerPack/settings.cigsPerPack;
  const cost=(total*cpCig).toFixed(2);
  const mCost=((total/Math.max(days.length,1))*30*cpCig).toFixed(0);
  const yCost=((total/Math.max(days.length,1))*365*cpCig).toFixed(0);
  const usual=settings.usualCigs||20;
  const savedCigs=Math.max(0,(usual*days.length)-total);
  const savedMoney=(savedCigs*cpCig).toFixed(2);
  const savedMontly=((usual-parseFloat(avg))*30*cpCig).toFixed(0);
  const savedYearly=((usual-parseFloat(avg))*365*cpCig).toFixed(0);

  const ivAll=days.flatMap(d=>{const m=d.cigs.map(msm).filter(m=>m!==null).sort((a,b)=>a-b);const r=[];for(let i=1;i<m.length;i++)r.push(m[i]-m[i-1]);return r;});
  const avgIv=ivAll.length?Math.round(ivAll.reduce((a,b)=>a+b,0)/ivAll.length):null;
  const wDel=days.filter(d=>d.wakeUp&&d.cigs.length).map(d=>{const wm=msm(d.wakeUp);const f=d.cigs.map(msm).filter(m=>m!==null&&m>=wm).sort((a,b)=>a-b)[0];return f!==undefined?f-wm:null;}).filter(m=>m!==null);
  const mDelFn=(k)=>days.filter(d=>d[k]&&d.cigs.length).map(d=>{const mm=msm(d[k]);const nx=d.cigs.map(msm).filter(m=>m!==null&&m>=mm).sort((a,b)=>a-b)[0];return nx!==undefined?nx-mm:null;}).filter(m=>m!==null);
  const lDel=mDelFn("lunch"),dDel=mDelFn("dinner");
  const avgD=arr=>arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):null;
  const hc=Array(24).fill(0);
  days.forEach(d=>d.cigs.forEach(t=>{const m=msm(t);if(m!==null)hc[Math.floor(m/60)]++;}));
  const mxH=Math.max(...hc,1), pkH=hc.indexOf(Math.max(...hc));
  const dc=Array(7).fill(0),ddc=Array(7).fill(0);
  days.forEach((d,i)=>{const dow=(new Date(keys[i]+"T00:00:00").getDay()+6)%7;dc[dow]+=d.cigs.length;ddc[dow]++;});
  const da=dc.map((c,i)=>ddc[i]>0?+(c/ddc[i]).toFixed(1):0);
  const mxD=Math.max(...da,1);
  const trend=days.length>=4&&period!=="today"?(()=>{
    const h=Math.floor(days.length/2);
    const a1=days.slice(0,h).reduce((s,d)=>s+d.cigs.length,0)/h;
    const a2=days.slice(h).reduce((s,d)=>s+d.cigs.length,0)/(days.length-h);
    const diff=a2-a1;
    if(Math.abs(diff)<0.5)return{l:"Stable ➡️",c:"#7a9a80"};
    return diff<0?{l:`En baisse 📉 (${Math.abs(diff).toFixed(1)}/j)`,c:"#3a7a50"}:{l:`En hausse 📈 (+${diff.toFixed(1)}/j)`,c:"#c05040"};
  })():null;
  const streak=(()=>{let s=0;for(const k of[...allKeys].reverse()){const d=data[k];if(d&&d.cigs.length<=d.goal)s++;else break;}return s;})();
  const dn=["Lu","Ma","Me","Je","Ve","Sa","Di"];

  const SC=({l,v,e})=>(
    <div style={{background:dark?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.6)",borderRadius:14,padding:"12px 10px",textAlign:"center"}}>
      <div style={{fontSize:20}}>{e}</div>
      <div style={{fontSize:18,fontWeight:900,color:dark?"#dde8e2":"#5a3a30",lineHeight:1.1}}>{v}</div>
      <div style={{fontSize:10,color:dark?"#7ab0a0":"#a07868",marginTop:2}}>{l}</div>
    </div>
  );

  return (
    <div>
      <PeriodBar showToday={true}/>

      <Card dark={dark}>
        <Lbl dark={dark}>Résumé</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          <SC e="🚬" v={total}                               l="Total"/>
          <SC e="📊" v={period==="today"?total:avg}          l={period==="today"?"Auj.":"Moy / jour"}/>
          <SC e="🔥" v={maxDay}                              l="Record"/>
          <SC e="📐" v={median??"–"}                         l="Médiane"/>
          <SC e="🎯" v={`${grPct}%`}                         l="Objectifs"/>
          <SC e="🏆" v={`${streak}j`}                        l="Série"/>
        </div>
      </Card>

      <Card dark={dark}>
        <Lbl dark={dark}>💸 Coût estimé</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
          {[["Période",`${cost}${settings.currency}`,"rgba(252,165,165,0.2)","#c05040"],["/ mois",`${mCost}${settings.currency}`,"rgba(253,230,138,0.25)","#7a6030"],["/ an",`${yCost}${settings.currency}`,"rgba(134,239,172,0.2)","#3a7a50"]].map(([l,v,bg,c])=>(
            <div key={l} style={{background:bg,borderRadius:12,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:17,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#a07868"}}>{l}</div>
            </div>
          ))}
        </div>
        {settings.usualCigs>0&&parseFloat(savedMoney)>0&&<>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <div style={{height:1,flex:1,background:"rgba(200,180,170,0.3)"}}/>
            <span style={{fontSize:10,color:"#a07868",fontWeight:700}}>ÉCONOMISÉ vs habitude ({usual} cig/j)</span>
            <div style={{height:1,flex:1,background:"rgba(200,180,170,0.3)"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["Période",`+${savedMoney}${settings.currency}`,"rgba(134,239,172,0.3)","#2a6a40"],["/ mois",`+${savedMontly}${settings.currency}`,"rgba(134,239,172,0.2)","#3a7a50"],["/ an",`+${savedYearly}${settings.currency}`,"rgba(134,239,172,0.15)","#4a8a60"]].map(([l,v,bg,c])=>(
              <div key={l} style={{background:bg,borderRadius:12,padding:"10px",textAlign:"center",border:"1px solid rgba(134,239,172,0.3)"}}>
                <div style={{fontSize:17,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:10,color:"#5a8a68"}}>{l}</div>
              </div>
            ))}
          </div>
        </>}
      </Card>

      {trend&&<Card dark={dark} style={{padding:"14px 20px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <Lbl dark={dark}>Tendance</Lbl>
          <span style={{fontSize:15,fontWeight:800,color:trend.c}}>{trend.l}</span>
        </div>
      </Card>}

      <Card dark={dark}>
        <Lbl dark={dark}>⏱️ Intervalles</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["Moyen",fmtDur(avgIv),"rgba(134,239,172,0.2)","#3a6a50"],["Min",fmtDur(ivAll.length?Math.min(...ivAll):null),"rgba(252,165,165,0.2)","#8a3a30"],["Max",fmtDur(ivAll.length?Math.max(...ivAll):null),"rgba(196,181,253,0.2)","#5a3a90"]].map(([l,v,bg,c])=>(
            <div key={l} style={{background:bg,borderRadius:12,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#a07868"}}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card dark={dark}>
        <Lbl dark={dark}>🍽️ Délai avant 1ère cig</Lbl>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead>
            <tr style={{borderBottom:"2px solid rgba(200,180,170,0.3)"}}>
              {["Moment","Moyen","Min","Max","n"].map(h=><th key={h} style={{padding:"5px 0",color:"#a07868",fontWeight:700,textAlign:h==="Moment"?"left":"center"}}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[{l:"☀️ Lever",a:wDel},{l:"🍽️ Déjeuner",a:lDel},{l:"🌙 Dîner",a:dDel}].map(({l,a})=>(
              <tr key={l} style={{borderBottom:"1px solid rgba(200,180,170,0.15)"}}>
                <td style={{padding:"8px 0",fontWeight:600,color:dark?"#dde8e2":"#5a3a30"}}>{l}</td>
                <td style={{textAlign:"center",color:"#7a5a50",fontWeight:700}}>{fmtDur(avgD(a))}</td>
                <td style={{textAlign:"center",color:"#86a880"}}>{a.length?fmtDur(Math.min(...a)):"–"}</td>
                <td style={{textAlign:"center",color:"#f87171"}}>{a.length?fmtDur(Math.max(...a)):"–"}</td>
                <td style={{textAlign:"center",color:"#b0a090",fontSize:11}}>{a.length}j</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card dark={dark}>
        <Lbl dark={dark}>🕐 Distribution horaire</Lbl>
        {pkH>=0&&hc[pkH]>0&&<div style={{fontSize:12,color:"#a07868",marginBottom:8}}>Pic : <strong>{pkH}h–{pkH+1}h</strong> ({hc[pkH]} cig{hc[pkH]>1?"s":""})</div>}
        <div style={{display:"flex",alignItems:"flex-end",gap:2,height:64}}>
          {hc.map((c,h)=>(
            <div key={h} style={{flex:1,height:`${Math.max((c/mxH)*56,c>0?3:0)}px`,background:h===pkH&&c>0?"#fb7185":c?`hsl(${20-(h/24)*30},70%,72%)`:"rgba(200,180,170,0.15)",borderRadius:"3px 3px 0 0",alignSelf:"flex-end"}}/>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#bbb",fontFamily:"monospace",marginTop:4}}>
          {[0,6,12,18,23].map(h=><span key={h}>{h}h</span>)}
        </div>
      </Card>

      <Card dark={dark}>
        <Lbl dark={dark}>📅 Moy. par jour de semaine</Lbl>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
          {da.map((v,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{fontSize:10,color:"#a07868",fontWeight:700}}>{v||""}</div>
              <div style={{width:"100%",height:`${Math.max((v/mxD)*44,v>0?3:0)}px`,background:`hsl(${140-(v/mxD)*120},60%,65%)`,borderRadius:"3px 3px 0 0",alignSelf:"flex-end"}}/>
              <div style={{fontSize:9,color:"#b0a090"}}>{dn[i]}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ANALYSE TAB
// ══════════════════════════════════════════════════════════════════════════════
const AnalyseTab = ({data,settings}) => {
  const dark = settings.darkMode||false;
  const {period,keys,PeriodBar} = usePeriodFilter(data);
  const days=keys.map(k=>data[k]).filter(Boolean);

  const factorCount={};
  days.forEach(d=>Object.values(d.cigFactors||{}).forEach(f=>{ if(f)factorCount[f]=(factorCount[f]||0)+1; }));
  const maxFactor=Math.max(...Object.values(factorCount),1);
  const factorStats=FACTORS.filter(f=>factorCount[f.id]).map(f=>{
    const withF=days.filter(d=>Object.values(d.cigFactors||{}).includes(f.id));
    const withoutF=days.filter(d=>!Object.values(d.cigFactors||{}).includes(f.id));
    const avgWith=withF.length?(withF.reduce((s,d)=>s+d.cigs.length,0)/withF.length).toFixed(1):null;
    const avgWithout=withoutF.length?(withoutF.reduce((s,d)=>s+d.cigs.length,0)/withoutF.length).toFixed(1):null;
    const delta=avgWith&&avgWithout?(parseFloat(avgWith)-parseFloat(avgWithout)).toFixed(1):null;
    return {...f,count:factorCount[f.id]||0,avgWith,avgWithout,delta};
  }).sort((a,b)=>b.count-a.count);

  const allCravings=[];
  days.forEach(d=>Object.values(d.cigCravings||{}).forEach(v=>{ if(v)allCravings.push(v); }));
  const avgCraving=allCravings.length?(allCravings.reduce((a,b)=>a+b,0)/allCravings.length).toFixed(1):null;
  const highCravings=allCravings.filter(c=>c>=4).length;
  const cravingDist=[1,2,3,4,5].map(sc=>({sc,count:allCravings.filter(c=>c===sc).length}));
  const maxCraving=Math.max(...cravingDist.map(c=>c.count),1);
  const cravingColors={1:"#86efac",2:"#fcd34d",3:"#fb923c",4:"#f87171",5:"#e11d48"};

  const slots={matin:0,apresmidi:0,soir:0,nuit:0};
  days.forEach(d=>d.cigs.forEach(t=>{const m=msm(t);if(m===null)return;const h=m/60;if(h<12)slots.matin++;else if(h<18)slots.apresmidi++;else if(h<22)slots.soir++;else slots.nuit++;}));
  const totalSlot=Object.values(slots).reduce((a,b)=>a+b,0);

  const allKeys2=Object.keys(data).sort();
  const weekGroups={};
  allKeys2.forEach(k=>{ const d=new Date(k+"T00:00:00"); const wy=`${d.getFullYear()}-S${Math.ceil((((d-new Date(d.getFullYear(),0,1))/86400000)+1)/7)}`; if(!weekGroups[wy])weekGroups[wy]={cigs:0,days:0}; weekGroups[wy].cigs+=(data[k]?.cigs?.length||0); weekGroups[wy].days++; });
  const weeks=Object.entries(weekGroups).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8);
  const maxWk=Math.max(...weeks.map(([,v])=>v.days>0?v.cigs/v.days:0),1);

  const insights=[];
  const avgAll=days.length?days.reduce((s,d)=>s+d.cigs.length,0)/days.length:0;
  if(factorStats[0]&&settings.showFactors) insights.push(`🔍 Ton principal déclencheur est "${factorStats[0].emoji} ${factorStats[0].label}" (${factorStats[0].count} fois)`);
  const pkSlot=Object.entries(slots).sort((a,b)=>b[1]-a[1])[0];
  const slotNames={matin:"le matin",apresmidi:"l'après-midi",soir:"le soir",nuit:"la nuit"};
  if(pkSlot&&pkSlot[1]>0) insights.push(`⏰ Tu fumes surtout ${slotNames[pkSlot[0]]} (${pkSlot[1]} cig${pkSlot[1]>1?"s":""})`);
  if(avgCraving&&parseFloat(avgCraving)>=3.5&&settings.showCravings) insights.push(`🌡️ Tes envies sont intenses (${avgCraving}/5) — pense à des techniques de distraction`);
  if(avgAll>0) insights.push(`📊 Moy. ${avgAll.toFixed(1)} cig/jour sur cette période`);

  const exportCSV=()=>{
    const rows=[["Date","Cigarettes","Objectif","Lever","Déjeuner","Dîner","Coucher","Facteurs","Note"]];
    allKeys2.forEach(k=>{ const d=data[k]; if(d){ const factors=Object.values(d.cigFactors||{}).map(f=>factorById[f]?.label).filter(Boolean).join("|"); rows.push([k,d.cigs.length,d.goal,d.wakeUp,d.lunch,d.dinner,d.bedtime,factors,d.note||""]); }});
    const csv="\uFEFF"+rows.map(r=>r.join(";")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download="smoketrack_export.csv"; a.click();
  };

  return (
    <div>
      <PeriodBar showToday={false}/>

      {settings.showFactors&&factorStats.length>0&&<Card dark={dark}>
        <Lbl dark={dark}>🔍 Facteurs déclenchants</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          {factorStats.map(f=>(
            <div key={f.id} style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18,width:24}}>{f.emoji}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:13,fontWeight:600,color:dark?"#dde8e2":"#5a3a30"}}>{f.label}</span>
                  <span style={{fontSize:12,fontWeight:800,color:"#a07868"}}>{f.count}×</span>
                </div>
                <div style={{background:"rgba(200,180,170,0.2)",borderRadius:99,height:8,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${(f.count/maxFactor)*100}%`,background:"#fca5a5",borderRadius:99,transition:"width 0.5s"}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
        {factorStats.filter(f=>f.delta!==null).length>0&&<>
          <Lbl dark={dark}>Impact cigs/jour</Lbl>
          {factorStats.filter(f=>f.delta!==null).sort((a,b)=>parseFloat(b.delta)-parseFloat(a.delta)).map(f=>(
            <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(200,180,170,0.15)"}}>
              <span style={{fontSize:13,color:dark?"#dde8e2":"#5a3a30"}}>{f.emoji} {f.label}</span>
              <div style={{display:"flex",gap:8,alignItems:"center",fontSize:12}}>
                <span style={{color:"#a07868"}}>sans:{f.avgWithout}</span>
                <span style={{color:"#a07868"}}>avec:{f.avgWith}</span>
                <span style={{fontWeight:800,color:parseFloat(f.delta)>0?"#c05040":"#3a7a50",minWidth:50,textAlign:"right"}}>{parseFloat(f.delta)>0?`+${f.delta}`:f.delta} cig/j</span>
              </div>
            </div>
          ))}
        </>}
      </Card>}

      {settings.showCravings&&allCravings.length>0&&<Card dark={dark}>
        <Lbl dark={dark}>🌡️ Notes d'envie</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
          {[["Moyenne",avgCraving?`${avgCraving}/5`:"–","rgba(196,181,253,0.25)","#5a3a90"],["Fortes (≥4)",`${highCravings}`,"rgba(252,165,165,0.25)","#c05040"],["Total",`${allCravings.length}`,"rgba(255,255,255,0.6)","#5a3a30"]].map(([l,v,bg,c])=>(
            <div key={l} style={{background:bg,borderRadius:12,padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:17,fontWeight:900,color:c}}>{v}</div>
              <div style={{fontSize:10,color:"#a07868"}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {cravingDist.map(({sc,count})=>{
            const pct=maxCraving>0?Math.round((count/maxCraving)*100):0;
            const labels=["","Légère","Modérée","Forte","Très forte","Irrésistible"];
            return (
              <div key={sc} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:18,height:18,borderRadius:6,background:cravingColors[sc],flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:10,fontWeight:900,color:"white"}}>{sc}</span>
                </div>
                <div style={{fontSize:12,color:dark?"#9ab0a8":"#7a5a50",fontWeight:600,width:76,flexShrink:0}}>{labels[sc]}</div>
                <div style={{flex:1,background:"rgba(200,180,170,0.2)",borderRadius:99,height:10,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:cravingColors[sc],borderRadius:99,transition:"width 0.5s"}}/>
                </div>
                <div style={{fontSize:12,fontWeight:800,color:dark?"#dde8e2":"#5a3a30",width:24,textAlign:"right",flexShrink:0}}>{count||"–"}</div>
              </div>
            );
          })}
        </div>
      </Card>}

      {totalSlot>0&&<Card dark={dark}>
        <Lbl dark={dark}>🕐 Créneaux de consommation</Lbl>
        {[["🌅 Matin (0h–12h)",slots.matin],["☀️ Après-midi (12h–18h)",slots.apresmidi],["🌆 Soir (18h–22h)",slots.soir],["🌙 Nuit (22h–0h)",slots.nuit]].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(200,180,170,0.1)"}}>
            <span style={{fontSize:13,color:dark?"#dde8e2":"#5a3a30"}}>{l}</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{background:"rgba(200,180,170,0.2)",borderRadius:99,height:6,width:80,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${totalSlot>0?(v/totalSlot)*100:0}%`,background:"#fca5a5",borderRadius:99}}/>
              </div>
              <span style={{fontSize:13,fontWeight:800,color:dark?"#dde8e2":"#5a3a30",minWidth:24,textAlign:"right"}}>{v}</span>
            </div>
          </div>
        ))}
      </Card>}

      {weeks.length>0&&<Card dark={dark}>
        <Lbl dark={dark}>📈 Progression par semaine (moy/j)</Lbl>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:60}}>
          {weeks.map(([w,v])=>{const avg2=v.days>0?v.cigs/v.days:0;return(
            <div key={w} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{fontSize:9,color:"#a07868",fontWeight:700}}>{avg2.toFixed(1)}</div>
              <div style={{width:"100%",height:`${Math.max((avg2/maxWk)*44,avg2>0?3:0)}px`,background:`hsl(${140-(avg2/maxWk)*120},60%,65%)`,borderRadius:"3px 3px 0 0",alignSelf:"flex-end"}}/>
              <div style={{fontSize:7,color:"#b0a090"}}>{w.split("-S")[1]?"S"+w.split("-S")[1]:""}</div>
            </div>
          );})}
        </div>
      </Card>}

      {insights.length>0&&<Card dark={dark}>
        <Lbl dark={dark}>💡 Insights</Lbl>
        {insights.map((ins,i)=>(
          <div key={i} style={{fontSize:13,color:dark?"#c0d0c8":"#5a3a30",padding:"7px 0",borderBottom:i<insights.length-1?"1px solid rgba(200,180,170,0.15)":"none"}}>{ins}</div>
        ))}
      </Card>}

      <button onClick={exportCSV}
        style={{width:"100%",background:"rgba(255,255,255,0.6)",border:"1.5px solid rgba(200,180,170,0.3)",borderRadius:14,padding:"12px",fontSize:14,fontWeight:700,color:"#5a3a30",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14}}>
        <Icon name="download" size={16} color="#5a3a30"/> Exporter CSV
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// BADGES
// ══════════════════════════════════════════════════════════════════════════════
const BADGES = [
  {id:"first",      cat:"🚀 Premiers pas", emoji:"👣", label:"Premier pas",       check:(d)=>Object.keys(d).length>=1},
  {id:"week1",      cat:"🚀 Premiers pas", emoji:"📅", label:"7 jours trackés",   check:(d)=>Object.keys(d).length>=7},
  {id:"month1",     cat:"🚀 Premiers pas", emoji:"🗓️", label:"30 jours trackés",  check:(d)=>Object.keys(d).length>=30},
  {id:"days100",    cat:"🚀 Premiers pas", emoji:"💯", label:"100 jours",          check:(d)=>Object.keys(d).length>=100},
  {id:"streak3",    cat:"🔥 Séries",       emoji:"🌱", label:"3 jours maîtrisés", check:(d)=>{let s=0;for(const k of Object.keys(d).sort().reverse()){const v=d[k];if(v&&v.cigs.length<=v.goal)s++;else break;}return s>=3;}},
  {id:"streak7",    cat:"🔥 Séries",       emoji:"🌿", label:"Une semaine !",     check:(d)=>{let s=0;for(const k of Object.keys(d).sort().reverse()){const v=d[k];if(v&&v.cigs.length<=v.goal)s++;else break;}return s>=7;}},
  {id:"streak14",   cat:"🔥 Séries",       emoji:"🌳", label:"Deux semaines !",   check:(d)=>{let s=0;for(const k of Object.keys(d).sort().reverse()){const v=d[k];if(v&&v.cigs.length<=v.goal)s++;else break;}return s>=14;}},
  {id:"streak30",   cat:"🔥 Séries",       emoji:"🏆", label:"Un mois !",         check:(d)=>{let s=0;for(const k of Object.keys(d).sort().reverse()){const v=d[k];if(v&&v.cigs.length<=v.goal)s++;else break;}return s>=30;}},
  {id:"streak60",   cat:"🔥 Séries",       emoji:"👑", label:"60 jours — Légende",check:(d)=>{let s=0;for(const k of Object.keys(d).sort().reverse()){const v=d[k];if(v&&v.cigs.length<=v.goal)s++;else break;}return s>=60;}},
  {id:"halfgoal",   cat:"📉 Réduction",    emoji:"🎯", label:"Mi-objectif",       check:(d)=>Object.values(d).some(v=>v.cigs.length>0&&v.cigs.length<=(v.goal||10)/2)},
  {id:"zero",       cat:"📉 Réduction",    emoji:"🚭", label:"Journée zéro",      check:(d)=>Object.values(d).some(v=>v.cigs.length===0&&(v.wakeUp||v.note))},
  {id:"zero3",      cat:"📉 Réduction",    emoji:"✨", label:"3 jours zéro",      check:(d)=>Object.values(d).filter(v=>v.cigs.length===0&&(v.wakeUp||v.note)).length>=3},
  {id:"reduce20",   cat:"📉 Réduction",    emoji:"📉", label:"–20% en 2 sem.",    check:(d)=>{const ks=Object.keys(d).sort();if(ks.length<14)return false;const w1=ks.slice(0,7).reduce((s,k)=>s+(d[k]?.cigs?.length||0),0)/7;const w2=ks.slice(7,14).reduce((s,k)=>s+(d[k]?.cigs?.length||0),0)/7;return w2<w1*0.8;}},
  {id:"morningwait",cat:"📉 Réduction",    emoji:"⏳", label:"Résistance matinale",check:(d)=>Object.values(d).filter(v=>{if(!v.wakeUp||!v.cigs.length)return false;const wm=msm(v.wakeUp);const f=v.cigs.map(msm).filter(m=>m!==null&&m>=wm).sort((a,b)=>a-b)[0];return f!==undefined&&(f-wm)>=120;}).length>=5},
  {id:"goal50pct",  cat:"🎯 Maîtrise",     emoji:"🥈", label:"Objectif 50%",      check:(d)=>{const vs=Object.values(d).filter(v=>v.cigs.length>0);return vs.length>=7&&vs.filter(v=>v.cigs.length<=v.goal).length/vs.length>=0.5;}},
  {id:"goal80pct",  cat:"🎯 Maîtrise",     emoji:"🥇", label:"Objectif 80%",      check:(d)=>{const vs=Object.values(d).filter(v=>v.cigs.length>0);return vs.length>=10&&vs.filter(v=>v.cigs.length<=v.goal).length/vs.length>=0.8;}},
  {id:"consistent", cat:"🎯 Maîtrise",     emoji:"📐", label:"Régularité",        check:(d)=>{const ks=Object.keys(d).sort().slice(-14);if(ks.length<14)return false;const vals=ks.map(k=>d[k]?.cigs?.length||0);const avg=vals.reduce((a,b)=>a+b,0)/vals.length;const std=Math.sqrt(vals.reduce((s,v)=>s+(v-avg)**2,0)/vals.length);return std<2;}},
  {id:"analyst",    cat:"🔬 Analyse",      emoji:"🔬", label:"Analyste",          check:(d)=>{let n=0;Object.values(d).forEach(v=>n+=Object.values(v.cigFactors||{}).filter(Boolean).length);return n>=10;}},
  {id:"analyst50",  cat:"🔬 Analyse",      emoji:"🧬", label:"Expert données",    check:(d)=>{let n=0;Object.values(d).forEach(v=>n+=Object.values(v.cigFactors||{}).filter(Boolean).length);return n>=50;}},
  {id:"craving10",  cat:"🔬 Analyse",      emoji:"🌡️", label:"Thermomètre",       check:(d)=>{let n=0;Object.values(d).forEach(v=>n+=Object.values(v.cigCravings||{}).filter(Boolean).length);return n>=10;}},
  {id:"noted",      cat:"🔬 Analyse",      emoji:"📝", label:"Journal",           check:(d)=>Object.values(d).filter(v=>v.note&&v.note.length>2).length>=5},
  {id:"noted20",    cat:"🔬 Analyse",      emoji:"📖", label:"Diariste",          check:(d)=>Object.values(d).filter(v=>v.note&&v.note.length>2).length>=20},
  {id:"total50",    cat:"📊 Volume",       emoji:"🔢", label:"50 trackées",       check:(d)=>Object.values(d).reduce((s,v)=>s+(v.cigs?.length||0),0)>=50},
  {id:"total200",   cat:"📊 Volume",       emoji:"💨", label:"200 trackées",      check:(d)=>Object.values(d).reduce((s,v)=>s+(v.cigs?.length||0),0)>=200},
  {id:"earlybird",  cat:"⏰ Moments",      emoji:"🌅", label:"Résistance mat.",   check:(d)=>Object.values(d).filter(v=>{if(!v.wakeUp||!v.cigs.length)return false;const wm=msm(v.wakeUp);const f=v.cigs.map(msm).filter(m=>m!==null&&m>=wm).sort((a,b)=>a-b)[0];return f!==undefined&&(f-wm)>=60;}).length>=10},
  {id:"longinterval",cat:"⏰ Moments",     emoji:"⌛", label:"Grand espacement",  check:(d)=>Object.values(d).some(v=>{const cm=v.cigs.map(msm).filter(m=>m!==null).sort((a,b)=>a-b);if(cm.length<2)return false;const ivs=[];for(let i=1;i<cm.length;i++)ivs.push(cm[i]-cm[i-1]);return ivs.reduce((a,b)=>a+b,0)/ivs.length>=90;})},
];
const BADGE_CATS=[...new Set(BADGES.map(b=>b.cat))];

// ══════════════════════════════════════════════════════════════════════════════
// PROGRESS TAB
// ══════════════════════════════════════════════════════════════════════════════
const ProgressTab = ({data,settings,setSettings}) => {
  const dark = settings.darkMode||false;
  const [badgeDetail,setBadgeDetail] = useState(null);
  const [goalAccepted,setGoalAccepted] = useState(false);
  const allKeys=Object.keys(data).sort();

  const now=new Date();
  const heatStart=new Date(now); heatStart.setFullYear(now.getFullYear()-1); heatStart.setDate(heatStart.getDate()+1);
  const heatDays=[];
  for(let d=new Date(heatStart);d<=now;d.setDate(d.getDate()+1)){
    const k=d.toISOString().slice(0,10);
    const dd=data[k]; const cnt=dd?.cigs?.length??-1; const goal=dd?.goal||settings.defaultGoal||10;
    const ratio=cnt<0?-1:goal>0?Math.min(cnt/goal,1):0;
    heatDays.push({k,cnt,ratio});
  }
  const firstDow=(new Date(heatStart.toISOString().slice(0,10)+"T00:00:00").getDay()+6)%7;
  const padded=[...Array(firstDow).fill(null),...heatDays];
  const weeks2=[];
  for(let i=0;i<padded.length;i+=7) weeks2.push(padded.slice(i,i+7));
  const heatColor=(ratio)=>{
    if(ratio<0) return dark?"rgba(255,255,255,0.05)":"rgba(200,180,170,0.12)";
    if(ratio===0) return "#bbf7d0";
    const r=Math.round(180+ratio*75),g=Math.round(230-ratio*90),b=Math.round(180-ratio*70);
    return `rgb(${r},${g},${b})`;
  };
  const [heatTip,setHeatTip]=useState(null);
  const monthLabels=[];
  let lastMonth=-1;
  weeks2.forEach((wk,wi)=>{ const firstReal=wk.find(d=>d); if(firstReal){const m=new Date(firstReal.k+"T00:00:00").getMonth(); if(m!==lastMonth){monthLabels.push({wi,label:new Date(firstReal.k+"T00:00:00").toLocaleDateString("fr-FR",{month:"short"})});lastMonth=m;}} });

  let streak=0;
  for(const k of[...allKeys].reverse()){ const d=data[k]; if(d&&d.cigs.length<=d.goal)streak++;else break; }

  const recentKeys=allKeys.slice(-14);
  const recentDays=recentKeys.map(k=>data[k]).filter(Boolean);
  const currentGoal=settings.defaultGoal||10;
  const recentAvg=recentDays.length?(recentDays.reduce((s,d)=>s+d.cigs.length,0)/recentDays.length):null;
  const goalMet=recentDays.length>=7&&recentDays.filter(d=>d.cigs.length<=currentGoal).length/recentDays.length>=0.7;
  const suggestedGoal=goalMet?Math.max(1,currentGoal-1):null;
  const acceptGoal=()=>{ const n={...settings,defaultGoal:suggestedGoal}; setSettings(n); saveSettings(n); setGoalAccepted(true); };

  const unlockedIds=new Set(BADGES.filter(b=>b.check(data)).map(b=>b.id));
  const stC = dark?"#7ab0a0":"#a07868";

  return (
    <div>
      <Card dark={dark}>
        <Lbl dark={dark}>🗓️ Heatmap — 12 derniers mois</Lbl>
        <div style={{display:"flex",marginBottom:4,marginLeft:18,overflow:"hidden"}}>
          {weeks2.map((_,wi)=>{const lbl=monthLabels.find(m=>m.wi===wi);return <div key={wi} style={{width:13,flexShrink:0,fontSize:8,color:stC,fontWeight:600,textAlign:"left"}}>{lbl?lbl.label:""}</div>;})}
        </div>
        <div style={{display:"flex",gap:1}}>
          <div style={{display:"flex",flexDirection:"column",gap:1,marginRight:2}}>
            {["L","M","M","J","V","S","D"].map((d,i)=>(
              <div key={i} style={{height:12,fontSize:7,color:"#c4a882",lineHeight:"12px",fontWeight:600,textAlign:"right",paddingRight:2}}>{i%2===0?d:""}</div>
            ))}
          </div>
          <div style={{display:"flex",gap:1,overflowX:"auto",flex:1}} onClick={()=>setHeatTip(null)}>
            {weeks2.map((wk,wi)=>(
              <div key={wi} style={{display:"flex",flexDirection:"column",gap:1}}>
                {Array.from({length:7}).map((_,di)=>{
                  const cell=wk[di];
                  if(!cell)return <div key={di} style={{width:12,height:12}}/>;
                  return <div key={di} onClick={e=>{e.stopPropagation();setHeatTip(t=>t===cell.k?null:cell.k);}} style={{width:12,height:12,borderRadius:2,background:heatColor(cell.ratio),cursor:"pointer",border:heatTip===cell.k?"1.5px solid rgba(90,58,48,0.5)":"1.5px solid transparent",boxSizing:"border-box"}}/>;
                })}
              </div>
            ))}
          </div>
        </div>
        {heatTip&&(()=>{const dd=data[heatTip];const cnt=dd?.cigs?.length??0;const goal=dd?.goal||currentGoal;return(
          <div style={{marginTop:10,background:"rgba(255,255,255,0.8)",borderRadius:12,padding:"8px 14px",fontSize:13,color:"#5a3a30",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>{new Date(heatTip+"T00:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</span>
            <span style={{fontWeight:800}}>{dd?`${cnt} 🚬 / obj. ${goal}`:"Aucune donnée"}</span>
          </div>
        );})()}
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,justifyContent:"flex-end"}}>
          <span style={{fontSize:9,color:stC}}>Moins</span>
          {[0,0.25,0.5,0.75,1].map(r=><div key={r} style={{width:10,height:10,borderRadius:2,background:heatColor(r)}}/>)}
          <span style={{fontSize:9,color:stC}}>Plus</span>
        </div>
      </Card>

      <Card dark={dark} style={{padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:stC,textTransform:"uppercase",marginBottom:4}}>🔥 Série en cours</div>
            <div style={{fontSize:11,color:stC}}>Jours consécutifs sous objectif</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:48,fontWeight:900,color:streak>=7?"#f59e0b":streak>=3?"#86efac":"#fca5a5",lineHeight:1}}>{streak}</div>
            <div style={{fontSize:11,color:stC}}>jour{streak!==1?"s":""}</div>
          </div>
        </div>
        {streak>0&&<>
          <div style={{marginTop:10,background:"rgba(200,180,170,0.2)",borderRadius:99,height:8,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.min((streak/30)*100,100)}%`,background:"linear-gradient(90deg,#86efac,#fcd34d,#fb923c)",borderRadius:99,transition:"width 0.5s"}}/>
          </div>
          <div style={{fontSize:10,color:stC,marginTop:4,textAlign:"right"}}>{streak}/30 vers 🏆</div>
        </>}
      </Card>

      <Card dark={dark} style={{border:suggestedGoal&&!goalAccepted?"2px solid rgba(134,239,172,0.6)":undefined}}>
        <Lbl dark={dark}>🎯 Objectif progressif</Lbl>
        {!recentDays.length
          ?<div style={{fontSize:13,color:stC}}>Pas encore assez de données (7 jours minimum).</div>
          :<>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["Objectif",currentGoal,"#5a3a30"],["Moy. 14j",recentAvg?recentAvg.toFixed(1):"–","#3a7a50"],["Objectifs",recentDays.length>=7?`${Math.round(recentDays.filter(d=>d.cigs.length<=currentGoal).length/recentDays.length*100)}%`:"–","#7a6030"]].map(([l,v,c])=>(
                <div key={l} style={{flex:1,background:"rgba(255,255,255,0.6)",borderRadius:12,padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,color:c}}>{v}</div>
                  <div style={{fontSize:10,color:stC}}>{l}</div>
                </div>
              ))}
            </div>
            {suggestedGoal&&!goalAccepted&&<div style={{background:"rgba(134,239,172,0.2)",borderRadius:14,padding:"14px",border:"1px solid rgba(134,239,172,0.4)"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#2a6a40",marginBottom:6}}>🎉 Prêt(e) à descendre à {suggestedGoal} cig/jour ?</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setGoalAccepted(true)} style={{flex:1,padding:"10px",borderRadius:12,border:"none",background:"rgba(200,180,170,0.2)",fontSize:13,fontWeight:600,color:"#a07868",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Pas encore</button>
                <button onClick={acceptGoal} style={{flex:2,padding:"10px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#86efac,#4ade80)",fontSize:14,fontWeight:700,color:"#1a4a30",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✓ Passer à {suggestedGoal}</button>
              </div>
            </div>}
          </>}
      </Card>

      <Card dark={dark}>
        <Lbl dark={dark}>🏅 Badges ({BADGES.filter(b=>unlockedIds.has(b.id)).length}/{BADGES.length})</Lbl>
        <div style={{background:"rgba(200,180,170,0.2)",borderRadius:99,height:8,overflow:"hidden",marginBottom:16}}>
          <div style={{height:"100%",width:`${(BADGES.filter(b=>unlockedIds.has(b.id)).length/BADGES.length)*100}%`,background:"linear-gradient(90deg,#86efac,#fcd34d,#fb923c)",borderRadius:99,transition:"width 0.6s"}}/>
        </div>
        {BADGE_CATS.map(cat=>{
          const catBadges=BADGES.filter(b=>b.cat===cat);
          const catUnlocked=catBadges.filter(b=>unlockedIds.has(b.id));
          return (
            <div key={cat} style={{marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:stC,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8,display:"flex",justifyContent:"space-between"}}>
                <span>{cat}</span><span style={{color:"#c4a882"}}>{catUnlocked.length}/{catBadges.length}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {catBadges.map(b=>{
                  const on=unlockedIds.has(b.id);
                  return (
                    <div key={b.id} onClick={()=>setBadgeDetail(badgeDetail===b.id?null:b.id)}
                      style={{background:on?"linear-gradient(135deg,rgba(253,230,138,0.45),rgba(252,200,100,0.3))":"rgba(200,180,170,0.1)",borderRadius:14,padding:"10px 6px",textAlign:"center",cursor:"pointer",border:on?"1.5px solid rgba(252,200,100,0.45)":"1.5px solid rgba(200,180,170,0.2)"}}>
                      <div style={{fontSize:26,marginBottom:3,opacity:on?1:0.3}}>{on?b.emoji:"🔒"}</div>
                      <div style={{fontSize:9,fontWeight:700,color:on?"#7a5a20":"#c4a882",lineHeight:1.3}}>{b.label}</div>
                      {badgeDetail===b.id&&<div style={{fontSize:8,color:on?"#a07030":"#b09080",marginTop:5,lineHeight:1.4,borderTop:`1px solid ${on?"rgba(200,150,50,0.2)":"rgba(200,180,170,0.2)"}`,paddingTop:5}}>{b.check.toString().slice(0,60)}…</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB
// ══════════════════════════════════════════════════════════════════════════════
const SettingsTab = ({data,setData,settings,setSettings}) => {
  const dark = settings.darkMode||false;
  const [confirmReset,setConfirmReset] = useState(false);
  const upd = (p) => { const n={...settings,...p}; setSettings(n); saveSettings(n); };

  const Row = ({icon,label,children}) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${dark?"rgba(255,255,255,0.07)":"rgba(200,180,170,0.15)"}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,background:"rgba(200,180,170,0.2)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name={icon} size={16} color="#a0857a"/>
        </div>
        <span style={{fontSize:14,color:dark?"#dde8e2":"#5a3a30",fontWeight:600}}>{label}</span>
      </div>
      {children}
    </div>
  );

  const inputStyle = {background:"rgba(255,255,255,0.75)",border:"1.5px solid rgba(200,180,170,0.3)",borderRadius:10,padding:"6px 10px",fontSize:14,fontFamily:"'DM Sans',sans-serif",color:"#5a4a40",outline:"none"};
  const totalCigs=Object.values(data).reduce((s,d)=>s+(d.cigs?.length||0),0);
  const totalDays=Object.keys(data).length;

  return (
    <div>
      {/* Profile */}
      <Card dark={dark}>
        <Lbl dark={dark}>👤 Profil</Lbl>
        <Row icon="user" label="Prénom">
          <StableInput value={settings.name} onCommit={v=>upd({name:v})} placeholder="Ton prénom" style={{...inputStyle,width:130,textAlign:"left"}}/>
        </Row>
        <Row icon="target" label="Objectif par défaut">
          <StableInput type="number" value={settings.defaultGoal} onCommit={v=>upd({defaultGoal:Math.max(1,parseInt(v)||1)})} style={{...inputStyle,width:70,textAlign:"right"}}/>
        </Row>
      </Card>

      {/* Appearance */}
      <Card dark={dark}>
        <Lbl dark={dark}>🎨 Apparence</Lbl>
        <Toggle val={!!settings.darkMode} onChange={v=>upd({darkMode:v})} label="🌙 Mode sombre" desc="Interface sombre pour la nuit" dark={dark}/>
      </Card>

      {/* Features on/off */}
      <Card dark={dark}>
        <Lbl dark={dark}>⚙️ Fonctionnalités affichées</Lbl>
        <Toggle val={settings.showFactors!==false} onChange={v=>upd({showFactors:v})} label="🔍 Facteurs déclenchants" desc="Dans la saisie et les analyses" dark={dark}/>
        <Toggle val={settings.showCravings!==false} onChange={v=>upd({showCravings:v})} label="🌡️ Note d'envie" desc="Niveau d'envie lors de la saisie" dark={dark}/>
        <Toggle val={settings.showEvents!==false} onChange={v=>upd({showEvents:v})} label="📅 Événements du jour" desc="Lever, repas, dîner, coucher" dark={dark}/>
      </Card>

      {/* Cost & habits */}
      <Card dark={dark}>
        <Lbl dark={dark}>💸 Coût & habitude</Lbl>
        <Row icon="coin" label="Prix par paquet">
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <StableInput type="number" value={settings.pricePerPack} onCommit={v=>upd({pricePerPack:parseFloat(v)||10})} style={{...inputStyle,width:70,textAlign:"right"}}/>
            <StableInput value={settings.currency} onCommit={v=>upd({currency:v||"€"})} style={{...inputStyle,width:38,textAlign:"center"}}/>
          </div>
        </Row>
        <Row icon="target" label="Cigs par paquet">
          <StableInput type="number" value={settings.cigsPerPack} onCommit={v=>upd({cigsPerPack:parseInt(v)||20})} style={{...inputStyle,width:70,textAlign:"right"}}/>
        </Row>
        <Row icon="savings" label="Habitude (cig/jour)">
          <StableInput type="number" value={settings.usualCigs} onCommit={v=>upd({usualCigs:parseInt(v)||20})} style={{...inputStyle,width:70,textAlign:"right"}}/>
        </Row>
      </Card>

      {/* Data summary */}
      <Card dark={dark}>
        <Lbl dark={dark}>📊 Mes données</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{background:"rgba(252,165,165,0.2)",borderRadius:12,padding:"12px",textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,color:"#5a3a30"}}>{totalCigs}</div><div style={{fontSize:11,color:"#a07868"}}>cigarettes trackées</div></div>
          <div style={{background:"rgba(196,181,253,0.2)",borderRadius:12,padding:"12px",textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,color:"#5a3a90"}}>{totalDays}</div><div style={{fontSize:11,color:"#a07868"}}>jours enregistrés</div></div>
        </div>
        <div style={{marginTop:10,background:"rgba(253,230,138,0.2)",borderRadius:12,padding:"10px 14px",fontSize:13,color:"#7a6030",textAlign:"center"}}>
          💰 Total dépensé estimé : <strong>{((totalCigs/settings.cigsPerPack)*settings.pricePerPack).toFixed(2)}{settings.currency}</strong>
        </div>
      </Card>

      {/* Danger zone */}
      <Card dark={dark} style={{border:"1.5px solid rgba(248,113,113,0.3)"}}>
        <Lbl dark={dark}>⚠️ Zone danger</Lbl>
        {!confirmReset
          ?<button onClick={()=>setConfirmReset(true)} style={{width:"100%",background:"rgba(248,113,113,0.15)",border:"1.5px solid rgba(248,113,113,0.3)",borderRadius:12,padding:"10px",fontSize:14,fontWeight:700,color:"#c05040",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>🗑️ Effacer toutes les données</button>
          :<div>
            <div style={{fontSize:13,color:"#c05040",marginBottom:10,textAlign:"center",fontWeight:600}}>⚠️ Action irréversible. Confirmer ?</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmReset(false)} style={{flex:1,background:"rgba(255,255,255,0.6)",border:"none",borderRadius:12,padding:"10px",fontSize:14,fontWeight:600,cursor:"pointer",color:"#5a3a30",fontFamily:"'DM Sans',sans-serif"}}>Annuler</button>
              <button onClick={()=>{setData({});saveData({});setConfirmReset(false);}} style={{flex:1,background:"rgba(248,113,113,0.3)",border:"none",borderRadius:12,padding:"10px",fontSize:14,fontWeight:700,cursor:"pointer",color:"#c05040",fontFamily:"'DM Sans',sans-serif"}}>Confirmer</button>
            </div>
          </div>}
      </Card>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [data,setData]         = useState(loadData);
  const [settings,setSettings] = useState(loadSettings);
  const [tab,setTab]           = useState("home");
  const day  = data[today()]||defDay();
  const dark = settings.darkMode||false;
  const bg   = getBg(day.cigs.length,day.goal,dark);

  const tabs=[
    {id:"home",     icon:"home",     label:"Accueil"},
    {id:"calendar", icon:"calendar", label:"Calendrier"},
    {id:"stats",    icon:"chart",    label:"Stats"},
    {id:"progres",  icon:"trophy",   label:"Progrès"},
    {id:"analyse",  icon:"brain",    label:"Analyse"},
    {id:"settings", icon:"settings", label:"Réglages"},
  ];

  const activeClr  = dark?"#86efac":"#d05a40";
  const inactClr   = dark?"#4a6a5a":"#b09080";
  const navBg      = dark?"rgba(15,25,30,0.93)":"rgba(255,255,255,0.82)";
  const navBdr     = dark?"1px solid rgba(255,255,255,0.07)":"1px solid rgba(200,180,170,0.3)";
  const headerClr  = dark?"#c0ddd0":"#5a3a30";
  const subClr     = dark?"#5a8070":"#a07868";

  return (
    <div style={{minHeight:"100dvh",background:bg,transition:"background 1.2s ease",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        html,body,#root{margin:0;padding:0;width:100%;height:100%;background:transparent;}
        body{overscroll-behavior:none;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{opacity:1;}
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap" rel="stylesheet"/>
      <div style={{padding:"44px 20px 10px",textAlign:"center"}}>
        <div style={{fontSize:24}}>🚬</div>
        <div style={{fontSize:20,fontWeight:900,color:headerClr,letterSpacing:"-0.02em"}}>SmokeTrack</div>
        <div style={{fontSize:11,color:subClr}}>Ton compagnon pour arrêter</div>
      </div>
      <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px 100px"}}>
        {tab==="home"     &&<HomeTab      data={data} setData={setData} settings={settings}/>}
        {tab==="calendar" &&<CalendarTab  data={data} setData={setData} settings={settings}/>}
        {tab==="stats"    &&<StatsTab     data={data} settings={settings}/>}
        {tab==="progres"  &&<ProgressTab  data={data} settings={settings} setSettings={setSettings}/>}
        {tab==="analyse"  &&<AnalyseTab   data={data} settings={settings}/>}
        {tab==="settings" &&<SettingsTab  data={data} setData={setData} settings={settings} setSettings={setSettings}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:navBg,backdropFilter:"blur(16px)",borderTop:navBdr,display:"flex",justifyContent:"space-around",padding:"7px 0 max(7px,env(safe-area-inset-bottom))"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"3px 6px",color:tab===t.id?activeClr:inactClr,fontFamily:"'DM Sans',sans-serif",transition:"color 0.2s"}}>
            <Icon name={t.icon} size={24} color={tab===t.id?activeClr:inactClr}/>
            <span style={{fontSize:10,fontWeight:tab===t.id?700:500}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
