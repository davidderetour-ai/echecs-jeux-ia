import test from "node:test";
import assert from "node:assert/strict";
import {parseCSV,detectDelimiter,numeric,stats,compare} from "../data-core.mjs";

test("Reconnaît les CSV français et calcule uniquement sur les valeurs valides",()=>{
 const table=parseCSV("Produit;Prix\nA;10,5\nB;20,5\nC;\nD;inconnu\n");
 assert.deepEqual(table.headers,["Produit","Prix"]);
 assert.equal(table.rows.length,4);
 assert.equal(table.delimiter,";");
 const r=stats(table,"Prix");
 assert.deepEqual({valid:r.valid,missing:r.missing,sum:r.sum,mean:r.mean,median:r.median,min:r.min,max:r.max},
 {valid:2,missing:2,sum:31,mean:15.5,median:15.5,min:10.5,max:20.5});
});
test("Gère les cellules entre guillemets, les guillemets doublés et les retours ligne",()=>{
 const t=parseCSV('Nom,Valeur\n"un, deux","12,50"\n"entrée ""spéciale""",9\n');
 assert.deepEqual(t.rows,[["un, deux","12,50"],['entrée "spéciale"',"9"]]);
 assert.equal(stats(t,"Valeur").sum,21.5);
});
test("Ne devine pas des mesures ambiguës ou des unités non définies",()=>{
 assert.equal(numeric("1 234,5"),1234.5);
 assert.equal(numeric("1,234.56"),null);
 assert.equal(numeric("10 €"),null);
 assert.equal(numeric("12%"),null);
 assert.equal(numeric(""),null);
 assert.equal(numeric("NaN"),null);
});
test("Compare les moyennes et signale les données manquantes",()=>{
 const a=parseCSV("nom;mesure\nA;1\nB;3");
 const b=parseCSV("nom;mesure\nA;2\nB;6\nC;inconnu");
 const r=compare(a,b,"mesure");
 assert.equal(r.first.mean,2);
 assert.equal(r.second.mean,4);
 assert.equal(r.meanDelta,2);
 assert.equal(r.meanPercentChange,100);
 assert.ok(r.warning.includes("manquent"));
});
test("Évite de produire un pourcentage impossible à partir de zéro",()=>{
 const a=parseCSV("X\n0");
 const b=parseCSV("X\n5");
 assert.equal(compare(a,b,"X").meanPercentChange,null);
});
test("Refuse une structure corrompue plutôt que d'inventer des cellules",()=>{
 assert.throws(()=>parseCSV("A;B\n1"),/incohérent/);
 assert.throws(()=>parseCSV('A,B\n"non fermé,2'),/non fermés/);
 assert.throws(()=>parseCSV("X;X\n1;2"),/même nom/);
});
test("Détecte les tabulations",()=>assert.equal(detectDelimiter("Nom\tValeur\nA\t4"),"\t"));
