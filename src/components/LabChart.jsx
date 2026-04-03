import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";

const REFERENCE_RANGES = {
  "Hemoglobin":{low:12,high:16,unit:"g/dL"},"Hb":{low:12,high:16,unit:"g/dL"},
  "WBC":{low:4000,high:11000,unit:"/uL"},"Platelet":{low:150000,high:400000,unit:"/uL"},
  "Platelets":{low:150000,high:400000,unit:"/uL"},"Creatinine":{low:0.6,high:1.2,unit:"mg/dL"},
  "Urea":{low:15,high:40,unit:"mg/dL"},"Sodium":{low:135,high:145,unit:"mEq/L"},
  "Na":{low:135,high:145,unit:"mEq/L"},"Potassium":{low:3.5,high:5.0,unit:"mEq/L"},
  "K":{low:3.5,high:5.0,unit:"mEq/L"},"K+":{low:3.5,high:5.0,unit:"mEq/L"},
  "Lactate":{low:0,high:2.0,unit:"mmol/L"},"Bilirubin":{low:0,high:1.2,unit:"mg/dL"},
  "pH":{low:7.35,high:7.45,unit:""},"pCO2":{low:35,high:45,unit:"mmHg"},
  "HCO3":{low:22,high:26,unit:"mEq/L"},"Procalcitonin":{low:0,high:0.5,unit:"ng/mL"},
  "PCT":{low:0,high:0.5,unit:"ng/mL"},"CRP":{low:0,high:6,unit:"mg/L"},
  "INR":{low:0.8,high:1.2,unit:""},"SGOT":{low:0,high:40,unit:"U/L"},
  "SGPT":{low:0,high:40,unit:"U/L"},"Albumin":{low:3.5,high:5.0,unit:"g/dL"},
  "RBS":{low:70,high:140,unit:"mg/dL"},"HGT":{low:70,high:140,unit:"mg/dL"},
};

function Spark({data,color="#3b82f6",h=24,w=70}){
  const nums=data.map(Number).filter(n=>!isNaN(n)&&n>0);
  if(nums.length<2)return null;
  const mn=Math.min(...nums),mx=Math.max(...nums),rng=mx-mn||1;
  const pts=nums.map((v,i)=>`${(i/(nums.length-1))*w},${h-((v-mn)/rng)*h}`).join(" ");
  const trend=nums[nums.length-1]-nums[nums.length-2];
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
      <svg width={w} height={h+2} style={{overflow:"visible",verticalAlign:"middle"}}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={w} cy={h-((nums[nums.length-1]-mn)/rng)*h} r="2.5" fill={color}/>
      </svg>
      <span style={{fontSize:9,color:trend>0?"#ef4444":trend<0?"#10b981":"#94a3b8"}}>{trend>0?"↑":trend<0?"↓":"→"}</span>
    </span>
  );
}

const fc=(flag)=>flag==="critical"?{bg:"#fee2e2",tx:"#991b1b",bd:"#fca5a5"}:flag==="high"?{bg:"#fef3c7",tx:"#92400e",bd:"#fde68a"}:{bg:"#d1fae5",tx:"#065f46",bd:"#6ee7b7"};
const isAbn=(name,val)=>{const r=REFERENCE_RANGES[name];const n=parseFloat(val);if(!r||isNaN(n))return false;return n<r.low||n>r.high;};

export default function LabChart({labs}){
  const [sel,setSel]=useState("");

  const grouped=useMemo(()=>{
    const m={};
    (labs||[]).forEach(l=>{if(!m[l.test_name])m[l.test_name]=[];m[l.test_name].push(l);});
    Object.keys(m).forEach(k=>m[k].sort((a,b)=>new Date(a.recorded_at)-new Date(b.recorded_at)));
    return m;
  },[labs]);

  const names=Object.keys(grouped);
  const act=sel||names[0]||"";
  const actData=grouped[act]||[];
  const ref=REFERENCE_RANGES[act];
  const nums=actData.map(l=>parseFloat(l.value)).filter(n=>!isNaN(n));

  if(names.length===0) return(
    <div style={{background:"#fff",borderRadius:12,padding:"20px 13px",boxShadow:"0 1px 3px rgba(15,23,42,0.06)",textAlign:"center",color:"#cbd5e1",fontSize:13}}>
      No lab data recorded yet.
    </div>
  );

  return(
    <div>
      {/* Latest values grid — vitals card style */}
      <div style={{background:"#fff",borderRadius:12,padding:"11px 13px",marginBottom:8,boxShadow:"0 1px 3px rgba(15,23,42,0.06)"}}>
        <div style={{fontWeight:700,fontSize:11,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:9}}>Latest Results</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
          {names.map(name=>{
            const entries=grouped[name];
            const latest=entries[entries.length-1];
            const r=REFERENCE_RANGES[name];
            const abn=isAbn(name,latest.value);
            const crit=latest.flag==="critical";
            const vals=entries.map(e=>parseFloat(e.value)).filter(n=>!isNaN(n));
            return(
              <div key={name} onClick={()=>setSel(name)} style={{
                background:crit?"#fff1f2":abn?"#fffbeb":sel===name?"#eff6ff":"#f8fafc",
                borderRadius:8,padding:"8px 9px",cursor:"pointer",
                border:`1px solid ${crit?"#fecdd3":abn?"#fde68a":sel===name?"#bfdbfe":"#e2e8f0"}`,
              }}>
                <div style={{fontSize:9,color:crit?"#9f1239":abn?"#92400e":"#94a3b8",marginBottom:1}}>{name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:14,color:crit?"#be123c":abn?"#b45309":"#0f172a",lineHeight:1}}>{latest.value}</div>
                {r&&<div style={{fontSize:9,color:"#cbd5e1",marginTop:1}}>{r.unit}</div>}
                {vals.length>1&&<div style={{marginTop:3}}><Spark data={vals} color={crit?"#ef4444":abn?"#f59e0b":"#3b82f6"} h={18} w={55}/></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend detail */}
      {act&&actData.length>0&&(
        <div style={{background:"#fff",borderRadius:12,padding:"11px 13px",marginBottom:8,boxShadow:"0 1px 3px rgba(15,23,42,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontWeight:700,fontSize:11,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.5px"}}>{act} Trend</span>
              {ref&&<span style={{fontSize:10,color:"#94a3b8"}}>Normal: {ref.low}–{ref.high} {ref.unit}</span>}
            </div>
            <span style={{fontSize:10,color:"#94a3b8"}}>{actData.length} results</span>
          </div>

          {/* Large chart */}
          {nums.length>1&&(
            <div style={{background:"#f8fafc",borderRadius:8,padding:"12px 10px",marginBottom:8,textAlign:"center"}}>
              <Spark data={nums} color={actData[actData.length-1]?.flag==="critical"?"#ef4444":"#3b82f6"} h={60} w={Math.min(280,names.length>3?240:280)}/>
              {ref&&<div style={{fontSize:9,color:"#94a3b8",marginTop:4}}><span style={{color:"#10b981"}}>■</span> Normal: {ref.low}–{ref.high} {ref.unit}</div>}
            </div>
          )}

          {/* Table */}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:11,borderCollapse:"collapse",fontFamily:"'DM Mono',monospace"}}>
              <thead><tr style={{background:"#f8fafc"}}>
                <th style={{padding:"4px 6px",textAlign:"left",color:"#64748b",fontWeight:600,fontSize:10,borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>Date/Time</th>
                <th style={{padding:"4px 6px",textAlign:"left",color:"#64748b",fontWeight:600,fontSize:10,borderBottom:"1px solid #e2e8f0"}}>Value</th>
                <th style={{padding:"4px 6px",textAlign:"left",color:"#64748b",fontWeight:600,fontSize:10,borderBottom:"1px solid #e2e8f0"}}>Flag</th>
                {ref&&<th style={{padding:"4px 6px",textAlign:"left",color:"#64748b",fontWeight:600,fontSize:10,borderBottom:"1px solid #e2e8f0"}}>Range</th>}
              </tr></thead>
              <tbody>
                {[...actData].reverse().map((l,i)=>{const f=fc(l.flag);return(
                  <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                    <td style={{padding:"4px 6px",color:"#64748b",whiteSpace:"nowrap"}}>{l.recorded_at?format(parseISO(l.recorded_at),"dd/MM HH:mm"):"—"}</td>
                    <td style={{padding:"4px 6px",fontWeight:600,color:l.flag==="critical"?"#be123c":l.flag==="high"?"#b45309":"#0f172a"}}>{l.value}</td>
                    <td style={{padding:"4px 6px"}}><span style={{fontSize:9,padding:"1px 6px",borderRadius:10,fontWeight:700,background:f.bg,color:f.tx,border:`1px solid ${f.bd}`}}>{(l.flag||"normal").toUpperCase()}</span></td>
                    {ref&&<td style={{padding:"4px 6px",fontSize:10,color:"#94a3b8"}}>{ref.low}–{ref.high}</td>}
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test pills */}
      {names.length>1&&(
        <div style={{background:"#fff",borderRadius:12,padding:"11px 13px",boxShadow:"0 1px 3px rgba(15,23,42,0.06)"}}>
          <div style={{fontWeight:700,fontSize:11,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Switch Test</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {names.map(t=>{const latest=grouped[t][grouped[t].length-1];const f=fc(latest.flag);return(
              <button key={t} onClick={()=>setSel(t)} style={{fontSize:11,padding:"4px 10px",borderRadius:20,cursor:"pointer",fontWeight:600,background:t===act?"#0f172a":f.bg,color:t===act?"#fff":f.tx,border:t===act?"none":`1px solid ${f.bd}`}}>
                {t} ({grouped[t].length})
              </button>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}
