const {chromium}=require('playwright');const fs=require('fs');
const OUT=require('path').join(__dirname,'capturas')+'/';
const SUITE=require('path').resolve(__dirname,'../../..');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:940},deviceScaleFactor:2});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+SUITE+'/laser.html');await p.waitForTimeout(1500);
await p.addStyleTag({content:'#snackbar{display:none!important}'});
const ej=fs.readFileSync(SUITE+'/biblioteca_inicio/Nivel 3 - Arcos sencillos/10 - Inicio 310 (Nº 3318).json','utf8');
await p.evaluate(t=>abrirJSONDatos(JSON.parse(t)),ej);await p.waitForTimeout(600);
await p.evaluate(()=>{document.getElementById('projectName').value='Placa 310';});
const shot=async(n,el,pad=0)=>{ if(!el){await p.screenshot({path:OUT+n,type:'jpeg',quality:86});return;}
  const bb=await (typeof el==='string'?p.locator(el).first():el).boundingBox(); await p.screenshot({path:OUT+n,type:'jpeg',quality:88,clip:{x:Math.max(0,bb.x-pad),y:Math.max(0,bb.y-pad),width:bb.width+2*pad,height:bb.height+2*pad}});};
const marcas=async(lista)=>p.evaluate(l=>{document.querySelectorAll('.mk-man').forEach(x=>x.remove());l.forEach(([sel,n,dx,dy])=>{const e=document.querySelector(sel);if(!e)return;const r=e.getBoundingClientRect();const d=document.createElement('div');d.className='mk-man';d.textContent=n;Object.assign(d.style,{position:'fixed',left:(r.left+(dx||6))+'px',top:(r.top+(dy||6))+'px',width:'26px',height:'26px',borderRadius:'50%',background:'#C4580C',color:'#fff',font:'700 15px Segoe UI,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999,boxShadow:'0 1px 4px rgba(0,0,0,.4)'});document.body.appendChild(d);});},lista);
// 1) pantalla con zonas
await p.click('#tuFuenteLaser');await p.waitForTimeout(300);
await p.keyboard.press('Escape');
await marcas([['.top-bar',1,330,6],['#lasMesa',2,62,-4],['#c2TabsDibujo, .tool-strip, .toolbar-v, #herramientas',3,4,4],['#lienzo',4,220,60],['#tuFuenteSol',5,8,4],['#lasFuente',6,-14,4],['#lasBib',7,-14,4],['#lasResumen',8,-14,4]]);
await shot('pantalla.jpg');
await p.evaluate(()=>document.querySelectorAll('.mk-man').forEach(x=>x.remove()));
// 2) capas y fuente
await shot('laser_capas.jpg','#lasFuente',0);
const caja=async(a,bsel)=>{const A=await p.locator(a).boundingBox(),B=await p.locator(bsel).boundingBox();return {x:A.x-6,y:A.y-6,width:Math.max(A.width,B.width)+12,height:B.y+B.height-A.y+12};};
await p.screenshot({path:OUT+'laser_capas.jpg',type:'jpeg',quality:88,clip:await caja('#lasFuente','#lasPanel .las-caja:nth-of-type(2)')});
// 3) biblioteca
await p.locator('#lasBib').scrollIntoViewIfNeeded();await shot('biblioteca.jpg','#lasBib',4);
await p.click('button[data-a=nuevo-corte]');await p.fill('#bibMat','MDF del taller');await p.fill('#bibGro','3');await p.fill('#bibNot','probado el lunes: sale limpio');
await shot('biblioteca_form.jpg','#lasBibForm',4);await p.click('#bibNo');
// 4) resumen y botones
await p.locator('#lasResumen').scrollIntoViewIfNeeded();
await p.screenshot({path:OUT+'resumen.jpg',type:'jpeg',quality:88,clip:await caja('#lasResumen','#lasRLD')});
// 5) maquina
await p.evaluate(()=>{document.getElementById('lasMaq').open=true;});await p.locator('#lasMaq').scrollIntoViewIfNeeded();await p.waitForTimeout(200);await shot('maquina.jpg','#lasMaq',4);
await p.evaluate(()=>{document.getElementById('lasMaq').open=false;document.getElementById('lasPanel').scrollTop=0;});
// 6) solucion
await p.click('#tuFuenteSol');await p.waitForTimeout(400);
await p.evaluate(()=>{const s=document.querySelector('select[data-bib=corte]');const o=[...s.options].find(o=>/MDF 3/.test(o.text));if(o){s.value=o.value;s.dispatchEvent(new Event('change'));}});await p.waitForTimeout(400);
await shot('solucion.jpg','#tutorPanel',0);
await p.evaluate(()=>tuIrALinea(5));await p.waitForTimeout(400);
await shot('explicacion.jpg','#tuExplicar',6);
// 7) mesa
await p.click('#tuFuenteLaser');await p.check('#lasMesa');await p.waitForTimeout(600);
await p.evaluate(()=>{view.z*=1.0;render();});await p.waitForTimeout(300);
await shot('mesa.jpg','#lienzo',0);
await shot('portada.jpg');
// zoom a la pieza con la mesa para ver cero pieza y cabezal
await p.evaluate(()=>{encuadrar();view.z*=0.55;render();});await p.waitForTimeout(400);await shot('mesa_detalle.jpg','#lienzo',0);
await p.uncheck('#lasMesa');await p.waitForTimeout(300);await p.evaluate(()=>{encuadrar();});
// 8) vista previa
await p.click('#lasVer');await p.waitForTimeout(500);
await p.evaluate(()=>{const r=document.getElementById('lasSimR');r.value=620;r.dispatchEvent(new Event('input'));document.getElementById('lasCmds').hidden=false;});await p.waitForTimeout(300);
await shot('vista_previa.jpg','#modalLaser .modal',0);
await p.evaluate(()=>document.getElementById('modalLaser').classList.remove('visible'));
// 8b) plantilla de prueba
await p.click('#tuFuenteLaser');await p.waitForTimeout(200);await p.locator('#lasBib button[data-a=plantilla]').scrollIntoViewIfNeeded();await p.click('#lasBib button[data-a=plantilla]');await p.waitForTimeout(300);
await p.fill('#plMat','DM del taller');await p.fill('#plGro','3');await p.selectOption('#plCas','4');await p.fill('#plMed','9.82');await p.dispatchEvent('#plMed','input');await p.waitForTimeout(200);
await shot('plantilla.jpg','#modalPlantilla .modal',0);
await p.click('#plVer');await p.waitForTimeout(600);await shot('plantilla_vista.jpg','#modalLaser .modal',0);
await p.evaluate(()=>{document.getElementById('modalLaser').classList.remove('visible');document.getElementById('modalPlantilla').classList.remove('visible');});
// 9) G-code de un alumno
const nc=fs.readFileSync(SUITE+'/herramientas_desarrollo/pruebas/ISO GEO 01A - Alumno A.nc','utf8');
await p.evaluate(t=>LASER.abrirGcodeTexto(t,'ISO GEO 01A - Alumno A.nc'),nc);await p.waitForTimeout(400);
await p.evaluate(()=>{document.getElementById('lasPanel').scrollTop=0;});await p.waitForTimeout(200);
await p.screenshot({path:OUT+'gcode.jpg',type:'jpeg',quality:88,clip:await caja('#lasFuente','#lasFuente')});
await p.click('#lasVer');await p.waitForTimeout(500);await shot('gcode_vista.jpg','#modalLaser .modal',0);
console.log('errores',errs);await b.close();})();
