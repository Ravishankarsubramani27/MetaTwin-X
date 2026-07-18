import React, { useEffect, useRef, useState } from "react";
import { draw } from "./bodyDraw";

function rC(s){return s<0.4?"#10b981":s<0.7?"#f59e0b":"#ef4444"}
function rL(s){return s<0.4?"Normal":s<0.7?"Elevated":"Critical"}

function ptInPoly(px,py,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}

export default function Organ3D({risk}){
  const cvs=useRef(null), animId=useRef(null), hRef=useRef(null);
  const [hov,setHov]=useState(null);
  const sc={heart:risk?.heart??0.15,kidney:risk?.kidney??0.05,liver:risk?.liver??0.09};
  const W=660, H=640;

  // Organ hit zones (polygon points)
  const zones=[
    {key:"heart",  pts:[[W/2-50,220],[W/2-50,280],[W/2+10,280],[W/2+10,220]]},
    {key:"liver",  pts:[[W/2,268],[W/2+70,268],[W/2+80,360],[W/2+10,362],[W/2-10,330]]},
    {key:"kidney", pts:[[W/2-88,272],[W/2-48,272],[W/2-48,340],[W/2-88,340]]},
  ];

  useEffect(()=>{
    const c=cvs.current; if(!c)return;
    const g=c.getContext("2d");
    let t=0;
    function frame(){
      t+=0.016;
      draw(g,W,H,t,sc,hRef.current);
      animId.current=requestAnimationFrame(frame);
    }
    animId.current=requestAnimationFrame(frame);
    return()=>cancelAnimationFrame(animId.current);
  },[sc.heart,sc.kidney,sc.liver]);

  const onMove=e=>{
    const r=cvs.current.getBoundingClientRect();
    const mx=(e.clientX-r.left)*(W/r.width);
    const my=(e.clientY-r.top)*(H/r.height);
    let f=null;
    zones.forEach(({key,pts})=>{if(ptInPoly(mx,my,pts))f=key;});
    hRef.current=f; setHov(f);
  };

  return(
    <div style={{background:"#020810",borderRadius:14,overflow:"hidden",
                 marginBottom:20,boxShadow:"0 6px 32px rgba(0,0,0,0.6)"}}>
      {/* Header */}
      <div style={{padding:"13px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",
                   display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:"#f1f5f9",fontSize:14,fontWeight:700,fontFamily:"Inter,sans-serif"}}>
            Digital Twin — Medical Anatomical Model
          </div>
          <div style={{color:"#475569",fontSize:11,marginTop:2,fontFamily:"Inter,sans-serif"}}>
            Hover organs to inspect · Color = risk level · Live biometrics panel
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {hov&&(
            <span style={{
              background:rC(sc[hov]??"")+"22",
              border:`1px solid ${rC(sc[hov]??"")}55`,
              color:rC(sc[hov]??""),borderRadius:6,padding:"3px 10px",
              fontSize:11,fontWeight:700,textTransform:"capitalize",
            }}>{hov} · {rL(sc[hov]??0)} ({((sc[hov]??0)*100).toFixed(0)}%)</span>
          )}
          <span style={{background:"rgba(37,99,235,0.15)",border:"1px solid rgba(37,99,235,0.3)",
            color:"#60a5fa",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700}}>
            3D LIVE
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={cvs} width={W} height={H}
        onMouseMove={onMove} onMouseLeave={()=>{hRef.current=null;setHov(null);}}
        style={{width:"100%",height:"auto",display:"block",cursor:"crosshair"}}
      />

      {/* Legend */}
      <div style={{padding:"12px 20px",borderTop:"1px solid rgba(255,255,255,0.06)",
                   display:"flex",alignItems:"center",justifyContent:"space-between",
                   flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:18}}>
          {[["#10b981","Low < 40%"],["#f59e0b","Moderate 40-70%"],["#ef4444","High ≥ 70%"]].map(
            ([c,l])=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:9,height:9,borderRadius:"50%",background:c,
                            display:"inline-block",boxShadow:`0 0 6px ${c}`}}/>
              <span style={{color:"#94a3b8",fontSize:11,fontFamily:"Inter,sans-serif"}}>{l}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16}}>
          {[["❤️","Heart",sc.heart],["🟤","Liver",sc.liver],["🫘","Kidney",sc.kidney]].map(
            ([ic,n,s])=>(
            <div key={n} style={{textAlign:"center"}}>
              <div style={{fontSize:13}}>{ic}</div>
              <div style={{color:rC(s),fontSize:11,fontWeight:700,fontFamily:"Inter,sans-serif"}}>
                {(s*100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
