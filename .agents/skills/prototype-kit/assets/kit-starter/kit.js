/* Kit: komponen = fungsi -> string HTML. Teks dari data wajib lewat K.esc(). */
(function(){
const K = window.K = {};
const A = (o)=>Object.entries(o||{}).map(([k,v])=>v===false||v==null?'':` ${k}="${K.esc(v)}"`).join('');
K.esc = (s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
K.rupiah = (n)=>'Rp '+Number(n||0).toLocaleString('id-ID');
K.tanggal = (d)=>new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});

K.icon = (name,{size=16}={})=>`<svg class="k-ico" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" data-icon="${K.esc(name)}">${(window.K_ICONS||{})[name]||''}</svg>`;

K.button = ({label='',icon,variant='primary',size='md',state,href,action,attrs={}})=>{
  const tag = href?'a':'button';
  return `<${tag} class="k-btn" data-variant="${variant}" data-size="${size}"${state?` data-state="${state}"`:''}${href?` href="${K.esc(href)}"`:''}${action?` data-action="${K.esc(action)}"`:''}${A(attrs)}>${icon?K.icon(icon):''}${K.esc(label)}</${tag}>`;
};
K.pill = (text,tone='neutral',icon)=>`<span class="k-pill" data-tone="${tone}">${icon?K.icon(icon,{size:12}):''}${K.esc(text)}</span>`;
K.initials = (n)=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
K.avatar = (name,size=36)=>`<span class="k-avatar" data-i="${[...String(name)].reduce((a,c)=>a+c.charCodeAt(0),0)%6+1}" style="--s:${size}px" title="${K.esc(name)}">${K.esc(K.initials(name))}</span>`;
K.countBadge = (n,tone='primary')=>`<span class="k-badge" data-tone="${tone}">${n}</span>`;
K.banner = (text,tone='primary',icon='info')=>`<div class="k-banner" data-tone="${tone}">${K.icon(icon)}<div>${text}</div></div>`;
K.empty = ({icon='search',title='',text='',action=''})=>`<div class="k-empty">${K.icon(icon,{size:32})}<h3>${K.esc(title)}</h3><p>${K.esc(text)}</p>${action}</div>`;
K.card = (title,body,{action=''}={})=>`<section class="k-card">${title?`<header><span>${K.esc(title)}</span>${action}</header>`:''}<div>${body}</div></section>`;
K.infoRows = (rows)=>`<dl style="margin:0">${rows.map(([l,v])=>`<div class="k-info"><dt>${K.esc(l)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
K.kpiStrip = (items)=>`<div class="k-grid">${items.map(i=>`<a class="k-card k-kpi" data-tone="${i.tone||'neutral'}"${i.to?` href="#${i.to}"`:''}><span class="k-muted">${K.esc(i.label)}</span><b>${K.esc(i.value)}</b>${i.note?`<small class="k-muted">${K.esc(i.note)}</small>`:''}</a>`).join('')}</div>`;
K.meter = (value,max,{warnAt=80,label=''}={})=>{const p=Math.min(100,Math.round(value/max*100));return `<div><div class="k-row k-muted" style="justify-content:space-between"><span>${K.esc(label)}</span><span>${p}%</span></div><div class="k-meter" data-tone="${p>=warnAt?'warning':'primary'}"><i style="width:${p}%"></i></div></div>`;};
K.timeline = (events)=>`<ul class="k-tl">${events.map(e=>`<li data-tone="${e.tone||'neutral'}"><div>${e.text}</div><small class="k-muted">${K.esc(e.at)}${e.by?' · '+K.esc(e.by):''}</small></li>`).join('')}</ul>`;
K.searchInput = (placeholder='Cari...')=>`<label class="k-search">${K.icon('search')}<input type="search" placeholder="${K.esc(placeholder)}"></label>`;
K.toggle = ({label,checked=false})=>`<label class="k-toggle"><input type="checkbox"${checked?' checked':''}><span>${K.esc(label)}</span></label>`;

/* table: cols [{key,label,render?,align?}], rows [obj], rowHref(row) -> '/rute' */
K.table = ({cols,rows,rowHref,empty})=>{
  if(!rows.length) return empty||K.empty({title:'Belum ada data'});
  return `<div class="k-tablewrap"><table class="k-table"><thead><tr>${cols.map(c=>`<th${c.align?` data-align="${c.align}"`:''}>${K.esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr${rowHref?` data-href="${K.esc(rowHref(r))}"`:''}>${cols.map(c=>`<td${c.align?` data-align="${c.align}"`:''}>${c.render?c.render(r):K.esc(r[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
};
/* field: type text|select|textarea|... */
K.field = ({label,name,type='text',value='',options=[],hint='',error=''})=>{
  const id='f-'+name;
  const ctl = type==='select'?`<select id="${id}" name="${name}">${options.map(o=>`<option${o==value?' selected':''}>${K.esc(o)}</option>`).join('')}</select>`
    : type==='textarea'?`<textarea id="${id}" name="${name}" rows="3">${K.esc(value)}</textarea>`
    : `<input id="${id}" name="${name}" type="${type}" value="${K.esc(value)}">`;
  return `<div class="k-field"${error?' data-state="error"':''}><label for="${id}">${K.esc(label)}</label>${ctl}${(error||hint)?`<small>${K.esc(error||hint)}</small>`:''}</div>`;
};
K.pageHead = (title,actions='',back)=>`<div class="k-head"><div class="k-row">${back?K.button({icon:'arrow-left',variant:'ghost',href:'#'+back}):''}<h1>${K.esc(title)}</h1></div><div class="k-row">${actions}</div></div>`;

/* dialog & toast */
K.dialogHtml = (id,{title,body,actions=''})=>`<div class="k-overlay" id="dlg-${id}" data-open="false"><div class="k-dialog" role="dialog" aria-modal="true"><header>${K.esc(title)}</header><div>${body}</div><footer>${actions||K.button({label:'Tutup',variant:'secondary',action:'dialog:close'})}</footer></div></div>`;
K.toast = (msg,tone='primary')=>{let box=document.querySelector('.k-toasts');if(!box){box=document.body.appendChild(Object.assign(document.createElement('div'),{className:'k-toasts'}));}
  const t=document.createElement('div');t.className='k-toast';t.dataset.tone=tone;t.textContent=msg;box.appendChild(t);setTimeout(()=>t.remove(),2600);};

/* router hash: K.route('/pasien/:id', fn(params)) */
const routes=[];
K.route=(path,fn)=>routes.push({path,fn,re:new RegExp('^'+path.replace(/:[^/]+/g,'([^/]+)')+'$'),keys:(path.match(/:[^/]+/g)||[]).map(k=>k.slice(1))});
K.routes=()=>routes.map(r=>r.path);
K.go=(p)=>{location.hash='#'+p};
K.shell=null; // diisi screens: {brand, nav:[{label,icon,to,children?}]}
K.render=()=>{
  const path=(location.hash.slice(1)||'/').split('?')[0];
  const r=routes.find(r=>r.re.test(path));
  const params={};if(r){const m=path.match(r.re);r.keys.forEach((k,i)=>params[k]=decodeURIComponent(m[i+1]));}
  const body=r?r.fn(params):K.empty({icon:'alert-triangle',title:'Halaman belum dibuat',text:path});
  const s=K.shell||{brand:'Prototype',nav:[]};
  const nav=(items)=>items.map(i=>`<a href="#${i.to}"${path===i.to||path.startsWith(i.to+'/')&&i.to!=='/'?' data-state="active"':''}>${i.icon?K.icon(i.icon):''}${K.esc(i.label)}</a>${i.children&&path.startsWith(i.to)?`<div class="k-sub">${nav(i.children)}</div>`:''}`).join('');
  document.getElementById('app').innerHTML=`<div class="k-shell"><aside class="k-side"><div class="k-brand">${K.esc(s.brand)}</div><nav class="k-nav">${nav(s.nav)}</nav></aside><div class="k-main"><div class="k-top"><span class="k-muted">${K.esc(path)}</span><span class="k-row">${K.icon('bell')}${K.avatar('Admin',32)}</span></div><main class="k-page">${body}</main></div></div>`;
  scrollTo(0,0);
};
K.start=()=>{addEventListener('hashchange',K.render);K.render();};

/* aksi deklaratif */
document.addEventListener('click',(e)=>{
  const row=e.target.closest('tr[data-href]'); if(row&&!e.target.closest('a,button')){K.go(row.dataset.href);return;}
  const el=e.target.closest('[data-action]'); if(!el)return;
  const [t,a,...rest]=el.dataset.action.split(':');
  if(t==='dialog'&&a==='open')document.getElementById('dlg-'+rest[0])?.setAttribute('data-open','true');
  if(t==='dialog'&&a==='close')document.querySelectorAll('.k-overlay[data-open=true]').forEach(d=>d.dataset.open='false');
  if(t==='toast')K.toast(rest.join(':'),a);
  if(t==='go')K.go(a);
});
})();
