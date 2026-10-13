import { galleryConfig, photographs } from './config.js';
import { Gallery } from './gallery.js';
import { InteractionController } from './interaction-controller.js';
import { HandTracker } from './hand-tracking.js';
import { buildDebugPanel } from './debug-panel.js';

const $ = id => document.getElementById(id);
const app=$('app'), scene=$('galleryScene'), viewport=$('galleryViewport'), overlay=$('entryOverlay');
const controller=new InteractionController(galleryConfig);
const gallery=new Gallery(scene,viewport,photographs,galleryConfig,openFocus);
const ui={status:$('trackingStatus'),pill:$('trackingPill'),gesture:$('gestureValue'),icon:$('gestureIcon'),x:$('handXValue'),y:$('handYValue'),rotation:$('rotationValue'),speed:$('speedValue'),tilt:$('tiltValue'),confidence:$('confidenceValue'),fps:$('fpsValue')};
let tracker=null, tracking=false, lastTime=performance.now(), lastDebug=0, pinchReady=true, toastTimer;

gallery.onDragStart=()=>{controller.dragging=true;document.querySelector('.gallery-stage').classList.add('is-dragging');$('coachmark').classList.add('is-hidden')};
gallery.onDrag=(dx,dy)=>controller.drag(dx,dy);
gallery.onDragEnd=()=>{controller.dragging=false;document.querySelector('.gallery-stage').classList.remove('is-dragging')};
gallery.onTap=index=>openFocus(index);

function setStatus(label,state='idle'){ui.status.textContent=label;ui.pill.dataset.state=state;}
function showToast(message){$('toast').textContent=message;$('toast').classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('is-visible'),3500)}
function dismiss(){overlay.classList.add('is-dismissed');setTimeout(()=>overlay.hidden=true,950)}
function openGuide(){$('guidePanel').classList.add('is-open');$('guideScrim').classList.add('is-open');$('guidePanel').setAttribute('aria-hidden','false');$('helpButton').setAttribute('aria-expanded','true');$('guideClose').focus()}
function closeGuide(){$('guidePanel').classList.remove('is-open');$('guideScrim').classList.remove('is-open');$('guidePanel').setAttribute('aria-hidden','true');$('helpButton').setAttribute('aria-expanded','false')}
function showCoach(icon,title,text){$('coachIcon').textContent=icon;$('coachTitle').textContent=title;$('coachText').textContent=text;$('coachmark').classList.remove('is-hidden')}

async function startTracking(){
  if(tracking){tracker.stop();tracking=false;$('trackingButton').querySelector('span').textContent='Enable hand tracking';setStatus('Tracking inactive');controller.noHand();return;}
  dismiss();setStatus('Requesting camera…');$('cameraEmpty').hidden=true;
  tracker=new HandTracker($('cameraPreview'),$('landmarkCanvas'),galleryConfig,{
    onStatus:s=>{if(s==='active'){tracking=true;setStatus('Hand tracking active','active');$('trackingButton').querySelector('span').textContent='Stop hand tracking';showCoach('✋','Show one open palm','Move left or right to rotate · make a fist to hold the gallery')}},
    onFps:fps=>ui.fps.textContent=`${fps} FPS`,
    onNoHand:()=>{controller.noHand();ui.gesture.textContent='NO HAND';ui.icon.textContent='—';setStatus('No hand detected','idle')},
    onHand:data=>{controller.updateHand(data);ui.gesture.textContent=data.gesture;ui.icon.textContent=data.icon;ui.x.textContent=data.x.toFixed(2);ui.y.textContent=data.y.toFixed(2);ui.confidence.textContent=data.confidence.toFixed(2);setStatus(data.gesture==='FIST'?'Gallery held':data.gesture==='PALM'?'Palm controlling gallery':'Hand tracking active','active');if(data.gesture==='PINCH'&&pinchReady){pinchReady=false;openFocus(gallery.activeIndex)}if(data.gesture!=='PINCH')pinchReady=true;}
  });
  try{await tracker.start()}catch(error){tracking=false;setStatus('Camera unavailable','error');$('cameraEmpty').hidden=false;$('trackingButton').querySelector('span').textContent='Try hand tracking';showToast('Camera was not enabled. Mouse, touch, and keyboard controls are still ready.');console.warn(error)}
}

function openFocus(index){const photo=photographs[index],dialog=$('focusDialog');controller.targetSpeed=0;$('focusImage').src=photo.url;$('focusImage').alt=photo.title;$('focusTitle').textContent=photo.title;$('focusMeta').textContent=photo.meta;$('focusIndex').textContent=String(index+1).padStart(2,'0');try{dialog.showModal()}catch{dialog.setAttribute('open','')}if(!dialog.open)dialog.setAttribute('open','');$('closeFocusButton').focus()}
function closeFocus(){const dialog=$('focusDialog');if(typeof dialog.close==='function'&&dialog.open)dialog.close();dialog.removeAttribute('open')}

$('startButton').addEventListener('click',startTracking);$('mouseButton').addEventListener('click',()=>{dismiss();setStatus('Mouse / touch mode');showCoach('↔','Drag to browse','Move sideways to rotate · move up or down to tilt · tap the centre photo to open')});$('trackingButton').addEventListener('click',startTracking);
$('helpButton').addEventListener('click',()=>{$('guidePanel').classList.contains('is-open')?closeGuide():openGuide()});
$('guideClose').addEventListener('click',closeGuide);$('guideDone').addEventListener('click',closeGuide);$('guideScrim').addEventListener('click',closeGuide);$('coachClose').addEventListener('click',()=>$('coachmark').classList.add('is-hidden'));
$('settingsButton').addEventListener('click',()=>{const panel=$('debugPanel');if(innerWidth<=560){const open=panel.classList.toggle('is-open-mobile');$('settingsButton').setAttribute('aria-expanded',String(open));$('panelToggle').textContent=open?'×':'−';$('panelToggle').setAttribute('aria-label',open?'Close settings':'Collapse settings')}else{panel.classList.remove('is-collapsed');$('panelToggle').textContent='−';$('panelToggle').setAttribute('aria-expanded','true')}});
$('resetButton').addEventListener('click',()=>{controller.reset();showToast('Gallery reset')});
$('hideCameraButton').addEventListener('click',()=>{const hidden=$('cameraCard').classList.toggle('is-hidden');$('hideCameraButton').textContent=hidden?'Show':'Hide'});
$('cameraButton').addEventListener('click',()=>{$('cameraCard').classList.remove('is-hidden');$('hideCameraButton').textContent='Hide'});
$('panelToggle').addEventListener('click',()=>{const panel=$('debugPanel');if(innerWidth<=560){panel.classList.remove('is-open-mobile');$('settingsButton').setAttribute('aria-expanded','false');$('panelToggle').textContent='−';$('panelToggle').setAttribute('aria-label','Collapse settings');return}const collapsed=panel.classList.toggle('is-collapsed');$('panelToggle').textContent=collapsed?'+':'−';$('panelToggle').setAttribute('aria-expanded',String(!collapsed))});
$('modeButton').addEventListener('click',()=>{const production=app.dataset.mode!=='production';app.dataset.mode=production?'production':'lab';$('modeButton').textContent=production?'Lab view':'Clean view';$('modeButton').setAttribute('aria-pressed',String(production))});
$('fullscreenButton').addEventListener('click',async()=>{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()});
$('closeFocusButton').addEventListener('click',closeFocus);$('focusDialog').addEventListener('click',e=>{if(e.target===$('focusDialog'))closeFocus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('guidePanel').classList.contains('is-open'))closeGuide();else if(e.key==='Escape'&&$('focusDialog').open)closeFocus();if(e.key==='ArrowLeft')controller.nudge(-8);if(e.key==='ArrowRight')controller.nudge(8);if(e.key==='ArrowUp')controller.nudge(0,4);if(e.key==='ArrowDown')controller.nudge(0,-4);if(e.key==='Enter'&&!overlay.hidden)document.activeElement?.click();if(e.key==='Enter'&&overlay.hidden&&!$('focusDialog').open&&!$('guidePanel').classList.contains('is-open'))openFocus(gallery.activeIndex)});
buildDebugPanel($('debugControls'),galleryConfig,path=>{if(path==='radius'||path==='perspective')gallery.layout()});

function animate(now){const dt=(now-lastTime)/16.667;lastTime=now;const state=controller.frame(dt);gallery.render(state.rotation,state.tilt);if(now-lastDebug>80){ui.rotation.textContent=`${Math.round(((state.rotation%360)+360)%360)}°`;ui.speed.textContent=state.speed.toFixed(2);ui.tilt.textContent=`${Math.round(state.tilt)}°`;lastDebug=now}requestAnimationFrame(animate)}
requestAnimationFrame(animate);
window.addEventListener('beforeunload',()=>tracker?.stop());
