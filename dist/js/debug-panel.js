const groups = [
  ['Gallery', [['radius','Radius',280,650,5],['perspective','Perspective',650,1800,10]]],
  ['Rotation', [['rotation.maxSpeed','Max speed',.1,1.2,.01],['rotation.sensitivity','Sensitivity',.2,1.8,.01],['rotation.damping','Damping',.01,.25,.005]]],
  ['Tilt', [['tilt.sensitivity','Sensitivity',.2,2,.01],['tilt.damping','Damping',.01,.25,.005],['tilt.max','Upward limit',10,50,1]]],
  ['Tracking', [['tracking.gestureThreshold','Gesture threshold',.3,1,.01],['tracking.deadZone','Hand dead zone',0,.22,.01]]],
];
const get = (o,p) => p.split('.').reduce((v,k)=>v[k],o);
const set = (o,p,v) => { const keys=p.split('.'); const key=keys.pop(); keys.reduce((v,k)=>v[k],o)[key]=v; };

export function buildDebugPanel(container, config, onChange) {
  groups.forEach(([name, controls]) => {
    const section=document.createElement('section'); section.className='control-group'; section.innerHTML=`<h3>${name}</h3>`;
    controls.forEach(([path,label,min,max,step]) => {
      const wrap=document.createElement('label'); wrap.className='range-control'; const value=get(config,path);
      wrap.innerHTML=`<span class="range-label"><span>${label}</span><output>${value}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;
      const input=wrap.querySelector('input'), output=wrap.querySelector('output'); input.addEventListener('input',()=>{ const val=Number(input.value); set(config,path,val); output.value=val; onChange(path,val); }); section.append(wrap);
    }); container.append(section);
  });
}
