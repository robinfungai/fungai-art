// tests/admin-board-verify.cjs — npm run test:admin-board
//
// The admin planning board (/community → Admin) is three files that
// have to agree with each other:
//
//   public/community/admin/kanban.jsx   the component
//   supabase-admin-board.sql            the table it writes to
//   public/community/index.html         the load order
//
// Nothing enforces that agreement at runtime — a column renamed in one
// place fails as a silent RLS rejection in production, which looks
// identical to "not an admin". So it is checked here instead.

const fs=require('fs'), vm=require('vm');
const React=require("react"); const RDS=require("react-dom/server");

function load(sbClient) {
  const sandbox={ console, React, setTimeout, clearTimeout, Promise, document:{ querySelectorAll:()=>[] },
                  Math, JSON, Object, Array, String, Number, Error };
  sandbox.window=sandbox; sandbox.globalThis=sandbox;
  if (sbClient!==undefined) sandbox.SBclient=sbClient;
  const ctx=vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync('public/community/admin/kanban.js','utf8'),ctx,{filename:'kanban.js'});
  return sandbox;
}
let pass=0,fail=0;
const ok=(n,d)=>{pass++;console.log('  ✓ '+n+(d?'  — '+d:''));};
const bad=(n,d)=>{fail++;console.log('  ✗ '+n+(d?'  — '+d:''));};

const s=load(null);
typeof s.AdminKanban==='function' ? ok('window.AdminKanban is set','the shim in app-living will find it')
                                 : bad('window.AdminKanban is set', typeof s.AdminKanban);

// First paint, before effects run: the loading state.
let html='';
try { html=RDS.renderToStaticMarkup(React.createElement(s.AdminKanban,{onToast(){}})); ok('renders without throwing'); }
catch(e){ bad('renders without throwing', e.message); }

/Loading the board/.test(html) ? ok('first paint is the loading state')
                               : bad('first paint is the loading state', html.slice(0,120));

// The column titles must match the four column_id values the CHECK
// constraint in supabase-admin-board.sql allows.
const sqlCols=(fs.readFileSync('supabase-admin-board.sql','utf8')
  .match(/column_id IN \(([^)]*)\)/)||[])[1]
  .split(',').map(x=>x.trim().replace(/'/g,''));
const jsxCols=[...fs.readFileSync('public/community/admin/kanban.jsx','utf8')
  .matchAll(/id:\s*'(backlog|todo|doing|done)'/g)].map(m=>m[1]);
JSON.stringify(sqlCols)===JSON.stringify(jsxCols)
  ? ok('JSX columns match the SQL CHECK constraint', sqlCols.join(', '))
  : bad('JSX columns match the SQL CHECK constraint', 'sql='+sqlCols+' jsx='+jsxCols);

// Every table/column the component touches must exist in the SQL.
const sql=fs.readFileSync('supabase-admin-board.sql','utf8');
const jsx=fs.readFileSync('public/community/admin/kanban.jsx','utf8');
const cols=['column_id','title','position','created_by'];
const missing=cols.filter(c=>!sql.includes(c));
missing.length===0 ? ok('every column the JSX writes exists in the SQL', cols.join(', '))
                   : bad('every column the JSX writes exists in the SQL','missing '+missing);

jsx.includes("from('board_cards')") && sql.includes('public.board_cards')
  ? ok('table name agrees between JSX and SQL','board_cards')
  : bad('table name agrees between JSX and SQL');

sql.includes('fa_is_admin()') && !jsx.includes('KNOWN_ADMIN_EMAILS')
  ? ok('gated by fa_is_admin() in RLS, not a client allowlist')
  : bad('gated by fa_is_admin() in RLS, not a client allowlist');


// The load order is load-bearing: kanban.js sets window.AdminKanban and
// app-living shims it at parse time, so the wrong order silently swaps the
// board for a no-op that renders nothing and reports no error.
const indexHtml=fs.readFileSync("public/community/index.html","utf8");
const iK=indexHtml.indexOf("admin/kanban.js"), iA=indexHtml.indexOf("spore/app-living.js");
(iK>-1 && iA>-1 && iK<iA)
  ? ok("kanban.js loads BEFORE app-living.js","or the shim resolves to the no-op")
  : bad("kanban.js loads BEFORE app-living.js","kanban@"+iK+" app-living@"+iA);

indexHtml.includes("admin/kanban.css")
  ? ok("the stylesheet is linked")
  : bad("the stylesheet is linked");

const app=fs.readFileSync("public/community/spore/app-living.jsx","utf8");
(app.includes("window.AdminKanban") && app.includes("<AdminKanban"))
  ? ok("app-living shims AdminKanban and renders it")
  : bad("app-living shims AdminKanban and renders it");

console.log('\n  passed: '+pass+'   failed: '+fail);
process.exit(fail?1:0);
