"use client";

import { useEffect, useRef, useState } from "react";
import { formatDate, formatTime, getNextDays, FALLBACK_DATE, FALLBACK_TIME } from "@/lib/availability";
import { SERVICE_AREAS, DEFAULT_ZIP } from "@/lib/serviceAreas";
import type { SkinProps } from "./types";

// ── FF Palette ────────────────────────────────────────────────────
const C = {
  skyDeep:"#0a0614",skyMid:"#110a2a",skyHigh:"#1a1040",moonBody:"#f5f0e0",
  starDim:"#4a3f6a",starBright:"#c8bde8",crystalA:"#7ec8e3",crystalB:"#5aafc8",
  crystalC:"#3d8aad",crystalGl:"#b8eaff",floorLine:"#2a1c48",floorShine:"#2e2050",
  wallBase:"#100c22",wallPanel:"#18122e",wallAccent:"#2a2050",archStone:"#221840",
  archLight:"#3a2e60",counterTop:"#1e1638",counterFrt:"#14102a",counterEdge:"#4a3890",
  counterGl:"#6050b0",lampPost:"#2a2050",lampHead:"#c9a84c",lampGlw:"#f0d870",
  robeMain:"#1a4a6e",robeShadow:"#0e2e48",robeTrim:"#7ec8e3",skinBase:"#f0c8a0",
  skinShad:"#d4966a",hairBase:"#e8e0c0",hairShad:"#c8b890",eyeColor:"#5af0ff",
  bannerA:"#0e2840",bannerB:"#1a3e60",bannerTrim:"#7ec8e3",
  particleA:"#7ec8e3",particleB:"#c9a84c",particleC:"#aaddff",
};

export function GameSkin(props: SkinProps) {
  const { step, goToStep, questItems, date, time, windowCount, needsEstimate,
          onDateChange, onTimeChange, onWindowCountChange, onNeedsEstimateChange,
          slotMap, paused, onResume, onGoToSummary, onZipChange, mode } = props;

  // Light mode only affects the Q&A panel — canvas is always dark
  const isLight = mode === "light";
  const panelBg     = isLight ? "#f0f0f8" : "#0a0614";
  const dialogueBg  = isLight ? "rgba(244,244,250,0.97)" : "rgba(5,10,30,0.97)";
  const dialogueBdr = isLight ? "1.5px solid rgba(109,40,217,0.35)" : "1.5px solid #7ec8e3";
  const mainText    = isLight ? "#111827" : "#ddeeff";
  const dimText     = isLight ? "rgba(17,24,39,0.5)" : "rgba(126,200,227,0.35)";
  const questConfirmed = isLight ? "#16a34a" : "#4ade80";
  const questPending   = isLight ? "rgba(0,0,0,0.15)" : "#3a5070";

  // ── Canvas refs ───────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tickRef = useRef(0);
  const armAngleRef = useRef(0); const armDirRef = useRef(1);
  const breathRef = useRef(0); const breathDirRef = useRef(1);
  const blinkTRef = useRef(0); const blinkOpenRef = useRef(true);
  const hairFRef = useRef(0);
  const starsRef = useRef<{x:number;y:number;size:number;phase:number;speed:number}[]>([]);
  const particlesRef = useRef<{x:number;y:number;vx:number;vy:number;life:number;maxLife:number;size:number;color:string}[]>([]);

  // ── Dialogue state ────────────────────────────────────────────
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showSlots, setShowSlots] = useState(false);
  const [showZipInput, setShowZipInput] = useState(false);
  const [zipInputValue, setZipInputValue] = useState("");
  const [zipError, setZipError] = useState("");
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Canvas animation ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const W = 560, H = 320;
    if (!starsRef.current.length) {
      starsRef.current = Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*140,size:Math.random()<0.2?2:1,phase:Math.random()*Math.PI*2,speed:0.3+Math.random()*0.7}));
      particlesRef.current = Array.from({length:14},()=>({x:160+Math.random()*240,y:80+Math.random()*180,vx:(Math.random()-0.5)*0.3,vy:-(0.2+Math.random()*0.5),life:Math.random(),maxLife:0.6+Math.random()*0.8,size:1+Math.random()*2,color:[C.particleA,C.particleB,C.particleC][Math.floor(Math.random()*3)]}));
    }
    const stars = starsRef.current, particles = particlesRef.current;
    function rp(p:typeof particles[0]){p.x=160+Math.random()*240;p.y=80+Math.random()*180;p.vx=(Math.random()-0.5)*0.3;p.vy=-(0.2+Math.random()*0.5);p.life=Math.random();p.maxLife=0.6+Math.random()*0.8;p.size=1+Math.random()*2;p.color=[C.particleA,C.particleB,C.particleC][Math.floor(Math.random()*3)];}
    function r(x:number,y:number,w:number,h:number,c:string){ctx.fillStyle=c;ctx.fillRect(x,y,w,h);}
    function drawAll(){
      const tick=tickRef.current,breath=breathRef.current,hairF=hairFRef.current,armAngle=armAngleRef.current,blinkOpen=blinkOpenRef.current;
      r(0,0,W,H,C.skyDeep);for(let i=0;i<8;i++)r(0,i*18,W,18,i<3?C.skyDeep:i<5?C.skyMid:C.skyHigh);
      ctx.fillStyle="#251840";ctx.beginPath();ctx.arc(440,44,24,0,Math.PI*2);ctx.fill();ctx.fillStyle=C.moonBody;ctx.beginPath();ctx.arc(440,44,18,0,Math.PI*2);ctx.fill();ctx.fillStyle="#e0d8c0";ctx.beginPath();ctx.arc(437,41,14,0,Math.PI*2);ctx.fill();
      stars.forEach(s=>{ctx.globalAlpha=0.4+0.6*Math.sin(s.phase+tick*s.speed*0.04);ctx.fillStyle=s.size===2?C.starBright:C.starDim;ctx.fillRect(s.x,s.y,s.size,s.size);});ctx.globalAlpha=1;
      ([[30,110],[480,100],[90,95],[450,115]]as[number,number][]).forEach(([bx,bh])=>{r(bx,120-bh,50,bh,C.wallBase);r(bx+2,120-bh+4,46,bh-4,C.wallPanel);for(let w=0;w<2;w++)r(bx+5+w*20,120-bh+10,14,18,C.archLight);});
      for(let row=0;row<3;row++)for(let col=0;col<8;col++){r(col*70,240+row*27,70,27,row%2===col%2?C.floorLine:C.floorShine);ctx.strokeStyle="#2a1a50";ctx.lineWidth=0.5;ctx.strokeRect(col*70,240+row*27,70,27);}
      r(120,90,320,190,C.wallBase);r(122,92,316,188,C.wallPanel);r(120,90,18,190,C.archStone);r(422,90,18,190,C.archStone);for(let i=0;i<5;i++)r(122,90+i*38,316,1.5,C.wallAccent);
      ([[128,96,10,24],[158,100,6,18],[406,96,10,24],[386,100,6,18],[210,94,8,20],[342,94,8,20]]as[number,number,number,number][]).forEach(([cx,cy,cw,ch])=>{r(cx,cy,cw,ch,C.crystalC);r(cx+1,cy,cw-2,5,C.crystalGl);ctx.globalAlpha=0.12+0.08*Math.sin(tick*0.05+cx);r(cx-3,cy-3,cw+6,ch+6,C.crystalA);ctx.globalAlpha=1;});
      r(148,115,264,72,C.wallBase);[0,1,2].forEach(i=>{const sx=156+i*88;r(sx,118,72,68,C.archLight);r(sx+2,118,68,2,C.crystalB);r(sx+8,128,20,18,C.crystalA);r(sx+34,128,18,18,"#aaddff");r(sx+8,152,20,14,C.particleB);r(sx+34,152,18,14,"#cc88ff");ctx.globalAlpha=0.2+0.12*Math.sin(tick*0.04+i);r(sx+9,129,18,16,"#ffffff");ctx.globalAlpha=1;});
      ([[130,150],[432,150]]as[number,number][]).forEach(([lx])=>{r(lx,150,5,80,C.lampPost);r(lx-7,146,19,7,C.lampPost);r(lx-3,138,13,10,C.lampHead);r(lx-1,136,9,4,C.lampGlw);ctx.globalAlpha=0.1+0.07*Math.sin(tick*0.06+lx);r(lx-16,130,38,32,C.lampGlw);ctx.globalAlpha=1;});
      r(50,238,460,10,C.counterGl);r(52,240,456,7,C.counterTop);r(50,247,460,40,C.counterFrt);r(50,247,460,3,C.counterEdge);for(let i=0;i<7;i++)r(50+i*66,250,1.5,37,C.counterEdge);ctx.globalAlpha=0.12+0.07*Math.sin(tick*0.04);r(50,238,460,12,C.crystalA);ctx.globalAlpha=1;
      r(76,228,16,12,C.crystalC);r(77,226,14,4,C.crystalGl);r(450,226,14,14,C.particleC);ctx.globalAlpha=0.4+0.3*Math.sin(tick*0.07);r(451,227,12,6,"#ffffff");ctx.globalAlpha=1;
      ([[136,94],[406,94]]as[number,number][]).forEach(([bx,by])=>{r(bx,by,20,54,C.bannerA);r(bx+2,by,16,52,C.bannerB);r(bx,by,20,3,C.bannerTrim);r(bx,by+50,20,4,C.bannerTrim);r(bx+7,by+10,6,5,C.bannerTrim);r(bx+9,by+20,2,14,C.bannerTrim);r(bx+3,by+26,14,2,C.bannerTrim);});
      particles.forEach(p=>{p.life+=0.008;if(p.life>p.maxLife)rp(p);p.x+=p.vx;p.y+=p.vy;ctx.globalAlpha=Math.sin(p.life/p.maxLife*Math.PI)*0.7;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);});ctx.globalAlpha=1;
      const cx=264,cy=170+breath;
      r(cx-9,cy,18,55,C.robeMain);r(cx-9,cy,18,4,C.robeShadow);r(cx-9,cy,3,52,C.robeShadow);r(cx+6,cy,3,52,C.robeShadow);r(cx-11,cy+36,4,20,C.robeMain);r(cx+7,cy+36,4,20,C.robeMain);r(cx-2,cy+52,7,8,"#1a1830");r(cx-9,cy,18,3,C.robeTrim);r(cx-11,cy+52,22,2,C.robeTrim);
      r(cx-17,cy+6,9,5,C.robeMain);r(cx-17,cy+10,5,20,C.robeMain);r(cx-17,cy+28,7,8,C.skinBase);
      const aOff=armAngle;r(cx+8,cy+6+aOff,9,5,C.robeMain);r(cx+11,cy+10+aOff,5,16,C.robeMain);r(cx+9,cy+24+aOff,7,8,C.skinBase);ctx.globalAlpha=0.5+0.35*Math.sin(tick*0.08);r(cx+6,cy+26+aOff,10,10,C.crystalA);ctx.globalAlpha=1;r(cx+9,cy+22+aOff,5,8,C.crystalB);r(cx+10,cy+21+aOff,3,4,C.crystalGl);
      r(cx-5,cy-18+breath,10,18,C.skinBase);r(cx-5,cy-18+breath,10,4,C.skinShad);r(cx-3,cy-1+breath,6,5,C.skinBase);r(cx-7,cy-22,14,9,C.hairBase);r(cx-7,cy-20,4,14,C.hairBase);r(cx+3,cy-20,4,12,C.hairShad);
      const hf=Math.floor(hairF);r(cx-7,cy-14+hf,4,18,C.hairBase);r(cx+3,cy-12+hf,3,16,C.hairShad);
      if(blinkOpen){r(cx-2,cy-11+breath,2,3,C.eyeColor);r(cx+1,cy-11+breath,2,3,C.eyeColor);ctx.globalAlpha=0.3+0.2*Math.sin(tick*0.05);r(cx-4,cy-14+breath,6,7,C.eyeColor);r(cx-1,cy-14+breath,6,7,C.eyeColor);ctx.globalAlpha=1;}
      else{r(cx-2,cy-10+breath,2,1,"#1a0a2e");r(cx+1,cy-10+breath,2,1,"#1a0a2e");}
      r(cx-1,cy-2+breath,3,1,"#c07060");r(cx-1,cy-1+breath,3,1,"#d08070");
    }
    function loop(){tickRef.current++;const t=tickRef.current;if(t%3===0){armAngleRef.current+=armDirRef.current*0.5;if(armAngleRef.current>5)armDirRef.current=-1;if(armAngleRef.current<-1)armDirRef.current=1;}if(t%5===0){breathRef.current+=breathDirRef.current*0.5;if(breathRef.current>1.5)breathDirRef.current=-1;if(breathRef.current<0)breathDirRef.current=1;}hairFRef.current=Math.sin(t*0.03)*1.5;blinkTRef.current++;if(blinkTRef.current>100)blinkOpenRef.current=false;if(blinkTRef.current>104){blinkOpenRef.current=true;blinkTRef.current=0;}drawAll();rafRef.current=requestAnimationFrame(loop);}
    rafRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Typewriter ────────────────────────────────────────────────
  function typeText(text: string) {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current);
    setDisplayText(""); setMenuVisible(false); setIsTyping(true);
    let i = 0;
    typeTimerRef.current = setInterval(() => {
      i++; setDisplayText(text.slice(0, i));
      if (i >= text.length) { clearInterval(typeTimerRef.current!); typeTimerRef.current = null; setIsTyping(false); setMenuVisible(true); }
    }, 24);
  }

  function dialogue(s: typeof step): string {
    const slot = date ? `${formatDate(date)} at ${formatTime(time)}` : `${formatDate(FALLBACK_DATE)} at ${formatTime(FALLBACK_TIME)}`;
    switch (s) {
      case "location": return `Greetings, traveler.\nI see your booking is set for Santa Cruz, CA 95060.\nIs that the correct area for our crew?`;
      case "timeslot": return `Excellent. Your slot is held for ${slot}.\nShall we keep this time, or would you prefer another?`;
      case "windows":  return `Very well. How many windows shall we cleanse today?\nEach pane: $22. No ladders, no mess, no hidden fees.`;
      case "estimate": return `Understood — ${windowCount} window${windowCount!==1?"s":""} at $${windowCount*22}.\nShall I also arrange a full-house estimate?\nNo extra charge for the visit.`;
      case "contact":  return `One last thing — any name or contact for our records?\nAll fields are optional. We'll find you by address.`;
      case "complete": return `The quest is complete, traveler.\nYour order awaits — press Book Now when ready.\nMay your windows shine like crystal.`;
    }
  }

  function handleGoToStep(s: typeof step) {
    setShowSlots(false);
    setShowZipInput(false);
    setZipInputValue("");
    setZipError("");
    goToStep(s);
    typeText(dialogue(s));
  }

  function handleZipSubmit() {
    const z = zipInputValue.trim();
    if (!SERVICE_AREAS[z]) {
      setZipError("Not in range. Valid: 95060 95062 95003 95018 95066 95073 95064 95065 95010");
      return;
    }
    onZipChange?.(z);
    handleGoToStep("timeslot");
  }

  // Auto-type on mount
  useEffect(() => { setTimeout(() => typeText(dialogue(step)), 400); }, []);

  // Re-type when step changes from outside (e.g. skin switch back to game)
  // (handled by mount above since GameSkin remounts on skin switch)

  // ── FF button helper ──────────────────────────────────────────
  const ffBtn = (label: string, onClick: () => void, gold = false): React.ReactNode => (
    <button key={label} onClick={onClick}
      style={{ fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:1, border:`1px solid ${gold?"#c9a84c":"#7ec8e3"}`, background:"transparent", color:gold?"#c9a84c":"#7ec8e3", padding:"7px 12px", cursor:"pointer", borderRadius:2, textAlign:"left", transition:"background 0.15s,color 0.15s" }}
      onMouseEnter={e=>{const b=e.currentTarget;b.style.background=gold?"#c9a84c":"#7ec8e3";b.style.color="#05080f";}}
      onMouseLeave={e=>{const b=e.currentTarget;b.style.background="transparent";b.style.color=gold?"#c9a84c":"#7ec8e3";}}
    >{label}</button>
  );

  const ffInput: React.CSSProperties = { fontFamily:"'Cinzel',serif", fontSize:10, background:dialogueBg, border:`1px solid ${questPending}`, color:mainText, padding:"5px 8px", borderRadius:2, width:"100%", outline:"none" };

  // ── Menu per step ─────────────────────────────────────────────
  function renderMenu() {
    switch (step) {
      case "location": return (<>{ffBtn("1.  ✦  Yes, that's my area (95060)", () => handleGoToStep("timeslot"), true)}{ffBtn("2.  ✧  Enter a different ZIP", () => { setShowZipInput(true); setZipError(""); })}{ffBtn("3.  ✧  New ZIP / Start over", () => { onZipChange?.(DEFAULT_ZIP); handleGoToStep("location"); })}</>);
      case "timeslot": return (<>{ffBtn(`1.  ✦  Perfect — keep ${date ? formatDate(date) : "July 4th"}`, () => handleGoToStep("windows"), true)}{ffBtn("2.  ✧  See other times", () => setShowSlots(v=>!v))}{ffBtn("3.  ✧  Back", () => handleGoToStep("location"))}</>);
      case "windows":  return (<>{ffBtn(`1.  ✦  ${windowCount} window${windowCount!==1?"s":""} — continue`, () => handleGoToStep("estimate"), true)}{ffBtn("2.  ✧  Back", () => handleGoToStep("timeslot"))}</>);
      case "estimate": return (<>{ffBtn("1.  ✦  No — windows only", () => { onNeedsEstimateChange(false); handleGoToStep("contact"); }, true)}{ffBtn("2.  ✧  Yes — include full estimate", () => { onNeedsEstimateChange(true); handleGoToStep("contact"); })}{ffBtn("3.  ✧  Back", () => handleGoToStep("windows"))}</>);
      case "contact":  return (<>{ffBtn("1.  ✦  Done — review booking", () => handleGoToStep("complete"), true)}{ffBtn("2.  ✧  Skip", () => handleGoToStep("complete"))}{ffBtn("3.  ✧  Back", () => handleGoToStep("estimate"))}</>);
      case "complete": return (<>{ffBtn("1.  ✦  Go straight to checkout", onGoToSummary, true)}{ffBtn("2.  ✧  Start over", () => handleGoToStep("location"))}</>);
    }
  }

  // ── Inline controls ───────────────────────────────────────────
  function renderInline() {
    if (isTyping) return null;
    if (step === "location" && showZipInput) return (
      <div style={{ marginTop:8 }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:8, color:"#c9a84c", letterSpacing:1, marginBottom:5 }}>ENTER ZIP CODE</div>
        <div style={{ display:"flex", gap:5 }}>
          <input
            type="text"
            placeholder="95062…"
            maxLength={5}
            value={zipInputValue}
            onChange={e => { setZipInputValue(e.target.value.replace(/\D/g,"")); setZipError(""); }}
            onKeyDown={e => e.key === "Enter" && handleZipSubmit()}
            style={{ ...ffInput, flex:1 }}
          />
          <button onClick={handleZipSubmit}
            style={{ fontFamily:"'Cinzel',serif", fontSize:9, border:"1px solid #c9a84c", background:"transparent", color:"#c9a84c", padding:"5px 10px", cursor:"pointer", borderRadius:2 }}
            onMouseEnter={e=>{e.currentTarget.style.background="#c9a84c";e.currentTarget.style.color="#05080f";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a84c";}}
          >GO</button>
        </div>
        {zipError && <div style={{ fontFamily:"'Cinzel',serif", fontSize:7.5, color:"#f87171", marginTop:4, letterSpacing:0.5, lineHeight:1.5 }}>{zipError}</div>}
      </div>
    );
    if (step === "windows") return (
      <div style={{ display:"flex", alignItems:"center", gap:12, margin:"10px 0", justifyContent:"center" }}>
        <button onClick={()=>onWindowCountChange(Math.max(1,windowCount-1))} style={{ fontFamily:"'Cinzel',serif", fontSize:16, width:28, height:28, border:"1px solid #7ec8e3", background:"transparent", color:"#7ec8e3", cursor:"pointer", borderRadius:2 }}>−</button>
        <span style={{ fontFamily:"'Cinzel',serif", fontSize:20, color:"#c9a84c", minWidth:24, textAlign:"center" }}>{windowCount}</span>
        <button onClick={()=>onWindowCountChange(Math.min(20,windowCount+1))} style={{ fontFamily:"'Cinzel',serif", fontSize:16, width:28, height:28, border:"1px solid #7ec8e3", background:"transparent", color:"#7ec8e3", cursor:"pointer", borderRadius:2 }}>+</button>
        <span style={{ fontFamily:"'Cinzel',serif", fontSize:9, color:"#7ec8e3", letterSpacing:1 }}>${windowCount*22} total</span>
      </div>
    );
    if (step === "contact") return (
      <div style={{ display:"flex", flexDirection:"column", gap:5, margin:"8px 0" }}>
        <input type="text" placeholder="Name (optional)" style={ffInput} />
        <input type="tel" placeholder="Phone (optional)" style={ffInput} />
        <input type="email" placeholder="Email (optional)" style={ffInput} />
      </div>
    );
    return null;
  }

  // ── Slot picker ───────────────────────────────────────────────
  function renderSlotPicker() {
    if (!showSlots || step !== "timeslot") return null;
    const dates = getNextDays();
    return (
      <div style={{ maxHeight:130, overflowY:"auto", border:`1px solid ${questPending}`, borderRadius:2, padding:8, background:dialogueBg, margin:"6px 0" }}>
        {dates.map(d=>{const slots=slotMap[d]??[];if(!slots.length)return null;return(
          <div key={d} style={{ marginBottom:5 }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:8, color:"#c9a84c", letterSpacing:1, marginBottom:3 }}>{formatDate(d)}</div>
            <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
              {slots.map(t=><button key={t} onClick={()=>{onDateChange(d);onTimeChange(t);setShowSlots(false);setTimeout(()=>typeText(dialogue("timeslot")),50);}}
                style={{ fontFamily:"'Cinzel',serif", fontSize:8, border:`1px solid ${d===date&&t===time?"#c9a84c":"#3a5070"}`, background:d===date&&t===time?"rgba(201,168,76,0.2)":"transparent", color:d===date&&t===time?"#c9a84c":"#7ec8e3", padding:"2px 6px", cursor:"pointer", borderRadius:2 }}
              >{formatTime(t)}</button>)}
            </div>
          </div>
        );})}
      </div>
    );
  }

  // ── Quest log ─────────────────────────────────────────────────
  function renderQuestLog() {
    return (
      <div style={{ borderTop:"1px solid rgba(126,200,227,0.15)", marginTop:10, paddingTop:10 }}>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:8, color:"#c9a84c", letterSpacing:2, marginBottom:8, textTransform:"uppercase" }}>
          ✦ Active Quest: Window Cleaning
        </div>
        {questItems.map(q => (
          <div key={q.step} style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:5 }}>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, color:q.confirmed?questConfirmed:questPending, flexShrink:0, width:14 }}>{q.confirmed?"✓":"○"}</span>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:8, color:q.confirmed?mainText:dimText, letterSpacing:1, minWidth:52 }}>{q.label}</span>
            <span style={{ fontFamily:"'Cinzel',serif", fontSize:8, color:q.confirmed?"#c9a84c":"rgba(126,200,227,0.2)", flex:1 }}>{q.confirmed?q.value:"—"}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background:panelBg, display:"flex", flexDirection:"column", height:"100%" }}>
      <canvas ref={canvasRef} width={560} height={320}
        style={{ display:"block", width:"100%", imageRendering:"pixelated", flexShrink:0 }} />

      <div style={{ padding:"10px 14px 16px", flex:1, overflowY:"auto", display:"flex", flexDirection:"column" }}>
        {paused ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:9, color:dimText, letterSpacing:1, textAlign:"center", marginBottom:4 }}>
              — Form mode active —
            </div>
            {renderQuestLog()}
            <button onClick={onResume}
              style={{ fontFamily:"'Cinzel',serif", fontSize:9, border:"1px solid #c9a84c", background:"transparent", color:"#c9a84c", padding:"8px 12px", cursor:"pointer", borderRadius:2, marginTop:8, letterSpacing:1 }}
              onMouseEnter={e=>{e.currentTarget.style.background="#c9a84c";e.currentTarget.style.color="#05080f";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#c9a84c";}}
            >✧ Resume Quest</button>
          </div>
        ) : (<>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:9, color:"#c9a84c", letterSpacing:2, marginBottom:5, textTransform:"uppercase" }}>
            Lyssara · Dispatch Keeper
          </div>
          <div style={{ border:dialogueBdr, background:dialogueBg, borderRadius:3, padding:"10px 12px", marginBottom:8 }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:11, color:mainText, lineHeight:1.9, whiteSpace:"pre-wrap", minHeight:"3em" }}>
              {displayText}
              {isTyping && <span style={{ display:"inline-block", width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:"8px solid #c9a84c", marginLeft:4, verticalAlign:"middle", animation:"triPulse 0.8s ease-in-out infinite" }} />}
            </div>
            {renderInline()}
            {renderSlotPicker()}
          </div>
          {menuVisible && !isTyping && (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>{renderMenu()}</div>
          )}
          {renderQuestLog()}
        </>)}
      </div>
    </div>
  );
}
