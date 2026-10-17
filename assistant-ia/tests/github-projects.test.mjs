import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {OWNER,MAIN_GAME,validName,validProjectFile,prepareProposal,listPublicRepositories,
 inspectPublicRepository,accessStatus} from "../github-projects-core.mjs";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const fakeRepo=(name,more={})=>({name,private:false,archived:false,
 owner:{login:OWNER},default_branch:"main",description:"Un projet Alicia",...more});
test("Compte propriétaire et validation stricte des noms de projet",()=>{
 assert.equal(OWNER,"davidderetour-ai");
 for(const n of ["echecs-jeux-ia","alicia-demo","nouveau-projet"])assert.equal(validName(n),true);
 for(const n of ["../a","https://github.com","", "x".repeat(110)])assert.equal(validName(n),false);
});
test("Lecture des dépôts publics courants et futurs, sans jeton ni droit d'écriture",async()=>{
 const calls=[];
 const fetcher=async(url,options)=>{
  calls.push([url,options]);
  return {ok:true,json:async()=>[
   fakeRepo("echecs-jeux-ia"),fakeRepo("futur-projet"),
   fakeRepo("secret",{private:true}),fakeRepo("archive",{archived:true}),
   fakeRepo("hors-compte",{owner:{login:"quelquun-d-autre"}})
  ]};
 };
 const res=await listPublicRepositories({fetcher});
 assert.equal(res.length,2);
 assert.deepEqual(res.map(x=>x.name),["echecs-jeux-ia","futur-projet"]);
 assert.ok(res.every(x=>x.private===false&&x.hasWriteAccess===false));
 assert.equal(calls.length,1);
 assert.match(calls[0][0],/api\.github\.com\/users\/davidderetour-ai\/repos/);
 assert.equal(calls[0][1].headers.Authorization,undefined);
});
test("Inspection rejette les dépôts privés, tiers et non autorisés",async()=>{
 const mock=(data)=>async()=>({ok:true,json:async()=>data});
 const result=await inspectPublicRepository("echecs-jeux-ia",{fetcher:mock(fakeRepo("echecs-jeux-ia"))});
 assert.equal(result.fullName,"davidderetour-ai/echecs-jeux-ia");
 await assert.rejects(()=>inspectPublicRepository("secret",{fetcher:mock(fakeRepo("secret",{private:true}))}),/privé/);
 await assert.rejects(()=>inspectPublicRepository("../hack",{fetcher:mock({})}),/invalide/);
});
test("Propositions de fichiers autorisés, tests obligatoires et blocage des secrets",()=>{
 const base={repo:"echecs-jeux-ia",title:"Corriger la présentation de l'échiquier",
  reason:"Conserver les sauvegardes et vérifier les pièces ainsi que le mode hors ligne avant toute fusion.",
  path:"assistant-ia/demo.js",content:"export const demo=true;\n",checks:["Lancer npm test"]};
 assert.deepEqual(prepareProposal(base).files,[{path:base.path,content:base.content}]);
 for(const blocked of [".github/workflows/deploy.yml","../secret","info.env","assistant-ia/permission-policy.mjs"]){
  assert.equal(validProjectFile(blocked),false,blocked);
 }
 assert.throws(()=>prepareProposal({...base,content:"token=github_pat_abcdefghijklmnopqrstuvwxyzABCDE"}),/secret/i);
 assert.throws(()=>prepareProposal({...base,checks:[]}),/contrôle/i);
});
test("Aucune autorisation privée ou write n'est présentée comme accordée",()=>{
 const s=accessStatus(),ui=read("github-projects-ui.mjs"),cli=read("github-portfolio.mjs");
 assert.equal(s.writeConnected,false);
 assert.equal(s.privateRead,false);
 assert.equal(s.approvalPerChange,true);
 assert.match(ui,/Actualiser les projets publics/);
 assert.match(ui,/Aucune modification GitHub ne sera effectuée/);
 assert.match(cli,/promptConfirmation/);
 assert.match(cli,/draft:true/);
 assert.doesNotMatch(ui,/ALICIA_GITHUB_TOKEN/);
});
test("L'interface et le cache hors ligne incluent la consultation GitHub autorisée",()=>{
 const html=read("index.html"),app=read("app.js"),sw=read("sw.js");
 assert.match(html,/src="\.\/github-projects-ui\.mjs"/);
 assert.match(app,/AliciaGitHubProjects\?\.answer/);
 assert.match(sw,/\.\/github-projects-core\.mjs/);
 assert.match(sw,/\.\/github-projects-ui\.mjs/);
});

test("Le site Échecs & Jeux IA est lié au bon dépôt et à sa page d'accueil",()=>{
 assert.equal(MAIN_GAME.website,"https://davidderetour-ai.github.io/echecs-jeux-ia/index.html");
 assert.equal(MAIN_GAME.repository,"echecs-jeux-ia");
 assert.ok(read("github-projects-ui.mjs").includes("Ouvrir le jeu Échecs"));
 assert.ok(read("../index.html").includes("<title>Échecs & Jeux IA"));
});
