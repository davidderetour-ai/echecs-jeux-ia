/* CORTECT-IA : exercices cognitifs locaux (non diagnostiques) */
export const COLORS=[["rouge","ROUGE","#d73535"],["bleu","BLEU","#247cd7"],["vert","VERT","#29864b"],["jaune","JAUNE","#d0a008"],["noir","NOIR","#121722"]];
export function createStroopChallenge(random=Math.random){
 const a=Math.max(0,Math.min(4,Math.floor(random()*5)));
 const alternatives=COLORS.filter((_,i)=>i!==a);
 const b=Math.max(0,Math.min(3,Math.floor(random()*4)));
 return {word:COLORS[a][1],ink:alternatives[b][0],inkCss:alternatives[b][2]};
}
export function evaluateStroop(challenge,response,started,ended){
 if(!COLORS.some(x=>x[1]===challenge?.word)||!COLORS.some(x=>x[0]===challenge?.ink)||challenge.word.toLowerCase()===challenge.ink)throw Error("Stimulus invalide");
 if(!Number.isFinite(started)||!Number.isFinite(ended)||ended<started)throw Error("Horloge invalide");
 const answer=String(response||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
 const correct=answer===challenge.ink;
 return {exercise:"Stroop",durationSeconds:Math.round((ended-started)/10)/100,accuracy:correct?100:0,
   correct,answer,expected:challenge.ink,word:challenge.word,created:Date.now()};
}
export function summarizeStroop(sessions){
 const list=(Array.isArray(sessions)?sessions:[]).filter(x=>Number.isFinite(x.durationSeconds)&&x.durationSeconds>=0&&[0,100].includes(x.accuracy));
 if(!list.length)return {count:0,accuracy:0,averageSeconds:0,bestSeconds:null};
 const success=list.filter(x=>x.accuracy===100);
 return {count:list.length,accuracy:Math.round(success.length/list.length*100),
  averageSeconds:Math.round(list.reduce((n,x)=>n+x.durationSeconds,0)/list.length*100)/100,
  bestSeconds:success.length?Math.min(...success.map(x=>x.durationSeconds)):null};
}
export function deBonoPrompts(project){
 const idea=String(project||"").trim().slice(0,900);if(!idea)return [];
 const prompts=[
  ["Blanc","Quels sont les faits stricts et vérifiables ?"],
  ["Rouge","Quelle est ton intuition ?"],
  ["Noir","Quels sont les risques et les échecs possibles ?"],
  ["Jaune","Quels sont les bénéfices à long terme ?"],
  ["Vert","Trouve deux alternatives créatives."],
  ["Bleu","Quelle prochaine action concrète vas-tu réaliser ?"]
 ];
 return prompts.map(([hat,question])=>({hat,question,project:idea}));
}
export function threeChallengeQuestions(notes){
 if(!String(notes||"").trim())return [];
 return ["Quels éléments de ces notes prouvent l'idée principale ?",
  "Quelles affirmations doivent être vérifiées avec des sources indépendantes ?",
  "Quelles contradictions ou limites pourraient invalider la conclusion ?"];
}
