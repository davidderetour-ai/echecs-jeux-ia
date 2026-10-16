/* ALICIA ORIGINAL ENGINE 0.1
 * Engine built for Alicia, NOT based on a pretrained LLM, Ollama, Puter or APIs.
 * Offline and free. Rule-based language tools + learning from local corrections.
 * Safe autonomous evolution: the engine tests and tunes only its OWN data/weights,
 * never executes text, downloads code, writes arbitrary files or changes macOS.
 */
(function(root) {
"use strict";
var STORE="alicia-original-moteur-v01", VERSION="0.1.0";
var STOP=new Set(["je","tu","il","elle","nous","vous","ils","elles","le","la","les","un","une","des","de","du","dans","et","ou","est","sont","ce","ces","se","sur","pour","avec","que","qui","quoi","quel","quelle","quels","quelles","mon","ma","mes","ton","ta","tes","a","au","aux","en","ne","pas","plus","me","te","moi","toi","comment","peux","peut","pouvez","faire","dire","expliquer","explique","donne","donner","moi","s'il","svp"]);
var limits={maxExamples:220,maxAnswer:1600,maxQuestion:260,maxHistory:40,maxNotes:120};
var lex={
 "ordi":"ordinateur","pc":"ordinateur","macbook":"mac","programmation":"programmer","programmer":"code",
 "coder":"code","codage":"code","python3":"python","ecole":"apprentissage","apprendre":"apprentissage",
 "intelligence":"ia","artificielle":"ia","salut":"bonjour","bonjour":"bonjour","erreurs":"erreur",
 "fautes":"erreur","corriger":"correction","reparer":"reparation","depanner":"reparation",
 "internet":"reseau","wifi":"reseau","wi-fi":"reseau","mathematiques":"maths","calculer":"calcul",
 "multiplication":"multiplier","division":"diviser","addition":"additionner","soustraction":"soustraire"
};
var BUILTINS=[
 {q:"qu est ce que l intelligence artificielle",a:"L'intelligence artificielle est un domaine de l'informatique qui construit des programmes capables d'effectuer certaines tâches liées au raisonnement, à la reconnaissance de formes ou au langage. Mon moteur actuel est un petit programme symbolique : ce n'est pas un grand modèle de langage."},
 {q:"qu est ce qu une variable python",a:"En Python, une variable associe un nom à une valeur. Exemple : age = 12 puis print(age) affiche 12. Tu peux modifier la valeur avec age = age + 1."},
 {q:"comment utiliser print python",a:"En Python, print() affiche un résultat. Exemple : print(\"Bonjour\") affiche Bonjour. print(2 + 3) affiche 5."},
 {q:"comment utiliser input python",a:"En Python, input() attend une saisie au clavier. Exemple : prenom = input(\"Ton prénom ? \") puis print(prenom). input() renvoie du texte."},
 {q:"qu est ce que github",a:"GitHub héberge des dépôts de fichiers et leur historique Git. Un commit enregistre une modification ; une branche permet de travailler sans modifier directement la version principale."},
 {q:"comment fonctionne le wifi",a:"Le Wi-Fi relie des appareils à un réseau local par ondes radio. Avoir une connexion Wi-Fi n'assure pas que l'accès à Internet fonctionne : ce sont deux choses différentes."},
 {q:"qu est ce qu un navigateur",a:"Un navigateur comme Safari affiche des sites Web. Une application native Mac est installée sur macOS ; elle peut toutefois utiliser WebKit pour son interface."},
 {q:"qu est ce qu une fraction",a:"Une fraction représente des parts d'un tout. Par exemple 3/4 signifie trois parts sur quatre parts égales. 1/2 = 2/4."},
 {q:"comment calculer une aire rectangle",a:"L'aire d'un rectangle se calcule longueur × largeur. Par exemple 5 m × 3 m = 15 m². Il faut utiliser des unités compatibles."},
 {q:"comment calculer un perimetre rectangle",a:"Le périmètre d'un rectangle est 2 × (longueur + largeur). Exemple : 5 m et 3 m donnent 16 m."},
 {q:"comment sauvegarder un fichier",a:"Pour conserver un document, utilise Fichier > Enregistrer, choisis un emplacement puis vérifie le nom. Pour une sécurité supplémentaire, conserve une copie sur un support séparé."},
 {q:"comment fonctionne une boucle python",a:"Une boucle for répète une instruction. Exemple : for i in range(3): print(i) affiche 0, 1, 2. L'instruction print est indentée dans la boucle."},
 {q:"comment marche une fonction python",a:"Une fonction regroupe des instructions réutilisables. Exemple : def carre(x): return x*x. Ensuite print(carre(4)) affiche 16."},
 {q:"que sont les angles",a:"Un angle mesure une ouverture entre deux demi-droites. Un angle droit mesure 90°, un angle plat 180° et un tour complet 360°."},
 {q:"qu est ce que le shogi",a:"Le shogi est un jeu de stratégie japonais proche des échecs. Une pièce capturée peut généralement être remise en jeu par son nouveau propriétaire."},
 {q:"comment jouer au go",a:"Au Go, deux joueurs posent des pierres sur les intersections d'une grille. Il faut entourer du territoire et capturer des pierres adverses en supprimant leurs libertés."}
];
function normalize(v){return String(v==null?"":v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[’']/g," ").replace(/[^\p{L}\p{N}+\-*\/^().,%=!?<>: ]/gu," ").replace(/\s+/g," ").trim();}
function words(v){return normalize(v).match(/[\p{L}\p{N}]+/gu)||[];}
function tokens(v){return words(v).map(w=>lex[w]||w).filter(w=>w.length>1&&!STOP.has(w));}
function clean(v,n){return String(v||"").replace(/\0/g,"").trim().slice(0,n);}
function defaults(){return {schema:1,version:VERSION,examples:[],history:[],cortectNotes:[],cortectScores:[],revision:0,weights:{overlap:0.75,sequence:0.25,threshold:0.61},metrics:{trained:0,adaptations:0,lastAccuracy:0},last:null};}
function validate(entry){
 if(!entry||typeof entry!=="object"||typeof entry.q!=="string"||typeof entry.a!=="string")return null;
 var q=clean(entry.q,limits.maxQuestion),a=clean(entry.a,limits.maxAnswer);
 return q.length>2&&a.length>1?{q:q,a:a,created:Number(entry.created)||0,confidence:Math.max(.05,Math.min(1,Number(entry.confidence)||.85))}:null;
}
function validateCortect(entry){
 if(!entry||typeof entry!=="object"||typeof entry.content!=="string")return null;
 var content=clean(entry.content,2000),source=clean(entry.source||"Note personnelle",120);
 if(!content||/\\b(?:sk-[a-z0-9]{20,}|bearer\\s+[a-z0-9]{15,}|mot de passe\\s*[:=]|password\\s*[:=]|api[_-]?key\\s*[:=])/.test(content.toLowerCase()))return null;
 var tags=Array.isArray(entry.tags)?entry.tags.filter(x=>typeof x==="string").map(x=>clean(x,35).replace(/^#/,"")).filter(Boolean).slice(0,8):[];
 if(!tags.includes("a_traiter"))tags.push("a_traiter");
 return {id:clean(entry.id||"",72)||"note-"+Date.now(),created:Number(entry.created)||Date.now(),source:source||"Note personnelle",content:content,tags:tags,reliability:"A verifier"};
}
function validateStroopScore(entry){
 if(!entry||entry.exercise!=="Stroop")return null;
 var duration=Number(entry.durationSeconds),accuracy=Number(entry.accuracy);
 if(!Number.isFinite(duration)||duration<0||duration>3600||![0,100].includes(accuracy))return null;
 return {exercise:"Stroop",durationSeconds:Math.round(duration*100)/100,accuracy,
  word:clean(entry.word,12),expected:clean(entry.expected,12),answer:clean(entry.answer,12),
  created:Number(entry.created)||Date.now()};
}
function read(){
 try{
   var obj=JSON.parse(root.localStorage.getItem(STORE)||"null");
   if(obj&&obj.schema===1&&Array.isArray(obj.examples)){
    var d=defaults();
    d.examples=obj.examples.map(validate).filter(Boolean).slice(-limits.maxExamples);
    d.cortectNotes=Array.isArray(obj.cortectNotes)?obj.cortectNotes.map(validateCortect).filter(Boolean).slice(-limits.maxNotes):[];
    d.cortectScores=Array.isArray(obj.cortectScores)?obj.cortectScores.map(validateStroopScore).filter(Boolean).slice(-60):[];
    d.history=Array.isArray(obj.history)?obj.history.filter(x=>x&&typeof x.q==="string"&&typeof x.target==="string").slice(-limits.maxHistory):[];
    d.revision=Math.max(0,Math.min(999999,Number(obj.revision)||0));
    d.metrics=obj.metrics&&typeof obj.metrics==="object"?Object.assign(d.metrics,obj.metrics):d.metrics;
    d.weights=Object.assign(d.weights,obj.weights||{});
    d.last=obj.last&&typeof obj.last==="object"?obj.last:null;
    return d;
   }
 }catch(e){}
 return defaults();
}
var data=read();
function persist(){
 const snapshot=JSON.stringify(data);
 let localOk=false;
 try{root.localStorage.setItem(STORE,snapshot);localOk=true;}catch(e){}
 if(root.AliciaNativeMemory)root.AliciaNativeMemory.save(snapshot);
 return localOk||Boolean(root.AliciaNativeMemory);
}
function stem(t){return t.length>5?t.replace(/(ements|ement|ations|ation|euses|eurs|euse|ment|ites|ite|es|s|er|ez|ee)$/,""):t;}
function shared(a,b){
 if(!a.length||!b.length)return 0;
 var aa=a.map(stem),bb=b.map(stem);
 var sa=new Set(aa),sb=new Set(bb),hits=0;
 sa.forEach(x=>{if(sb.has(x))hits++;});
 return 2*hits/(sa.size+sb.size);
}
function sequence(a,b){
 var x=a.map(stem),y=b.map(stem),n=0;
 for(var i=0;i<x.length;i++)if(x[i]===y[i])n++;
 return n/Math.max(x.length,y.length,1);
}
function similarity(q,example,w){
 var a=tokens(q),b=tokens(example);
 if(!a.length||!b.length)return 0;
 var exact=normalize(q)===normalize(example)?1:0;
 return exact||Math.max(0,Math.min(1,w.overlap*shared(a,b)+w.sequence*sequence(a,b)));
}
function findAnswer(q,weights,extra){
 var corpus=BUILTINS.map(x=>Object.assign({builtin:true,confidence:.86},x));
 var examples=(extra||data.examples).map(x=>Object.assign({builtin:false},x));
 var best=null,score=0;
 for(var x of examples.concat(corpus)){
  var val=similarity(q,x.q,weights);
  var adjusted=val*(x.confidence||.85);
  // Exact user-taught matches have priority over bundled knowledge.
  if(normalize(x.q)===normalize(q)&&!x.builtin) adjusted=1.01;
  if(adjusted>score){score=adjusted;best=x;}
 }
 return {entry:best,score:score,ok:!!best&&(score>=weights.threshold ||score>1)};
}
function mathParse(text){
 var s=normalize(text).replace(/,/g,".");
 var direct=s.match(/(?:combien\s+(?:font|fait)|calcule|calculer|resultat de|quel est le resultat de)\s*([0-9+\-*\/^().% ×÷]+)/i);
 var expr=direct?direct[1]:s;
 if(!/^[0-9+\-*\/^().% ×÷]+$/.test(expr)||!/[0-9]/.test(expr)||!/[+\-*\/^×÷%]/.test(expr))return null;
 expr=expr.replace(/×/g,"*").replace(/÷/g,"/");
 var lexemes=expr.match(/\d+(?:\.\d+)?|[()+\-*\/^%]/g);
 if(!lexemes||lexemes.length>100||lexemes.join("")!==expr.replace(/\s/g,""))return null;
 var i=0;
 function atom(depth){
  if(depth>18)throw Error("Expression trop imbriquée.");
  var v=lexemes[i++];
  if(v==="+"||v==="-"){var unary=atom(depth+1);return v==="-"?-unary:unary;}
  if(v==="("){var n=add(depth+1);if(lexemes[i++]!==")")throw Error("Parenthèses incorrectes.");return n;}
  if(!/^\d+(?:\.\d+)?$/.test(v||""))throw Error("Écriture du calcul incorrecte.");
  return Number(v);
 }
 function power(depth){
  var n=atom(depth);
  if(lexemes[i]==="^"){i++;var exp=power(depth+1);if(Math.abs(exp)>16)throw Error("Exposant trop grand.");n=Math.pow(n,exp);}
  if(lexemes[i]==="%"){i++;n=n/100;}
  return n;
 }
 function mul(depth){
  var n=power(depth);while(["*","/"].includes(lexemes[i])){
   var op=lexemes[i++],right=power(depth);
   if(op==="/"&&right===0)throw Error("Division par zéro impossible.");
   n=op==="*"?n*right:n/right;
  }return n;
 }
 function add(depth){
  var n=mul(depth);while(["+","-"].includes(lexemes[i])){
   var op=lexemes[i++],right=mul(depth);n=op==="+"?n+right:n-right;
  }return n;
 }
 try{
  var result=add(0);
  if(i!==lexemes.length||!Number.isFinite(result)||Math.abs(result)>1e15)throw Error("Résultat trop grand ou expression incorrecte.");
  return {answer:"Résultat : "+Number(result.toPrecision(12)).toLocaleString("fr-FR")+". (Calcul réalisé localement.)",provider:"Calculateur original Alicia",local:true};
 }catch(err){return {answer:"Je n'ai pas pu calculer : "+err.message,provider:"Calculateur original Alicia",local:true};}
}
function testWeights(weights,history,examples){
 var correct=0;
 for(var sample of history){
   var r=findAnswer(sample.q,weights,examples);
   if(r.ok&&r.entry&&normalize(r.entry.a)===normalize(sample.target))correct++;
 }
 return {correct:correct,total:history.length,accuracy:history.length?correct/history.length:0};
}
function autoEvolve(){
 // Internal adaptation only: tested ranking weights. No code/file writes, remote calls, or self-installations.
 if(data.history.length<3)return false;
 var baseline=testWeights(data.weights,data.history,data.examples),best=baseline,winning=data.weights;
 for(var threshold of [.55,.61,.69,.77]){
   for(var overlap of [.55,.70,.85,1]){
     var candidate={overlap:overlap,sequence:1-overlap,threshold:threshold};
     var test=testWeights(candidate,data.history,data.examples);
     if(test.correct>best.correct){best=test;winning=candidate;}
   }
 }
 if(best.correct>baseline.correct){
   data.weights=winning;data.revision++;
   data.metrics.adaptations=(Number(data.metrics.adaptations)||0)+1;
   data.metrics.lastAccuracy=best.accuracy;
   persist();
   return true;
 }
 data.metrics.lastAccuracy=baseline.accuracy;persist();return false;
}
function teach(question,answer,byCorrection){
 var q=clean(question,limits.maxQuestion),a=clean(answer,limits.maxAnswer);
 if(q.length<3||a.length<2)return {answer:"Il me faut une question et une réponse précises pour apprendre.",local:true,provider:"Apprentissage Alicia"};
 // Never accept apparent secrets as lessons, and do not treat text as code to run.
 if(/(?:api[_ -]?key|bearer\s+[a-z0-9]{15}|password|mot de passe|jeton|token|secret)/i.test(q+" "+a))
  return {answer:"Je ne mémorise pas les mots de passe, jetons ni secrets. Reformule sans informations confidentielles.",local:true,provider:"Apprentissage Alicia"};
 var idx=data.examples.findIndex(x=>normalize(x.q)===normalize(q));
 var entry={q:q,a:a,created:Date.now(),confidence:.99};
 if(idx>=0)data.examples.splice(idx,1);
 data.examples.push(entry);data.examples=data.examples.slice(-limits.maxExamples);
 data.history.push({q:q,target:a,ts:Date.now()});data.history=data.history.slice(-limits.maxHistory);
 data.metrics.trained=Number(data.metrics.trained||0)+1;
 data.revision++;
 var improved=autoEvolve();
 persist();
 return {answer:(byCorrection?"Correction enregistrée. ":"J'ai appris cette réponse. ")+"Je pourrai la réutiliser hors ligne. "+(improved?"Mon classement a été amélioré et testé automatiquement.":"J'ai aussi contrôlé mes réglages sans modifier le système."),local:true,provider:"Apprentissage Alicia",trained:true,revision:data.revision,autonomousUpdate:improved};
}
function reply(text){
 var q=clean(text,limits.maxQuestion);
 if(!q)return {answer:"Écris une question, s'il te plaît.",provider:"Moteur Alicia original",local:true};
 // Explicit supervised learning. These never execute arbitrary instructions.
 var direct=q.match(/^(?:apprends|retiens|memorise)\s*:\s*([\s\S]{3,260}?)\s*(?:=>|→)\s*([\s\S]{2,1600})$/i);
 if(direct)return teach(direct[1],direct[2],false);
 var correction=q.match(/^(?:non[, ]+)?(?:correction|corrige|la bonne reponse est)\s*:\s*([\s\S]{3,1600})$/i);
 if(correction){
   if(!data.last||!data.last.q)return {answer:"Je n'ai pas de question précédente à corriger. Utilise : Apprends : question => réponse.",local:true,provider:"Apprentissage Alicia"};
   return teach(data.last.q,correction[1],true);
 }
 var canonical=normalize(q);
 if(/^(bonjour|bonjours|salut|coucou|bonsoir)( alicia)?[!. ]*$/.test(canonical))
  return {answer:"Bonjour ! Je suis Alicia, avec mon propre petit moteur local. Je peux calculer, expliquer des notions de base et apprendre tes corrections, sans Internet.",provider:"Moteur Alicia original",local:true};
 if(/^(qui es tu|tu es qui|quel est ton nom|comment tu t appelles)/.test(canonical))
  return {answer:"Je suis Alicia. Mon moteur actuel est conçu dans mon application : analyse simple du français, calculateur, recherche de connaissances et apprentissage local. Je ne suis pas encore une intelligence générale.",provider:"Moteur Alicia original",local:true};
 if(/^(que peux tu faire|aide|aide moi|tes capacites)/.test(canonical))
  return {answer:"Sans Internet, je sais effectuer des calculs, expliquer quelques sujets de Python, mathématiques, jeux et informatique, et mémoriser de nouvelles réponses. Pour m'enseigner : Apprends : question => réponse. Pour corriger ma réponse : Correction : bonne réponse. J'améliore automatiquement mes réglages après plusieurs exemples.",provider:"Moteur Alicia original",local:true};
 if(/^(que sais tu|tes apprentissages|tes progres|quel est ton niveau|etat du moteur)/.test(canonical))
  return {answer:"Moteur "+VERSION+" ; connaissances enseignées : "+data.examples.length+" ; révisions autonomes : "+(data.metrics.adaptations||0)+" ; version de la mémoire : "+data.revision+". Rien n'est envoyé sur Internet.",provider:"Moteur Alicia original",local:true};
 var math=mathParse(q);if(math){data.last={q:q,a:math.answer};persist();return math;}
 var found=findAnswer(q,data.weights);
 if(found.ok){
  data.last={q:q,a:found.entry.a};persist();
  return {answer:found.entry.a,provider:found.entry.builtin?"Savoirs intégrés Alicia":"Mémoire apprise Alicia",local:true,confidence:Math.min(1,found.score)};
 }
 data.last={q:q,a:""};persist();
 return {answer:"Je ne sais pas encore répondre correctement à cette question avec mon moteur actuel. Tu peux m'apprendre la réponse sous la forme : « Apprends : "+q+" => ta réponse ». Je la retiendrai localement. Je ne vais pas inventer une réponse.",provider:"Moteur Alicia original",local:true,confidence:0};
}
function answer(payload){
 var messages=payload&&Array.isArray(payload.messages)?payload.messages:[];
 var last=messages.filter(x=>x&&x.role==="user"&&typeof x.content==="string").slice(-1)[0];
 var r=reply(last?last.content:"");
 return Object.assign({verified:false,sources:[],engineVersion:VERSION},r);
}
function exportMemory(){return JSON.stringify({schema:1,version:VERSION,examples:data.examples,history:data.history,cortectNotes:data.cortectNotes,cortectScores:data.cortectScores,revision:data.revision,weights:data.weights,metrics:data.metrics},null,2);}
// Restauration indépendante des ports du navigateur: fichier natif persistant.
function restoreSnapshot(json){
 var obj;try{obj=JSON.parse(json);}catch(e){return {ok:false};}
 if(!obj||obj.schema!==1||!Array.isArray(obj.examples))return {ok:false};
 var existing=data, imported=obj.examples.slice(-limits.maxExamples).map(validate).filter(Boolean);
 var byQuestion=new Map();
 for(var entry of imported.concat(existing.examples)){
   var key=normalize(entry.q);
   var before=byQuestion.get(key);
   if(!before||(entry.created||0)>=(before.created||0))byQuestion.set(key,entry);
 }
 var merged=defaults();
 merged.examples=Array.from(byQuestion.values()).slice(-limits.maxExamples);
 var noteMap=new Map();
 for(var note of ((Array.isArray(obj.cortectNotes)?obj.cortectNotes:[]).concat(existing.cortectNotes||[])).map(validateCortect).filter(Boolean)){
   noteMap.set(note.id,note);
 }
 merged.cortectNotes=Array.from(noteMap.values()).sort((a,b)=>a.created-b.created).slice(-limits.maxNotes);
 var scoreEntries=(Array.isArray(obj.cortectScores)?obj.cortectScores:[]).concat(existing.cortectScores||[]);
 merged.cortectScores=scoreEntries.map(validateStroopScore).filter(Boolean).sort((a,b)=>a.created-b.created).slice(-60);
 var remoteHistory=Array.isArray(obj.history)?obj.history.filter(x=>x&&typeof x.q==="string"&&typeof x.target==="string"):[];
 merged.history=remoteHistory.concat(existing.history).slice(-limits.maxHistory);
 merged.revision=Math.max(Number(obj.revision)||0,Number(existing.revision)||0);
 var weight=obj.weights&&typeof obj.weights==="object"?obj.weights:{};
 var overlap=Number(weight.overlap),sequence=Number(weight.sequence),threshold=Number(weight.threshold);
 if(Number.isFinite(overlap)&&overlap>=0&&overlap<=1&&Number.isFinite(sequence)&&sequence>=0&&sequence<=1&&Number.isFinite(threshold)&&threshold>=.4&&threshold<=.9){
   merged.weights={overlap:overlap,sequence:sequence,threshold:threshold};
 }
 merged.metrics=Object.assign({},merged.metrics,obj.metrics||{},existing.metrics||{});
 merged.last=existing.last||obj.last||null;
 data=merged;persist();
 return {ok:true,examples:data.examples.length,revision:data.revision};
}
function nativeSnapshot(){return JSON.stringify(data);}
function importMemory(json){
 // Export JSON uniquement, jamais de JavaScript ni de commande; vérifications de taille et schéma.
 if(typeof json!=="string"||json.length>220000)return {ok:false,reason:"Fichier de mémoire trop volumineux."};
 var parsed;try{parsed=JSON.parse(json);}catch(e){return {ok:false,reason:"Fichier JSON illisible."};}
 if(!parsed||parsed.schema!==1||!Array.isArray(parsed.examples))return {ok:false,reason:"Format de mémoire incompatible."};
 var incoming=parsed.examples.slice(-limits.maxExamples).map(validate).filter(Boolean);
 var before=data.examples.length;
 for(var item of incoming){
   // Importer uniquement des exemples valides; les secrets ne doivent pas être appris.
   if(/(?:api[_ -]?key|bearer\s+[a-z0-9]{15}|password|mot de passe|jeton|token|secret)/i.test(item.q+" "+item.a))continue;
   var i=data.examples.findIndex(e=>normalize(e.q)===normalize(item.q));
   if(i>=0)continue; // ne pas écraser les corrections locales sans consentement explicite
   data.examples.push(item);
 }
 data.examples=data.examples.slice(-limits.maxExamples);
 var importedNotes=0,noteIDs=new Set((data.cortectNotes||[]).map(n=>n.id));
 for(var note of (Array.isArray(parsed.cortectNotes)?parsed.cortectNotes:[]).map(validateCortect).filter(Boolean)){
  if(noteIDs.has(note.id))continue;
  data.cortectNotes.push(note);noteIDs.add(note.id);importedNotes++;
 }
 data.cortectNotes=data.cortectNotes.slice(-limits.maxNotes);
 var importedScores=(Array.isArray(parsed.cortectScores)?parsed.cortectScores:[]).map(validateStroopScore).filter(Boolean);
 var scoreKeys=new Set((data.cortectScores||[]).map(x=>x.created+"-"+x.durationSeconds+"-"+x.word));
 for(var score of importedScores){
  var key=score.created+"-"+score.durationSeconds+"-"+score.word;
  if(!scoreKeys.has(key)){data.cortectScores.push(score);scoreKeys.add(key);}
 }
 data.cortectScores=data.cortectScores.slice(-60);
 data.revision++;
 persist();
 return {ok:true,importedNotes:importedNotes,imported:Math.max(0,data.examples.length-before),total:data.examples.length};
}
function addCortectNote(source,content,tags){
 var entry=validateCortect({id:"cortect-"+Date.now()+"-"+Math.random().toString(36).slice(2,9),created:Date.now(),source:source,content:content,tags:tags});
 if(!entry)return {ok:false,reason:"Note vide ou contenant une information secrète potentielle."};
 data.cortectNotes.push(entry);
 data.cortectNotes=data.cortectNotes.slice(-limits.maxNotes);
 data.revision++;
 var stored=persist();
 return {ok:stored,entry:entry,reason:stored?"":"La mémoire locale n'a pas été enregistrée."};
}
function listCortectNotes(){return (data.cortectNotes||[]).map(x=>Object.assign({},x,{tags:x.tags.slice()}));}
function deleteCortectNote(id){
 var before=data.cortectNotes.length;
 data.cortectNotes=data.cortectNotes.filter(x=>x.id!==id);
 if(data.cortectNotes.length!==before){data.revision++;persist();return true;}return false;
}
function addStroopScore(raw){
 var item=validateStroopScore(raw);
 if(!item)return {ok:false,reason:"Mesure Stroop invalide."};
 data.cortectScores.push(item);data.cortectScores=data.cortectScores.slice(-60);
 data.revision++;return {ok:persist(),score:item};
}
function listStroopScores(){return (data.cortectScores||[]).map(x=>({...x}));}
function clearMemory(){data=defaults();persist();}
function inspect(){return {name:"Alicia Original",version:VERSION,examples:data.examples.length,revision:data.revision,autonomousAdaptations:Number(data.metrics.adaptations)||0,cortectNotes:data.cortectNotes.length,stroopSessions:data.cortectScores.length,offline:true,noPaidServices:true};}
root.AliciaOriginalEngine={answer:answer,reply:reply,teach:teach,inspect:inspect,autoEvolve:autoEvolve,exportMemory:exportMemory,importMemory:importMemory,restoreSnapshot:restoreSnapshot,nativeSnapshot:nativeSnapshot,clearMemory:clearMemory,addCortectNote:addCortectNote,listCortectNotes:listCortectNotes,deleteCortectNote:deleteCortectNote,addStroopScore:addStroopScore,listStroopScores:listStroopScores,
  _test:{normalize:normalize,tokens:tokens,similarity:similarity,mathParse:mathParse,testWeights:testWeights}};
})(typeof window==="undefined"?globalThis:window);
