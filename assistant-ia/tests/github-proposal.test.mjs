import test from "node:test";
import assert from "node:assert/strict";
import {validateProposal,summarizeRunResults} from "../github-proposal-core.mjs";
const good={
 title:"Corriger une erreur du module pédagogique",
 reason:"Une fonction ne traite pas correctement une entrée vide et doit être corrigée avant la prochaine publication.",
 files:[{path:"assistant-ia/examples/fix-notes.txt",content:"Correction proposée, à examiner avant inclusion."}],
 checks:[{name:"Exécuter les tests Node et vérifier les comportements existants"},{name:"Relire les modifications GitHub"}]
};
test("Une proposition doit cibler les fichiers d'Alicia et expliquer les tests",()=>{
 const p=validateProposal(good);
 assert.equal(p.files.length,1);assert.equal(p.checks.length,2);
});
test("Une proposition ne peut pas modifier le dépôt de jeux ou des workflows GitHub",()=>{
 assert.throws(()=>validateProposal({...good,files:[{path:"app.js",content:"x"}]}),/Chemin interdit/);
 assert.throws(()=>validateProposal({...good,files:[{path:".github/workflows/ci.yml",content:"x"}]}),/Chemin interdit/);
 assert.throws(()=>validateProposal({...good,files:[{path:"assistant-ia/../app.js",content:"x"}]}),/Chemin interdit/);
});
test("Les clés API repérées et certificats sont interdits",()=>{
 assert.throws(()=>validateProposal({...good,files:[{path:"assistant-ia/.env",content:"secret"}]}),/Chemin interdit/);
 assert.throws(()=>validateProposal({...good,files:[{path:"assistant-ia/credentials.pem",content:"privé"}]}),/interdits/);
 assert.throws(()=>validateProposal({...good,files:[{path:"assistant-ia/docs.txt",content:"github_pat_abc0123456789012345678901234567"}]}),/Secret/);
});
test("Aucun test, aucune proposition validée",()=>{
 assert.throws(()=>validateProposal({...good,checks:[]}),/test reproductible/);
 assert.throws(()=>validateProposal({...good,reason:"court"}),/Justification/);
});
test("Les taux sont basés seulement sur les véritables runs terminés",()=>{
 const result=summarizeRunResults([
  {status:"completed",conclusion:"success"},
  {status:"completed",conclusion:"failure"},
  {status:"in_progress",conclusion:null}
 ]);
 assert.deepEqual(result,{total:2,passed:1,failed:1,percent:50});
 assert.equal(summarizeRunResults([]).percent,null);
});
