/* Original SVG picture vocabulary. Labels are accessible text, never baked into trivia art. */
window.LearningArt = (() => {
  const names = {
    fish:['דג','рыба'],dolphin:['דולפין','дельфин'],octopus:['תמנון','осьминог'],whale:['לווייתן','кит'],seahorse:['סוסון ים','морской конёк'],jellyfish:['מדוזה','медуза'],
    owl:['ינשוף','сова'],fox:['שועל','лиса'],squirrel:['סנאי','белка'],deer:['אייל','олень'],woodpecker:['נקר','дятел'],lion:['אריה','лев'],giraffe:['ג׳ירפה','жираф'],zebra:['זברה','зебра'],elephant:['פיל','слон'],polarBear:['דוב קוטב','белый медведь'],emperorPenguin:['פינגווין קיסרי','императорский пингвин'],walrus:['ניבתן','морж'],camel:['גמל','верблюд'],fennec:['שועל פנק','фенек'],scorpion:['עקרב','скорпион'],
    cat:['חתול','кот'],dog:['כלב','собака'],rabbit:['ארנב','кролик'],cow:['פרה','корова'],sheep:['כבש','овца'],duck:['ברווז','утка'],hen:['תרנגולת','курица'],bee:['דבורה','пчела'],butterfly:['פרפר','бабочка'],snake:['נחש','змея'],lizard:['לטאה','ящерица'],caterpillar:['זחל','гусеница'],
    sea:['ים','море'],forest:['יער','лес'],savanna:['סוואנה','саванна'],polar:['אזור קוטבי','полярная область'],desert:['מדבר','пустыня'],feathers:['נוצות','перья'],fur:['פרווה','мех'],scales:['קשקשים','чешуя'],road:['כביש','дорога'],air:['שמיים','небо'],rails:['מסילה','рельсы'],space:['חלל','космос'],
    car:['מכונית','машина'],bus:['אוטובוס','автобус'],bicycle:['אופניים','велосипед'],truck:['משאית','грузовик'],boat:['סירה','лодка'],sailboat:['סירת מפרש','парусник'],submarine:['צוללת','подводная лодка'],plane:['מטוס','самолёт'],helicopter:['מסוק','вертолёт'],balloon:['כדור פורח','воздушный шар'],train:['רכבת','поезд'],tram:['חשמלית','трамвай'],rocket:['חללית','ракета'],
    honey:['דבש','мёд'],milk:['חלב','молоко'],egg:['ביצה','яйцо'],wool:['צמר','шерсть'],appleTree:['עץ תפוח','яблоня'],apple:['תפוח','яблоко'],carrot:['גזר','морковь'],pear:['אגס','груша'],banana:['בננה','банан'],flower:['פרח','цветок'],tree:['עץ','дерево'],house:['בית','дом'],star:['כוכב','звезда'],moon:['ירח','луна'],sun:['שמש','солнце'],ball:['כדור','мяч'],book:['ספר','книга'],key:['מפתח','ключ'],cup:['כוס','стакан'],umbrella:['מטרייה','зонт'],clock:['שעון','часы'],kite:['עפיפון','воздушный змей'],matches:['גפרורים','спички'],origami:['קיפול נייר','оригами'],trivia:['איורים','картинки'],hebrew:['עברית','иврит'],maze:['מבוך','лабиринт'],covering:['מעטה הגוף','покров тела'],wheat:['חיטה','пшеница'],bread:['לחם','хлеб'],orangeTree:['עץ תפוז','апельсиновое дерево'],orange:['תפוז','апельсин'],oliveTree:['עץ זית','оливковое дерево'],oil:['שמן זית','оливковое масло']
  };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = id => { if (!names[id]) throw new Error(`Unknown illustration: ${id}`); return { he: names[id][0], ru: names[id][1] }; };
  const ellipse = (x,y,rx,ry,fill,extra='') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
  const circle = (x,y,r,fill,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const rect = (x,y,w,h,fill,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" ${extra}/>`;
  const path = (d,fill,extra='') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const line = (x1,y1,x2,y2,color='#5e4779',width=4,extra='') => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
  const eyes = (x=67,y=65,gap=26) => circle(x,y,3,'#3d3151')+circle(x+gap,y,3,'#3d3151');
  const leaf = (x,y) => path(`M${x} ${y}q-7-24 19-21q-1 19-19 21`,'#72bc88');
  const star = (x,y,r=22,color='#ffd261') => { const pts=Array.from({length:10},(_,i)=>{const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;return `${x+Math.cos(a)*rr},${y+Math.sin(a)*rr}`;}).join(' ');return `<polygon points="${pts}" fill="${color}"/>`; };
  function mammal(id) {
    const color = ({cat:'#e7b27d',dog:'#c39878',fox:'#df965d',fennec:'#e8c78d',rabbit:'#c6bbdc',polarBear:'#f4f2e8',cow:'#f6f1e6',sheep:'#f3ecdf',lion:'#e9bb6a',deer:'#d0a47c',squirrel:'#b8825d',walrus:'#bf9c8b'})[id] || '#d5b484';
    let body = ellipse(80,96,38,28,color);
    if (id === 'squirrel') body = path('M113 111q43-38 10-70q-29-20-26 7q40-6 2 38','#b8825d') + body;
    if (id === 'lion') body += circle(80,57,36,'#bc7e4c');
    if (id === 'rabbit') body += ellipse(65,28,10,25,color)+ellipse(95,28,10,25,color)+ellipse(65,28,4,16,'#e7afbc')+ellipse(95,28,4,16,'#e7afbc');
    else if (id === 'fox' || id === 'cat' || id === 'fennec') {
      const top=id==='fennec'?8:22;
      body+=path(`M50 55L48 ${top}L72 42M89 42L113 ${top}L111 57`,color)+path(`M55 40L54 ${top+11}L66 43M96 43L108 ${top+11}L106 43`,'#e4adad');
    } else if (id === 'dog') body += ellipse(48,56,12,24,'#987057')+ellipse(112,56,12,24,'#987057');
    else body += circle(52,38,12,color)+circle(108,38,12,color);
    body+=ellipse(80,64,32,29,color)+ellipse(80,79,18,12,id==='cow'?'#e7a7b0':'#fff3df')+eyes()+path('M75 74q5 7 10 0','#5b4350');
    if(id==='cat'||id==='fox'||id==='fennec') body+=line(55,76,37,72,'#8b6b63',2)+line(55,81,38,83,'#8b6b63',2)+line(105,76,123,72,'#8b6b63',2);
    if(id==='cow') body+=ellipse(65,48,10,11,'#756d77')+ellipse(100,100,14,16,'#756d77')+path('M53 36L44 26L46 44M107 36L116 26L114 44','#c6ac83');
    if(id==='sheep') body=Array.from({length:10},(_,i)=>circle(80+Math.cos(i*.63)*29,88+Math.sin(i*.63)*25,13,'#fff8e8')).join('')+body;
    if(id==='deer') body+=path('M58 38L48 13M49 23L37 17M50 26L58 16M102 38L112 13M111 23L123 17M110 26L102 16','none','stroke="#976c48" stroke-width="5" stroke-linecap="round"');
    if(id==='walrus') body+=path('M65 83L69 110L75 83M85 83L91 110L95 83','#fff9e5');
    return body;
  }
  function draw(id) {
    if(id==='orangeTree'||id==='oliveTree')return draw('tree')+[circle(48,64,id==='orangeTree'?8:5,id==='orangeTree'?'#e9af58':'#7b9161'),circle(87,36,id==='orangeTree'?8:5,id==='orangeTree'?'#e9af58':'#7b9161'),circle(109,65,id==='orangeTree'?8:5,id==='orangeTree'?'#e9af58':'#7b9161')].join('');
    if(id==='orange')return circle(80,79,41,'#edb463')+leaf(83,42)+line(80,41,84,29,'#9d895b',4);
    if(id==='wheat')return [48,80,112].map((x,i)=>line(x,125,x,24+i%2*9,'#bb9d5e',4)+Array.from({length:4},(_,j)=>ellipse(x-7,36+j*15+i%2*9,6,12,'#e7cb7f','transform="rotate(-30 '+(x-7)+' '+(36+j*15+i%2*9)+')"')+ellipse(x+7,43+j*15+i%2*9,6,12,'#e7cb7f','transform="rotate(30 '+(x+7)+' '+(43+j*15+i%2*9)+')"')).join('')).join('');
    if(id==='bread')return path('M29 96Q20 42 67 38Q133 21 137 88L130 112H39Z','#d7aa70')+path('M57 50L46 75M85 43L71 71M112 47L97 74','none','stroke="#f6dcaa" stroke-width="7" stroke-linecap="round"');
    if(id==='oil')return rect(58,16,44,14,'#9fa773')+path('M61 29H99V47L115 61V125H45V61L61 47Z','#ced09a','stroke="#a5ac70" stroke-width="3"')+rect(47,76,66,46,'#c8bc6a')+ellipse(80,92,23,15,'#f4e9b6')+leaf(78,102);
    if(['cat','dog','fox','fennec','rabbit','polarBear','cow','sheep','lion','deer','squirrel','walrus'].includes(id)) return mammal(id);
    if(id==='fish')return path('M112 70L142 43V97Z','#f0ac65')+ellipse(72,70,47,31,'#78bacc')+circle(46,65,5,'#3d3151')+path('M73 39L92 28L92 45M72 99L92 110L92 94','#5da1b9')+path('M86 47Q69 70 86 93','none','stroke="#4f91a9" stroke-width="4"');
    if(id==='dolphin')return path('M19 77q38-62 94-32l26-12-10 24q-9 56-66 48l-12 18-8-23q-20-4-24-23','#8ab6ce')+path('M54 61L71 25L86 51','#699cb8')+circle(112,59,4,'#3d3151');
    if(id==='whale')return path('M21 75q0-40 52-40q58 0 52 49l18-12 6 24-25 7q-94 35-103-28','#83a9d4')+path('M72 91q14 20 29 9','#658cba')+circle(45,68,4,'#3d3151')+path('M68 27q-8-20-17-9M70 27q8-20 18-9','none','stroke="#8ccedb" stroke-width="5" stroke-linecap="round"');
    if(id==='octopus')return Array.from({length:6},(_,i)=>path(`M${38+i*16} 79q-6 40 ${i<3?-13:13} 30`,'none','stroke="#b485cf" stroke-width="12" stroke-linecap="round"')).join('')+ellipse(80,60,43,39,'#bd96d7')+eyes(65,59,30);
    if(id==='jellyfish')return path('M34 73a46 44 0 0 1 92 0q-9 12-18 0q-9 12-18 0q-9 12-18 0q-9 12-18 0q-10 12-20 0','#c5a3df')+Array.from({length:5},(_,i)=>path(`M${48+i*16} 76q-12 17 0 34`,'none','stroke="#b690d4" stroke-width="6" stroke-linecap="round"')).join('');
    if(id==='seahorse')return path('M88 29q-32 0-30 30l-20 6 22 7q-6 31 17 37q24 7 25-12q0-16-14-12q-10 2-4 9q-11-3-12-14q31-16 30-35q0-16-14-16','#edbd74')+circle(77,43,4,'#3d3151')+path('M94 65L121 80L96 86','#dfa85a');
    if(id==='giraffe')return rect(60,47,27,66,'#edca79')+ellipse(78,102,39,22,'#edca79')+ellipse(77,37,24,21,'#edca79')+rect(54,109,11,19,'#edca79')+rect(97,109,11,19,'#edca79')+line(68,20,65,10,'#b58b53',5)+line(85,20,89,10,'#b58b53',5)+circle(65,10,4,'#b58b53')+circle(89,10,4,'#b58b53')+circle(80,35,3,'#3d3151')+[60,79,96].map((x,i)=>circle(x,99+i%2*8,7,'#b98c52')).join('')+circle(73,66,6,'#b98c52');
    if(id==='elephant')return ellipse(78,87,50,31,'#a9b8cb')+ellipse(57,58,31,29,'#a9b8cb')+ellipse(84,66,22,27,'#93a6be')+path('M31 63q-11 23-4 38q7 9 17 0','none','stroke="#a9b8cb" stroke-width="16" stroke-linecap="round"')+circle(48,55,3,'#3d3151')+rect(48,103,16,23,'#a9b8cb')+rect(97,103,16,23,'#a9b8cb');
    if(id==='zebra')return ellipse(79,87,46,27,'#f3f0e7')+path('M45 79L43 40L61 26L75 39L64 83','#f3f0e7')+path('M43 43L39 25L50 35M61 28L71 20L73 42','#6b6278')+rect(48,102,10,25,'#f3f0e7')+rect(102,102,10,25,'#f3f0e7')+[65,83,101].map(x=>line(x,66,x-7,104,'#6b6278',7)).join('')+line(47,58,65,60,'#6b6278',6)+circle(51,42,3,'#3d3151');
    if(id==='camel')return path('M23 100V64l15-23 16 8 5 32q16-42 33-3q18-39 38 6v18','#dbb67c')+ellipse(82,98,49,19,'#dbb67c')+rect(43,104,10,25,'#dbb67c')+rect(112,104,10,25,'#dbb67c')+ellipse(39,44,22,14,'#dbb67c')+circle(30,40,3,'#3d3151');
    if(id==='scorpion')return ellipse(82,90,29,17,'#bd9969')+path('M104 85q35-17 12-44q-15-13-18 1l12 6','none','stroke="#bd9969" stroke-width="12" stroke-linecap="round"')+path('M58 83L34 65L25 74M57 94L34 110M73 105L68 123M90 105L99 123M52 81L32 45M32 45L20 40M32 45L37 32','none','stroke="#bd9969" stroke-width="6" stroke-linecap="round"');
    if(['owl','woodpecker','hen','duck','emperorPenguin'].includes(id)){
      const color=({owl:'#b49acb',woodpecker:'#686d84',hen:'#fff2ce',duck:'#e8c860',emperorPenguin:'#59657b'})[id];
      let result=ellipse(80,85,34,35,color)+circle(80,51,27,color)+ellipse(80,91,20,26,'#fff6dc');
      if(id==='owl')result+=circle(66,51,14,'#fff4dd')+circle(94,51,14,'#fff4dd')+path('M54 34L48 13L73 29M87 29L110 13L106 34',color);
      if(id==='hen')result+=circle(72,23,8,'#d97775')+circle(83,20,8,'#d97775')+circle(93,25,7,'#d97775')+path('M111 84L135 62L126 98',color);
      if(id==='woodpecker')result+=path('M57 29L75 6L95 31','#d77c70')+rect(111,28,13,99,'#ae8c66');
      result+=eyes(68,51,24)+(id==='duck'?ellipse(80,65,19,8,'#e6a661'):path('M72 61L88 61L80 72','#e8aa58'))+line(63,118,57,126,'#dba65b',6)+line(97,118,103,126,'#dba65b',6);
      if(id==='emperorPenguin')result+=path('M56 70L65 76L64 91M104 70L95 76L96 91','none','stroke="#e2b65b" stroke-width="7"');
      return result;
    }
    if(id==='bee')return ellipse(68,41,19,22,'#d7eef0')+ellipse(96,41,19,22,'#d7eef0')+ellipse(80,78,36,26,'#ebcb64')+rect(62,55,9,46,'#71627b')+rect(84,55,9,46,'#71627b')+circle(113,73,15,'#ebcb64')+circle(119,69,3,'#3d3151')+line(108,58,109,48,'#71627b',3);
    if(id==='butterfly')return ellipse(53,57,28,32,'#c695d8','transform="rotate(-25 53 57)"')+ellipse(107,57,28,32,'#e2a1bb','transform="rotate(25 107 57)"')+ellipse(58,97,23,25,'#e6bd6c')+ellipse(102,97,23,25,'#9bb8d8')+rect(75,42,10,70,'#716079')+line(78,46,66,28,'#716079',3)+line(83,46,95,28,'#716079',3)+circle(52,55,10,'#f7e5b5')+circle(109,55,10,'#f7dce7');
    if(id==='caterpillar')return [0,1,2,3,4].map(i=>circle(39+i*20,85-Math.sin(i)*9,16,i%2?'#94be79':'#b7d38e')).join('')+eyes(113,72,9)+line(117,64,112,53,'#71935e',3);
    if(id==='snake')return path('M33 103q-17-26 22-25q70 13 47-13q-29-25 5-31','none','stroke="#91bb7b" stroke-width="24" stroke-linecap="round"')+ellipse(111,32,19,13,'#91bb7b')+circle(117,29,3,'#3d3151')+path('M130 35L145 35M141 35L145 30','none','stroke="#cc8e8a" stroke-width="3"');
    if(id==='lizard')return path('M27 113Q52 86 72 79L91 52','none','stroke="#8fba79" stroke-width="16" stroke-linecap="round"')+ellipse(94,49,20,13,'#8fba79','transform="rotate(-30 94 49)"')+path('M60 87L41 63L29 68M72 77L91 100L104 97M81 63L62 45L51 50M87 62L112 70L123 59','none','stroke="#8fba79" stroke-width="7" stroke-linecap="round"')+circle(102,42,3,'#3d3151');
    if(['forest','savanna','desert','polar','sea','road','air','rails','space'].includes(id))return scene(id);
    if(id==='feathers')return path('M41 112Q51 24 117 22Q132 83 41 112','#8db3cf')+line(43,113,109,31,'#557a9e',4)+[0,1,2,3].map(i=>line(56+i*12,96-i*15,43+i*10,69-i*12,'#d2e8f3',3)).join('');
    if(id==='fur')return rect(25,25,110,95,'#c6a481')+Array.from({length:30},(_,i)=>path(`M${35+i%6*18} ${39+Math.floor(i/6)*17}l5-10l5 10`,'none','stroke="#9f7d61" stroke-width="3" stroke-linejoin="round"')).join('');
    if(id==='scales')return rect(23,24,114,95,'#8fc0b8')+Array.from({length:25},(_,i)=>path(`M${25+i%5*23} ${30+Math.floor(i/5)*18}q11 26 23 0`,'none','stroke="#5c9690" stroke-width="3"')).join('');
    if(['car','bus','truck','train','tram'].includes(id)){
      const rail=id==='train'||id==='tram', color=id==='car'?'#d78f9e':id==='bus'?'#e9c265':rail?'#9b9bcd':'#82bbae';
      return (rail?line(15,121,145,121,'#857391',4):'')+rect(24,58,112,47,color)+path('M44 58L57 35H107L122 58',color)+[0,1,2].map(i=>rect(51+i*23,42,18,22,'#d8eef5')).join('')+circle(49,107,13,'#60546f')+circle(113,107,13,'#60546f')+circle(49,107,6,'#d8d0dd')+circle(113,107,6,'#d8d0dd')+(id==='truck'?rect(18,43,72,49,color):'');
    }
    if(id==='bicycle')return circle(37,98,25,'none','stroke="#746184" stroke-width="6"')+circle(123,98,25,'none','stroke="#746184" stroke-width="6"')+path('M37 98L65 58L94 98H37L76 81L116 51L123 98M58 56H77M106 47H125','none','stroke="#78adab" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"');
    if(['boat','sailboat','submarine'].includes(id)){
      if(id==='submarine')return rect(27,64,111,44,'#e4c262')+rect(73,43,27,22,'#e4c262')+line(88,45,88,31,'#b59545',7)+line(88,31,103,31,'#b59545',7)+[52,80,108].map(x=>circle(x,85,10,'#afd0db','stroke="#b99543" stroke-width="4"')).join('')+path('M23 75L10 62V108L23 95','#cba452');
      return path('M20 89H141L123 119H46Z','#a18abf')+path('M79 25V88H31Z','#f3d182')+path('M85 38L126 83H85Z','#a6d7ce')+line(80,22,80,90,'#75617f',4)+path('M18 125q15-10 30 0t30 0t30 0t30 0','none','stroke="#91c3d3" stroke-width="4"');
    }
    if(id==='plane')return path('M16 80L68 64L76 23L90 23L95 63L145 80V92L94 82L93 108L112 117V126L80 117L49 126V117L68 108L67 82L16 92Z','#9dbbd8')+path('M77 33L87 33V79H77Z','#d9eaf2');
    if(id==='helicopter')return ellipse(79,87,44,26,'#91b8ad')+ellipse(57,83,18,17,'#d1eaf1')+path('M115 82L147 66L148 82L116 98','#91b8ad')+line(79,61,79,45,'#76647f',5)+line(30,44,130,44,'#76647f',5)+line(44,119,110,119,'#76647f',5)+line(55,104,55,117,'#76647f',4)+line(98,107,98,117,'#76647f',4);
    if(id==='balloon')return ellipse(80,53,40,43,'#d99db3')+ellipse(80,53,18,43,'#efc873')+line(53,84,66,113,'#a48a6c',3)+line(107,84,94,113,'#a48a6c',3)+rect(64,110,32,22,'#b79a72');
    if(id==='rocket')return path('M58 88Q53 46 80 15Q107 46 102 88Z','#f5eee3')+circle(80,56,13,'#9dbbd9','stroke="#7c8ea8" stroke-width="4"')+path('M58 74L38 105H61M102 74L122 105H99','#bd98ce')+path('M66 90L72 129L80 115L89 129L95 90','#edc265');
    if(id==='apple'||id==='pear')return (id==='apple'?path('M80 44C20 21 21 107 61 120Q81 113 99 120C139 108 140 21 80 44','#df8e8e'):path('M70 30Q54 43 58 65Q20 99 56 122Q94 144 115 110Q126 88 97 65Q98 38 87 30Z','#b5ca74'))+line(80,41,85,22,'#8c7555',5)+leaf(86,32);
    if(id==='banana')return path('M38 35Q36 112 128 101Q97 145 46 107Q13 78 30 28Z','#edcf66')+path('M37 40Q44 103 115 103','none','stroke="#d7b44c" stroke-width="4"');
    if(id==='carrot')return path('M58 48L108 62L59 128Q49 137 49 123Z','#e8aa65')+path('M70 51Q39 23 53 15Q74 17 79 45Q75 13 90 12Q109 26 86 50Q113 25 125 38Q130 56 96 59','#88b378')+line(60,74,77,80,'#cf8b4c',3)+line(54,96,65,99,'#cf8b4c',3);
    if(id==='tree'||id==='appleTree')return rect(70,74,21,53,'#ae8b6b')+circle(53,61,28,'#9cc58a')+circle(105,61,28,'#9cc58a')+circle(79,38,32,'#a6ce91')+(id==='appleTree'?[circle(50,63,8,'#d78c86'),circle(86,34,8,'#d78c86'),circle(104,65,8,'#d78c86')].join(''):'');
    if(id==='flower')return line(80,71,80,124,'#86b17c',8)+leaf(79,109)+Array.from({length:6},(_,i)=>{let a=i*Math.PI/3;return circle(80+Math.cos(a)*24,51+Math.sin(a)*24,18,'#dca4c5');}).join('')+circle(80,51,17,'#f0cf72');
    if(id==='house')return rect(38,61,84,64,'#f0d3a0')+path('M23 65L80 17L137 65Z','#bf97b2')+rect(70,88,22,37,'#aa8bb2')+rect(46,77,18,18,'#aacbdc')+rect(99,77,17,18,'#aacbdc');
    if(id==='sun')return Array.from({length:12},(_,i)=>{let a=i*Math.PI/6;return line(80+Math.cos(a)*42,70+Math.sin(a)*42,80+Math.cos(a)*56,70+Math.sin(a)*56,'#e8bd58',6);}).join('')+circle(80,70,32,'#f3d17d');
    if(id==='moon')return path('M100 18Q36 8 28 65Q25 125 91 124Q119 119 130 94Q82 105 68 69Q53 35 100 18','#c5bbe0');
    if(id==='star')return star(80,70,54);
    if(id==='ball')return circle(80,70,49,'#a6bfd8')+path('M32 68Q71 51 81 21M80 119Q77 80 127 72','none','stroke="#f1dfac" stroke-width="16"')+path('M49 31Q66 70 115 103','none','stroke="#c4a1ce" stroke-width="12"');
    if(id==='book')return path('M18 29Q50 19 80 38Q111 19 142 29V113Q111 103 80 121Q49 103 18 113Z','#ac9ccc')+path('M24 35Q52 27 75 43V111Q51 99 24 107M85 43Q108 27 136 35V107Q107 99 85 111','#faf4e6')+line(80,41,80,119,'#88719f',3);
    if(id==='key')return circle(53,54,25,'none','stroke="#d9b765" stroke-width="12"')+line(72,73,122,122,'#d9b765',13)+line(101,101,114,87,'#d9b765',12)+line(114,114,128,100,'#d9b765',12);
    if(id==='cup')return path('M39 32H115L106 119H49Z','#a4c3d3')+path('M114 48Q145 43 140 74Q136 92 111 86','none','stroke="#a4c3d3" stroke-width="10"')+ellipse(77,32,38,9,'#d8e8ed');
    if(id==='umbrella')return path('M20 70Q27 13 80 14Q134 13 140 70Q125 54 111 70Q94 54 80 70Q65 54 49 70Q35 54 20 70','#b2a2d2')+path('M80 69V112Q80 137 99 122','none','stroke="#8c759f" stroke-width="7" stroke-linecap="round"');
    if(id==='clock')return circle(80,70,48,'#f8edcf','stroke="#b5a0ce" stroke-width="8"')+line(80,70,80,36,'#79618f',5)+line(80,70,106,84,'#79618f',5)+[0,1,2,3].map(i=>{let a=i*Math.PI/2;return circle(80+Math.cos(a)*38,70+Math.sin(a)*38,3,'#b49ac6');}).join('');
    if(id==='kite')return path('M79 10L117 51L79 96L42 51Z','#e7c579')+path('M79 10V96L42 51Z','#bd9ed4')+path('M79 97q-20 18 3 29','none','stroke="#8e77a5" stroke-width="3"')+path('M75 112L61 108L66 120Z','#dba1ba');
    if(id==='egg')return path('M80 15C43 16 15 118 80 125C146 119 117 16 80 15','#f4e9cf','stroke="#d1bfa0" stroke-width="3"');
    if(id==='milk')return path('M52 15H102L113 40V125H45V40Z','#f5f1e8','stroke="#c5c8d9" stroke-width="3"')+rect(46,60,66,40,'#a3bfd5')+path('M52 15L65 40H113M65 40V58','none','stroke="#c5c8d9" stroke-width="3"');
    if(id==='honey')return rect(42,35,76,87,'#ebc674')+rect(39,26,82,16,'#b99b6d')+ellipse(80,81,24,22,'#f7df9b')+path('M80 56Q49 89 80 99Q109 88 80 56','#d4a04d');
    if(id==='wool')return circle(80,76,43,'#c3a2d6')+path('M50 42Q104 35 118 70M40 71Q66 30 108 45M46 101Q64 61 117 57M69 116Q64 79 111 88M38 76Q60 112 106 109','none','stroke="#a47bbb" stroke-width="4"')+path('M119 89Q145 98 130 119Q119 130 145 127','none','stroke="#a47bbb" stroke-width="4"');
    if(id==='matches')return [0,1,2].map(i=>line(42+i*33,111,58+i*27,32,'#d4ac72',8)+circle(58+i*27,31,7,'#d88378')).join('');
    if(id==='origami')return path('M19 61L138 18L109 119L74 83L44 112L48 73Z','#9fcbbd')+path('M19 61L74 83L138 18L48 73','#c6e5d9')+line(74,83,109,119,'#72a795',3);
    if(id==='trivia')return rect(20,31,120,83,'#d8e8f5','stroke="#9ab5d1" stroke-width="4"')+circle(112,54,12,'#edcc77')+path('M24 109L59 65L87 91L104 73L137 109Z','#91bdaa');
    if(id==='hebrew')return path('M23 27H137V119H23Z','#efcbd2')+'<text x="80" y="94" font-family="Arial,sans-serif" font-size="75" font-weight="bold" text-anchor="middle" fill="#a26588">א</text>';
    if(id==='maze')return path('M19 22H141V118H19V22M19 54H60V88H101V118M60 22V54H103V85H141M19 88H40M101 54H141','none','stroke="#ac91cc" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"')+star(122,104,13);
    if(id==='covering')return circle(69,60,37,'#d5bd95','stroke="#8e759f" stroke-width="7"')+line(97,90,130,123,'#8e759f',12)+path('M43 58l9-14l10 14l9-14l10 14l9-14l10 14M44 76l9-14l10 14l9-14l10 14l9-14','none','stroke="#a07b58" stroke-width="3"');
    throw new Error(`Missing illustration drawing: ${id}`);
  }
  function scene(id) {
    if(id==='space')return rect(6,7,148,126,'#74648e')+circle(107,44,25,'#c2afd8')+circle(100,37,6,'#a18bbf')+star(35,38,9,'#edddac')+star(53,99,12,'#edddac')+star(124,105,7,'#edddac');
    let s=rect(6,7,148,126,'#dcebf1');
    if(id==='sea')return s+rect(6,56,148,77,'#96c9d5')+Array.from({length:3},(_,i)=>path(`M8 ${69+i*24}q18-10 36 0t36 0t36 0t36 0`,'none','stroke="#c8e8e9" stroke-width="4"')).join('')+circle(124,28,12,'#f1d07a');
    if(id==='air')return s+ellipse(51,51,31,13,'#fffaf2')+circle(42,41,16,'#fffaf2')+ellipse(113,93,29,12,'#fffaf2')+circle(124,31,15,'#efd183');
    if(id==='polar')return s+path('M6 90L37 45L65 87L98 35L154 97V133H6Z','#faf8ee')+path('M57 107H111L128 126H38Z','#adcfdf')+path('M31 133v-21a18 18 0 0 1 36 0v21','#c0d8e4')+circle(50,117,7,'#7596b4');
    if(id==='desert')return s+circle(124,31,18,'#efd07a')+path('M6 90Q44 44 98 94Q127 80 154 94V133H6Z','#ebcf92')+path('M6 114Q53 80 154 121V133H6Z','#dcb77a')+path('M51 115V67M51 86Q32 89 32 72M51 95Q70 99 70 83','none','stroke="#9bb87c" stroke-width="8" stroke-linecap="round"');
    if(id==='forest')return s+rect(6,105,148,28,'#9abb8b')+[27,76,124].map((x,i)=>rect(x-5,72,10,49,'#aa8b69')+path(`M${x} ${21+i%2*14}l-26 39h10l-20 35h72l-20-35h10Z`,i%2?'#93b284':'#7fa88c')).join('');
    if(id==='savanna')return s+rect(6,87,148,46,'#e3cf8d')+circle(125,34,17,'#efcf7c')+path('M69 120L76 58L91 120Z','#a98c69')+ellipse(80,56,61,18,'#a4b77b')+ellipse(61,46,32,16,'#a4b77b');
    if(id==='road')return s+rect(6,74,148,59,'#b0a9b9')+line(18,104,143,104,'#fff0ba',5,'stroke-dasharray="18 14"')+rect(6,64,148,11,'#b5cf9b');
    if(id==='rails')return s+rect(6,70,148,63,'#d9c5a0')+[0,1,2,3,4,5].map(i=>line(28,76+i*10,132,76+i*10,'#a58e73',7)).join('')+line(48,70,35,133,'#8a8595',6)+line(112,70,125,133,'#8a8595',6);
    return s;
  }
  function render(id, options = {}) {
    const title = options.label || label(id).he;
    return `<svg class="learning-art ${options.silhouette ? 'lg-shadow' : ''}" viewBox="0 0 160 140" role="img" aria-label="${escape(title)}" xmlns="http://www.w3.org/2000/svg"><title>${escape(title)}</title><g stroke-linejoin="round">${draw(id)}</g></svg>`;
  }
  return { render, label, names };
})();
