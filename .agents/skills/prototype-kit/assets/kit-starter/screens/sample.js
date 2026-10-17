/* Satu file per modul. Hanya memanggil K.* dan DATA.* (tanpa hex dan tanpa gaya inline statis). */
K.shell={brand:'Medilana',nav:[
  {label:'Beranda',icon:'home',to:'/'},
  {label:'Pasien',icon:'users',to:'/pasien'}
]};
const tone={Aktif:'success',Tertunda:'warning'};
K.route('/',()=>K.pageHead('Beranda')+K.kpiStrip([
  {label:'Pasien aktif',value:DATA.pasien.filter(p=>p.status==='Aktif').length,to:'/pasien'},
  {label:'Perlu tindakan',value:1,tone:'danger',note:'Tertunda'}]));
K.route('/pasien',()=>K.pageHead('Pasien',K.button({label:'Tambah',icon:'plus',action:'dialog:open:tambah'}))
  +K.table({rowHref:r=>'/pasien/'+r.id,rows:DATA.pasien,cols:[
    {key:'nama',label:'Nama',render:r=>K.avatar(r.nama,28)+' '+K.esc(r.nama)},
    {key:'kota',label:'Kota'},
    {key:'status',label:'Status',render:r=>K.pill(r.status,tone[r.status])},
    {key:'saldo',label:'Saldo',align:'right',render:r=>K.rupiah(r.saldo)}]})
  +K.dialogHtml('tambah',{title:'Tambah pasien',body:K.field({label:'Nama',name:'nama'})+K.field({label:'Kota',name:'kota',type:'select',options:['Depok','Bekasi','Jakarta']}),
    actions:K.button({label:'Batal',variant:'secondary',action:'dialog:close'})+K.button({label:'Simpan',action:'dialog:close'})}));
K.route('/pasien/:id',({id})=>{const p=DATA.pasien.find(x=>x.id===id);
  if(!p)return K.empty({title:'Tidak ditemukan'});
  return K.pageHead(p.nama,K.pill(p.status,tone[p.status]),'/pasien')
   +K.card('Profil',K.infoRows([['ID',K.esc(p.id)],['Kota',K.esc(p.kota)],['Saldo',K.rupiah(p.saldo)]]));});
