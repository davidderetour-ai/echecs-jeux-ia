import test from "node:test";
import assert from "node:assert/strict";
import {prepare,parseModelJSON} from "../github-draft.mjs";
const context=[{path:"assistant-ia/app.js",content:"const bug=true;"}];
const proposal={title:"Corriger une erreur de validation",reason:"L'interface échoue avec un champ vide et doit être corrigée avant publication.",files:[{path:"assistant-ia/app.js",content:"const bug=false;"}],checks:[{name:"Vérifier la syntaxe et lancer tous les tests"}]};
const fake=value=>async()=>({ok:true,json:async()=>({message:{content:JSON.stringify(value)}})});
test("Le brouillon respecte le périmètre des fichiers fournis",async()=>{
 const r=await prepare("Correction d'un bug",context,fake(proposal));
 assert.equal(r.files[0].path,"assistant-ia/app.js");
 assert.equal(Object.hasOwn(r,"verified"),false);
});
test("Le modèle ne peut pas ajouter un fichier hors contexte",async()=>{
 await assert.rejects(prepare("Corriger",context,fake({...proposal,files:[{path:"assistant-ia/nouveau.js",content:"x"}]})),/non fourni/);
});
test("Une réponse arbitraire n'est jamais exécutée",()=>{
 assert.throws(()=>parseModelJSON("alert('exécution non voulue')"));
});
test("Aucune correction sans contrôles",async()=>{
 await assert.rejects(prepare("Corriger",context,fake({...proposal,checks:[]})),/rejetée/);
});
