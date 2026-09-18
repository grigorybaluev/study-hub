// Fixture tests for the database engine models (app/src/sims/db.js). Run from app/: node scripts/test-db.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { default: DB } = await import('../src/sims/db.js');
DB.useSql(() => require('sql.js')());

let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); pass++; } catch (e) { fail++; console.log(`✗ ${name}: ${e.message}`); } };
const eq = (a, b, what) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) throw new Error(`${what || 'value'}: expected ${B}, got ${A}`); };
const ok = (c, what) => { if (!c) throw new Error(what || 'assertion failed'); };
const last = m => m.steps[m.steps.length - 1];
const renders = m => { for (let k = 0; k < m.steps.length; k++) { const r = m.render(k); ok(typeof r.html === 'string' && r.html.length > 0, 'render ' + k); } };

const movies = { tables: {
  movie: "title year length studioName\n'Star Wars' 1977 124 Fox\n'Mighty Ducks' 1991 104 Disney\n\"Wayne's World\" 1992 95 Paramount\n'Alien' 1979 117 Fox",
  starsIn: "title year starName\n'Star Wars' 1977 'Carrie Fisher'\n'Star Wars' 1977 'Mark Hamill'\n'Alien' 1979 'Sigourney Weaver'",
} };

await t('sql: seeded tables, a join with aggregation, DML then a query, error reporting', async () => {
  const m = DB.model(Object.assign({ mode: 'sql', query: "SELECT studioName, COUNT(*) AS n, MAX(length) AS longest FROM movie GROUP BY studioName ORDER BY studioName" }, movies));
  await m.ready;
  const r = last(m); ok(!r.hl.err, r.d); eq(m.state.results[0].table.rows, [['Disney', 1, 104], ['Fox', 2, 124], ['Paramount', 1, 95]]);
  await m.run('run', ["INSERT INTO movie VALUES ('Jaws', 1975, 124, 'Universal'); SELECT COUNT(*) FROM movie"]);
  eq(m.state.results[0].table.rows, [[5]]); ok(m.state.current.movie.rows.length === 5, 'table dump after insert');
  const err = await m.run('run', ['SELEC x']); ok(err[0].hl.err && /syntax/.test(err[0].d), 'error step');
  const tr = await m.run('run', ["CREATE TRIGGER t AFTER INSERT ON movie BEGIN DELETE FROM starsIn WHERE title = 'x'; END; SELECT 1"]); ok(tr.length === 2 && !tr[0].hl.err, 'trigger with BEGIN/END is one statement: ' + tr.map(s => s.d).join(' | '));
  renders(m);
});
await t('ra: projection dedupes, selection, natural join, set ops, division; agrees with SQL', async () => {
  const m = DB.model(Object.assign({ mode: 'ra', expr: "project(studioName; movie)" }, movies)); await m.ready;
  eq(m.state.final.rows.map(r => r[0]).sort(), ['Disney', 'Fox', 'Paramount']);
  await m.run('evaluate', ["project(title, starName; select(year < 1980 and length > 120; njoin(movie, starsIn)))"]);
  eq(m.state.final.rows, [['Star Wars', 'Carrie Fisher'], ['Star Wars', 'Mark Hamill']]);
  await m.run('evaluate', ["σ(studioName = 'Fox'; movie) ∪ σ(length < 100; movie)"]); eq(m.state.final.rows.length, 3);
  await m.run('evaluate', ["minus(project(title; movie), project(title; starsIn))"]); eq(m.state.final.rows, [['Mighty Ducks'], ["Wayne's World"]]);
  const d = DB.model({ mode: 'ra', tables: { enrolled: "student sport\nJoe Hockey\nJoe Football\nSue Hockey\nSue Football\nAnn Hockey", sport: "sport\nHockey\nFootball" }, expr: 'divide(enrolled, sport)' }); await d.ready;
  eq(d.state.final.rows, [['Joe'], ['Sue']]);
  const bad = await m.run('evaluate', ['project(nope; movie)']); ok(bad[0].hl.err && /not in/.test(bad[0].d), 'unknown attribute reported');
  const j = DB.model(Object.assign({ mode: 'ra', expr: "join(movie.title = starsIn.title; movie, starsIn)" }, movies)); await j.ready; eq(j.state.final.rows.length, 3); renders(j);
  const bag = DB.model(Object.assign({ mode: 'ra', bag: true, expr: "project(studioName; movie)" }, movies)); await bag.ready; eq(bag.state.final.rows.length, 4, 'bag keeps duplicates');
  await m.run('evaluate', ["(π(title; movie) − π(title; starsIn)) ∪ π(title; starsIn)"]); eq(m.state.final.rows.length, 4, 'infix with grouping');
  await m.run('evaluate', ["union(σ(studioName = 'Fox'; movie), σ(length < 100; movie))"]); eq(m.state.final.rows.length, 3, 'function form still works');
  await m.run('evaluate', ["movie ⋈ starsIn"]); eq(m.state.final.rows.length, 3, 'infix natural join');
  await m.run('evaluate', ["select(length > -3; movie)"]); eq(m.state.final.rows.length, 4, 'a negative literal after a comparison');
  const empty = DB.model({ mode: 'ra', tables: { e: '   ' }, expr: 'e' }); await empty.ready; ok(!last(empty).hl.err && empty.state.final.rows.length === 0, 'an empty table spec is an empty relation');
});
await t('fd-closure: the deck-4 example, implication check', async () => {
  const m = DB.model({ mode: 'fd-closure', attributes: 'A B C D E H', fds: ['AB -> C', 'BC -> AD', 'D -> E', 'CH -> B'], x: 'AB' }); await m.ready;
  await m.run('closure', ['AB']); eq(m.state.last.cur, ['A', 'B', 'C', 'D', 'E']);
  await m.run('closure', ['D']); eq(m.state.last.cur, ['D', 'E']);
  const st = await m.run('implies', ['AB -> D']); ok(/yes/.test(st[st.length - 1].d), 'AB -> D implied');
  const no = await m.run('implies', ['D -> A']); ok(/no,/.test(no[no.length - 1].d), 'D -> A not implied'); renders(m);
});
await t('fd-keys: candidate keys', async () => {
  const m = DB.model({ mode: 'fd-keys', attributes: 'A B C D E H', fds: ['AB -> C', 'BC -> AD', 'D -> E', 'CH -> B'] }); await m.ready;
  await m.run('keys'); eq(m.state.keys, [['C', 'H'], ['A', 'B', 'H']], 'H is in every key; CH and ABH are the candidate keys');
  const s = await m.run('test', ['ABH']); ok(/candidate key/.test(s[0].d)); const s2 = await m.run('test', ['ABCH']); ok(/not minimal/.test(s2[0].d)); renders(m);
});
await t('fd-cover: canonical cover of the deck-5 example', async () => {
  const m = DB.model({ mode: 'fd-cover', attributes: 'A B C D E H', fds: ['A -> B', 'DE -> A', 'BC -> E', 'AC -> E', 'BCD -> A', 'AED -> B'] }); await m.ready;
  await m.run('cover');
  const G = m.state.G.map(f => f.lhs.join('') + '->' + f.rhs.join('')).sort();
  ok(m.state.done && G.length <= 4, 'cover ' + G.join(', '));
  ok(G.includes('A->B') && G.includes('BC->E') && G.includes('DE->A'), 'expected FDs present: ' + G.join(', '));
  ok(!G.some(g => g.startsWith('AC->') || g.startsWith('AED->')), 'AC -> E and AED -> B removed: ' + G.join(', ')); renders(m);
});
await t('decomposition: chase finds lossless and lossy; dependency preservation', async () => {
  const m = DB.model({ mode: 'decomposition', attributes: 'A B C D', fds: ['A -> B', 'A -> C', 'C -> D'], decomposition: 'ABC, CD' }); await m.ready;
  await m.run('chase'); ok(m.state.result === true, 'ABC, CD lossless');
  await m.run('chase', ['AB, BC']); ok(m.state.result === false, 'AB, BC lossy (no FD relates them)');
  await m.run('preserve', ['ABC, CD']); eq(m.state.dp.lost, []);
  const n = DB.model({ mode: 'decomposition', attributes: 'A B C', fds: ['A -> B', 'B -> C'], decomposition: 'AB, AC' }); await n.ready;
  await n.run('preserve'); eq(n.state.dp.lost.map(f => f.lhs.join('') + '->' + f.rhs.join('')), ['B->C']); renders(m);
});
await t('normal-form: check, BCNF decomposition, 3NF synthesis', async () => {
  const m = DB.model({ mode: 'normal-form', name: 'R', attributes: 'A B C D E', fds: ['AB -> C', 'C -> B', 'A -> D'] }); await m.ready;
  await m.run('check'); ok(m.state.report.level === '1NF', 'A -> D is partial: ' + m.state.report.level);
  await m.run('bcnf'); ok(m.state.result.length >= 2 && m.state.result.every(r => r.attrs.length < 5), 'split: ' + m.state.result.map(r => r.attrs.join('')).join(','));
  await m.run('threenf'); eq(m.state.result.map(r => r.attrs.join('')), ['ABC', 'AD', 'ABE'], '3NF synthesis: BC is inside ABC, and a key relation ABE is added');
  const b = DB.model({ mode: 'normal-form', attributes: 'A B C', fds: ['AB -> C', 'C -> B'] }); await b.ready; await b.run('check'); eq(b.state.report.level, '3NF', 'C -> B with B prime: 3NF not BCNF'); renders(b);
});
await t('datalog: selection/join rules and recursive transitive closure with negation', async () => {
  const m = DB.model({ mode: 'datalog', tables: { movie: "title year length\nAlien 1979 117\n'Star Wars' 1977 124\nDucks 1991 104", train: "from to\nMontreal Ottawa\nOttawa Toronto\nToronto Windsor" },
    program: "longMovie(T, Y) :- movie(T, Y, L), L >= 110.\nreach(X, Y) :- train(X, Y).\nreach(X, Y) :- reach(X, Z), train(Z, Y).\nfar(X, Y) :- reach(X, Y), NOT train(X, Y)." }); await m.ready;
  ok(m.state.done, 'fixpoint reached'); eq(m.state.idb.longMovie.rows, [['Alien', 1979], ['Star Wars', 1977]]);
  eq(m.state.idb.reach.rows.length, 6); eq(m.state.idb.far.rows.length, 3); ok(m.state.round === 3, 'rounds ' + m.state.round); renders(m);
  const u = DB.model({ mode: 'datalog', tables: { r: "a b\n1 2" }, program: 'p(X, Y) :- r(X, Z).' }); await u.ready; ok(last(u).hl.err && /unsafe/.test(last(u).d), 'unsafe rule reported');
});
await t('er: conversion to relations with weak entity, many-one and isa', async () => {
  const m = DB.model({ mode: 'er', er: { entities: { Movies: { attrs: ['title*', 'year*', 'length'] }, Studios: { attrs: ['name*', 'address'] }, Stars: { attrs: ['name*', 'address'] }, Crews: { attrs: ['number*'], weak: true }, Cartoons: { attrs: ['voices'] } },
    relationships: [{ name: 'Owns', between: ['Movies', 'Studios'], arrow: ['Studios'] }, { name: 'StarsIn', between: ['Movies', 'Stars'] }, { name: 'UnitOf', between: ['Crews', 'Studios'], supporting: true }], isa: [{ sub: 'Cartoons', super: 'Movies' }] } }); await m.ready;
  await m.run('convert');
  const rel = n => m.state.relations.find(r => r.name === n);
  eq(rel('Crews').attrs, ['number', 'Studios.name']); eq(rel('Owns').keys, ['Movies.title', 'Movies.year']); eq(rel('StarsIn').keys.length, 3); eq(rel('Cartoons').attrs, ['title', 'year', 'voices']); ok(!rel('UnitOf'), 'supporting relationship has no relation'); renders(m);
});

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
