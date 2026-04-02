/**
 * App.jsx — Pizzaria Varanda
 * Dados sincronizados via Firebase Firestore:
 *   - Preços editados pelo admin → visíveis em qualquer dispositivo imediatamente
 *   - Histórico de pedidos → acessível de qualquer navegador
 *
 * PASSO OBRIGATÓRIO ANTES DE USAR:
 *   Substitua o objeto FIREBASE_CONFIG abaixo com os dados do SEU projeto Firebase.
 *   Siga o guia FIREBASE_SETUP.md para criar o projeto gratuitamente.
 */

import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, collection, 
  getDocs, deleteDoc, query, orderBy, writeBatch 
} from "firebase/firestore";
import { useState, useReducer, useContext, createContext, useCallback, useEffect, useMemo } from "react"

/* ═══════════════════════════════════════════════════════════════
   🔥 CONFIGURAÇÃO ÚNICA E LIMPA
═══════════════════════════════════════════════════════════════ */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCVJT5Gppk1a2XD1eIqb6W3g8fwzk4mP_E",
  authDomain:        "pizzaria-varanda-31969.firebaseapp.com",
  projectId:         "pizzaria-varanda-31969",
  storageBucket:     "pizzaria-varanda-31969.firebasestorage.app",
  messagingSenderId: "478712994311",
  appId:             "1:478712994311:web:66a6c63f0c901f721e28a2",
};

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
const db = getFirestore(app);

// ── Coleções ────────────────────────────────────────────────────
const COL_ORDERS = "pedidos";
const DOC_PRICES = "config/precos";

// ── Funções de Pedidos (Versão Moderna) ─────────────────────────
async function fbSaveOrder(order) {
  try {
    await setDoc(doc(db, COL_ORDERS, order.id), order);
  } catch (e) { console.error("Erro ao salvar pedido:", e); }
}

async function fbLoadOrders() {
  try {
    const q = query(collection(db, COL_ORDERS), orderBy("date", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (e) { 
    console.error("Erro ao carregar pedidos:", e); 
    return [];
  }
}

async function fbDeleteOrder(id) {
  try {
    await deleteDoc(doc(db, COL_ORDERS, id));
  } catch (e) { console.error("Erro ao deletar:", e); }
}

async function fbClearOrders() {
  try {
    const snap = await getDocs(collection(db, COL_ORDERS));
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (e) { console.error("Erro ao limpar pedidos:", e); }
}

// ── Funções de Preços (Versão Moderna) ──────────────────────────
async function fbLoadPrices() {
  try {
    const d = await getDoc(doc(db, "config", "precos"));
    return d.exists() ? d.data() : {};
  } catch (e) { 
    console.error("Erro ao carregar preços:", e); 
    return {};
  }
}

async function fbSavePrices(pricesObj) {
  try {
    await setDoc(doc(db, "config", "precos"), pricesObj);
    console.log("Preços sincronizados com sucesso!");
  } catch (e) { console.error("Erro ao salvar preços:", e); }
}
/* ═══════════════════════════════════════════════════════════════
   CONFIG ADMIN
═══════════════════════════════════════════════════════════════ */
const ADMIN_CONFIG = {
  username:   "admin",
  password:   "varanda2026",
  sessionKey: "vd_admin_ok",
}

/* ═══════════════════════════════════════════════════════════════
   ESTILOS
═══════════════════════════════════════════════════════════════ */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=Lato:wght@400;700&display=swap');
  :root{--terracota:#C04000;--terracota-dark:#A03300;--olive:#556B2F;--cream:#FDF6EC;--stone-100:#f5f5f4;--stone-200:#e7e5e4;--stone-400:#a8a29e;--stone-500:#78716c;--stone-600:#57534e;--stone-700:#44403c;--stone-800:#292524;}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{font-family:'Lato',sans-serif;background:var(--cream);color:var(--stone-800);overflow-x:hidden;}
  .fd{font-family:'Playfair Display',serif;}
  button{cursor:pointer;font-family:'Lato',sans-serif;}
  input,textarea{font-family:'Lato',sans-serif;}
  a{text-decoration:none;color:inherit;}
  .br{background:var(--terracota);color:white;border:none;transition:background .2s;}.br:hover{background:var(--terracota-dark);}
  .bo{background:var(--olive);color:white;border:none;transition:background .2s;}.bo:hover{background:#4a5e28;}
  .bg{background:rgba(85,107,47,.1);color:var(--olive);border:2px solid rgba(85,107,47,.3);transition:all .2s;}.bg:hover{background:rgba(85,107,47,.2);}
  .bl{background:transparent;border:2px solid var(--stone-200);color:var(--stone-600);transition:all .2s;}.bl:hover{border-color:var(--stone-400);}
  .bgreen{background:#16a34a;color:white;border:none;transition:background .2s;}.bgreen:hover{background:#15803d;}
  .bdan{background:#dc2626;color:white;border:none;transition:background .2s;}.bdan:hover{background:#b91c1c;}
  .card{background:white;border-radius:1rem;border:1px solid var(--stone-200);overflow:hidden;transition:transform .25s,box-shadow .25s;}
  .card:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,.1);}
  .drawer{position:fixed;top:0;right:0;height:100%;width:100%;max-width:22rem;background:white;z-index:50;display:flex;flex-direction:column;box-shadow:-4px 0 30px rgba(0,0,0,.15);transition:transform .3s ease;}
  .dopen{transform:translateX(0);}.dclosed{transform:translateX(100%);}
  .ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:40;backdrop-filter:blur(3px);}
  .mw{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:50;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(3px);}
  .mb{background:white;width:100%;max-width:32rem;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border-radius:1.5rem 1.5rem 0 0;box-shadow:0 -8px 40px rgba(0,0,0,.2);}
  .tag{font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:999px;}
  .tv{background:#dcfce7;color:#166534;}.tp{background:#fef3c7;color:#92400e;}.tf{background:#fee2e2;color:#991b1b;}
  .tc{background:#fed7aa;color:#9a3412;}.tpi{background:#fee2e2;color:#b91c1c;}.tn{background:#d1fae5;color:#065f46;}
  .tch{background:#fce7f3;color:#9d174d;}.tsm{background:#f5f5f4;color:#57534e;}.tr{background:#ccfbf1;color:#134e4a;}
  .td{background:#f3e8ff;color:#6b21a8;}.tb{background:#dbeafe;color:#1e40af;}.tlt{background:#ecfdf5;color:#065f46;}
  .noscroll::-webkit-scrollbar{display:none;}.noscroll{-ms-overflow-style:none;scrollbar-width:none;}
  .inp{width:100%;border:2px solid var(--stone-200);border-radius:.75rem;padding:.6rem 1rem;font-size:.875rem;font-family:'Lato',sans-serif;outline:none;transition:border-color .2s;background:white;}
  .inp:focus{border-color:var(--terracota);}
  .inp-sm{border:2px solid var(--stone-200);border-radius:.5rem;padding:.35rem .6rem;font-size:.82rem;font-family:'Lato',sans-serif;outline:none;transition:border-color .2s;background:white;width:5.5rem;text-align:right;}
  .inp-sm:focus{border-color:var(--terracota);}
  .sdiv{height:2px;background:linear-gradient(to right,rgba(192,64,0,.35),var(--stone-200),transparent);border:none;margin-top:.75rem;}
  .bar{height:8px;border-radius:4px;background:var(--terracota);transition:width .6s ease;}
  @media(min-width:640px){.mb{border-radius:1rem;}.mw{align-items:center;}}
`

/* ═══════════════════════════════════════════════════════════════
   CARDÁPIO BASE (preços padrão — sobrescritos pelo Firebase)
═══════════════════════════════════════════════════════════════ */
const MENU_BASE = {
  meta: {
    whatsappNumber: "5512991375580",
    halfRule: "highest",
    borders: [
      { id:"none",     label:"Sem borda",      price:0  },
      { id:"recheada", label:"Borda Recheada", price:20 },
    ],
    payments: [
      { id:"pix",    label:"PIX",                        needsChange:false },
      { id:"credit", label:"Cartão de Crédito (maquina)",needsChange:false },
      { id:"debit",  label:"Cartão de Débito (maquina)", needsChange:false },
      { id:"cash",   label:"Dinheiro",                   needsChange:true  },
    ],
  },
  categories: [
    { id:"trad", label:"🍕 Tradicionais", desc:"As clássicas que nunca saem de moda", half:true, items:[
      {id:"mussarela",       name:"Mussarela",           Image:"\\pizzas\\mussarela.png",  tags:["classica"],           desc:"Molho Varanda, mussarela, tomate, azeitona e orégano",                                                                      sizes:{M:48,G:50}},
      {id:"margherita",      name:"Margherita",           Image:"\\pizzas\\margherita.png", tags:["classica"],           desc:"Molho Varanda, mussarela, tomate, azeitona, orégano e manjericão",                                                         sizes:{M:50,G:52}},
      {id:"milho_verde",     name:"Milho Verde",          Image:"\\pizzas\\milhoverde.png", tags:["vegetariana"],        desc:"Molho Varanda, mussarela, azeitona, orégano e milho",                                                                      sizes:{M:50,G:52}},
      {id:"napolitana",      name:"Napolitana",           Image:"\\pizzas\\napolitana.png", tags:["classica"],           desc:"Molho Varanda, mussarela, tomate, azeitona, orégano e parmesão ralado",                                                    sizes:{M:50,G:52}},
      {id:"alho",            name:"Alho",                 Image:"\\pizzas\\alho.png",       tags:["classica"],           desc:"Molho Varanda, mussarela, tomate, azeitona, orégano e alho",                                                              sizes:{M:50,G:52}},
      {id:"catupiry",        name:"Catupiry",             Image:"\\pizzas\\catupiry.png",   tags:["classica"],           desc:"Molho Varanda, mussarela, azeitona, orégano e catupiry",                                                                   sizes:{M:54,G:56}},
      {id:"presunto",        name:"Presunto",             Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, tomate, azeitona, orégano e presunto",                                                          sizes:{M:54,G:56}},
      {id:"salame",          name:"Salame",               Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, tomate, azeitona, orégano e salame",                                                            sizes:{M:56,G:58}},
      {id:"quatro_queijos",  name:"4 Queijos",            Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, provolone, catupiry, parmesão ralado, azeitona e orégano",                                      sizes:{M:60,G:62}},
      {id:"rucula",          name:"Rúcula",               Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, tomate seco, azeitona, orégano e rúcula",                                                      sizes:{M:57,G:59}},
      {id:"atum",            name:"Atum",                 Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, azeitona, cebola, orégano e atum",                                                             sizes:{M:63,G:65}},
      {id:"calabresa",       name:"Calabresa",            Image:"/pizzas/mussarela.png",    tags:["classica","picante"], desc:"Molho Varanda, mussarela, tomate, azeitona, orégano, calabresa e cebola",                                                sizes:{M:56,G:58}},
      {id:"caipira",         name:"Caipira",              Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, frango desfiado, azeitona, orégano e milho verde",                                             sizes:{M:58,G:60}},
      {id:"bacon",           name:"Bacon",                Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, bacon, azeitona e orégano",                                                                     sizes:{M:61,G:63}},
      {id:"brocolis",        name:"Brócolis",             Image:"/pizzas/mussarela.png",    tags:["vegetariana"],        desc:"Molho Varanda, mussarela, catupiry, bacon, azeitona, orégano e brócolis",                                                sizes:{M:63,G:65}},
      {id:"lombo_campea",    name:"Lombo Campeã",         Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, orégano e lombo defumado",                                                 sizes:{M:63,G:65}},
      {id:"champignon",      name:"Champignon",           Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, orégano e champignon",                                                     sizes:{M:63,G:65}},
      {id:"pepperoni",       name:"Pepperoni",            Image:"/pizzas/mussarela.png",    tags:["picante"],            desc:"Molho Varanda, mussarela, tomate, azeitona, orégano e pepperoni",                                                        sizes:{M:66,G:68}},
      {id:"portuguesa",      name:"Portuguesa",           Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, mussarela, tomate, palmito, ervilha, presunto, calabresa, azeitona, orégano e ovos",                      sizes:{M:63,G:65}},
      {id:"frango_catupiry", name:"Frango c/ Catupiry",   Image:"/pizzas/mussarela.png",    tags:["favorito"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, orégano e frango desfiado",                                               sizes:{M:63,G:65}},
      {id:"moda_casa",       name:"À Moda da Casa",       Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, tomate, azeitona, ervilha, ovos, palmito, presunto, calabresa, bacon, orégano e cebola",       sizes:{M:68,G:70}},
      {id:"palmito",         name:"Palmito",              Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, orégano e palmito",                                                        sizes:{M:66,G:68}},
      {id:"cremosa",         name:"Cremosa",              Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, creme de leite, milho, azeitona, orégano e frango desfiado",                                   sizes:{M:62,G:64}},
      {id:"pantaneira",      name:"Pantaneira",           Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, orégano e carne seca",                                                     sizes:{M:68,G:70}},
      {id:"peito_peru",      name:"Peito de Peru",        Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, orégano e peito de peru",                                                  sizes:{M:62,G:64}},
      {id:"strogonoff",      name:"Strogonoff",           Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, frango, champignon, creme de leite, azeitona, orégano e batata palha",                        sizes:{M:66,G:68}},
      {id:"carne_seca",      name:"Carne Seca",           Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, tomate, azeitona, cebola, orégano e carne seca",                                              sizes:{M:68,G:70}},
      {id:"baiana",          name:"Baiana",               Image:"/pizzas/mussarela.png",    tags:["picante"],            desc:"Molho Varanda, mussarela, tomate, azeitona, pimenta, ovos, alho, cebola, orégano e calabresa fatiada",                  sizes:{M:62,G:64}},
      {id:"pizzaiolo",       name:"Pizzaiolo",            Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, cebola, orégano e calabresa",                                             sizes:{M:62,G:64}},
      {id:"siciliana",       name:"Siciliana",            Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, champignon, azeitona, orégano e bacon",                                                       sizes:{M:63,G:65}},
      {id:"escarola",        name:"Escarola",             Image:"/pizzas/mussarela.png",    tags:["vegetariana"],        desc:"Molho Varanda, mussarela, tomate, azeitona, cebola, bacon picado, orégano e escarola temperada",                        sizes:{M:62,G:64}},
      {id:"lombinho",        name:"Lombinho",             Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, catupiry, azeitona, cebola, orégano e lombo defumado",                                        sizes:{M:66,G:68}},
      {id:"vegetariana",     name:"Vegetariana",          Image:"/pizzas/mussarela.png",    tags:["vegetariana"],        desc:"Molho Varanda, mussarela, tomate, azeitona, brócolis, milho, ervilha, champignon, orégano e palmito",                   sizes:{M:70,G:72}},
      {id:"genova",          name:"Gênova [Light]",       Image:"/pizzas/mussarela.png",    tags:["light"],              desc:"Molho Varanda, mussarela, tomate, azeitona, manjericão, orégano e peito de peru",                                       sizes:{M:63,G:65}},
      {id:"veneza",          name:"Veneza [Light]",       Image:"/pizzas/mussarela.png",    tags:["light"],              desc:"Molho Varanda, mussarela, tomate, azeitona, orégano, rúcula e peito de peru",                                           sizes:{M:63,G:65}},
      {id:"dom_pombo",       name:"Dom Pombo",            Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, tomate seco, azeitona, lombo, rúcula, orégano e champignon",                                  sizes:{M:74,G:76}},
      {id:"varanda_burger",  name:"Varanda Burguer",      Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, hambúrguer Sadia, mussarela, tomate, azeitona e orégano",                                                sizes:{M:63,G:65}},
      {id:"abobrinha",       name:"Abobrinha",            Image:"/pizzas/mussarela.png",    tags:["vegetariana"],        desc:"Molho Varanda, abobrinha, mussarela, parmesão, azeitona e orégano",                                                     sizes:{M:63,G:65}},
      {id:"berinjela",       name:"Berinjela",            Image:"/pizzas/mussarela.png",    tags:["vegetariana"],        desc:"Molho Varanda, berinjela temperada, mussarela, parmesão, azeitona e orégano",                                           sizes:{M:63,G:65}},
      {id:"portuguesa_esp",  name:"Portuguesa Especial",  Image:"/pizzas/mussarela.png",    tags:["especial"],           desc:"Molho Varanda, mussarela, presunto, ervilha, ovo, milho, palmito, calabresa, lombo canadense, cebola, tomate, azeitona e orégano", sizes:{M:73,G:75}},
      {id:"sardinha",        name:"Sardinha",             Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, sardinha, ovo, cebola, tomate, mussarela, azeitona e orégano",                                           sizes:{M:60,G:62}},
      {id:"brocolis_palmito",name:"Brócolis c/ Palmito",  Image:"/pizzas/mussarela.png",    tags:["vegetariana"],        desc:"Molho Varanda, brócolis, palmito, catupiry, mussarela, azeitona e orégano",                                             sizes:{M:68,G:70}},
      {id:"salsicha",        name:"Salsicha",             Image:"/pizzas/mussarela.png",    tags:["classica"],           desc:"Molho Varanda, brócolis, palmito, catupiry, mussarela, azeitona e orégano",                                             sizes:{M:68,G:70}},
    ]},
    { id:"bufala", label:"🦬 Especiais com Búfala", desc:"Com mussarela de búfala — outro nível", half:true, items:[
      {id:"buf_mussarela",   name:"Mussarela Especial",      Image:"/pizzas/mussarela.png", tags:["premium"],              desc:"Molho Varanda, mussarela de búfala, tomate, azeitona e orégano",                                                  sizes:{M:69,G:71}},
      {id:"buf_rucula",      name:"Rúcula Especial",         Image:"/pizzas/mussarela.png", tags:["premium"],              desc:"Molho Varanda, mussarela de búfala, tomate seco, azeitona, orégano e rúcula",                                    sizes:{M:77,G:79}},
      {id:"buf_vegetariana", name:"Vegetariana Especial",    Image:"/pizzas/mussarela.png", tags:["premium","vegetariana"],desc:"Molho Varanda, mussarela de búfala, tomate, azeitona, brócolis, milho, ervilha, champignon, orégano e palmito",  sizes:{M:96,G:98}},
      {id:"buf_genova",      name:"Gênova Especial [Light]", Image:"/pizzas/mussarela.png", tags:["premium","light"],      desc:"Molho Varanda, mussarela de búfala, tomate, azeitona, manjericão, orégano e peito de peru",                      sizes:{M:79,G:81}},
      {id:"buf_veneza",      name:"Veneza Especial [Light]", Image:"/pizzas/mussarela.png", tags:["premium","light"],      desc:"Molho Varanda, mussarela de búfala, tomate, azeitona, rúcula, orégano e peito de peru",                          sizes:{M:79,G:81}},
      {id:"buf_dom_pombo",   name:"Dom Pombo Especial",      Image:"/pizzas/mussarela.png", tags:["premium"],              desc:"Molho Varanda, mussarela de búfala, tomate seco, azeitona, lombo, rúcula, orégano e champignon",                  sizes:{M:96,G:98}},
      {id:"buf_abobrinha",   name:"Abobrinha Especial",      Image:"/pizzas/mussarela.png", tags:["premium","vegetariana"],desc:"Molho Varanda, mussarela de búfala, abobrinha, parmesão, azeitona e orégano",                                    sizes:{M:79,G:81}},
      {id:"buf_berinjela",   name:"Berinjela Especial",      Image:"/pizzas/mussarela.png", tags:["premium","vegetariana"],desc:"Molho Varanda, berinjela temperada, mussarela de búfala, parmesão, azeitona e orégano",                          sizes:{M:79,G:81}},
      {id:"buf_palmito",     name:"Palmito Especial",        Image:"/pizzas/mussarela.png", tags:["premium"],              desc:"Molho Varanda, mussarela de búfala, palmito, catupiry, azeitona e orégano",                                      sizes:{M:87,G:89}},
      {id:"buf_margherita",  name:"Margherita Especial",     Image:"/pizzas/mussarela.png", tags:["premium"],              desc:"Molho Varanda, mussarela de búfala, tomate, azeitona, orégano e manjericão",                                     sizes:{M:73,G:75}},
      {id:"buf_brocolis",    name:"Brócolis Especial",       Image:"/pizzas/mussarela.png", tags:["premium"],              desc:"Molho Varanda, mussarela de búfala, catupiry, bacon, azeitona, orégano e brócolis",                              sizes:{M:94,G:96}},
    ]},
    { id:"multi", label:"🎨 3 e 4 Sabores", desc:"Preço fixo — informe os sabores nas observações", half:false, items:[
      {id:"p3_trad",  name:"Pizza 3 Sabores (Tradicional)", Image:"/pizzas/mussarela.png", tags:["especial"], desc:"Escolha 3 sabores tradicionais. Informe os sabores no campo de observações.", sizes:{UN:82} },
      {id:"p4_trad",  name:"Pizza 4 Sabores (Tradicional)", Image:"/pizzas/mussarela.png", tags:["especial"], desc:"Escolha 4 sabores tradicionais. Informe os sabores no campo de observações.", sizes:{UN:94} },
      {id:"p3_bufala",name:"Pizza 3 Sabores (Búfala)",      Image:"/pizzas/mussarela.png", tags:["premium"],  desc:"Escolha 3 sabores com búfala. Informe os sabores no campo de observações.",    sizes:{UN:114}},
      {id:"p4_bufala",name:"Pizza 4 Sabores (Búfala)",      Image:"/pizzas/mussarela.png", tags:["premium"],  desc:"Escolha 4 sabores com búfala. Informe os sabores no campo de observações.",    sizes:{UN:122}},
    ]},
    { id:"doces", label:"🍫 Pizzas Doces", desc:"Para fechar com chave de ouro — tamanho único", half:false, items:[
      {id:"brigadeiro",  name:"Brigadeiro",   Image:"/pizzas/pizzadoce.png", tags:["doce"], desc:"Pergunte os ingredientes no momento do pedido!", sizes:{UN:65}},
      {id:"varanda_doce",name:"Varanda Doce", Image:"/pizzas/pizzadoce.png", tags:["doce"], desc:"Abacaxi, doce de leite e mussarela",              sizes:{UN:65}},
    ]},
    { id:"bebidas", label:"🥤 Bebidas", desc:"Para acompanhar sua pizza", half:false, items:[
      {id:"coca_ks",   name:"Coca-Cola KS",           Image:"/pizzas/cocaks.png",    tags:["bebida"], desc:"Lata KS",                               sizes:{UN:5} },
      {id:"refri_lata",name:"Refrigerante (lata)",    Image:"/pizzas/refrilata.png", tags:["bebida"], desc:"Coca | Pepsi | Guaraná | Fanta | Sprite",sizes:{UN:8} },
      {id:"coca_600",  name:"Coca-Cola 600ml",        Image:"/pizzas/coca600.png",   tags:["bebida"], desc:"Garrafa 600ml",                          sizes:{UN:8} },
      {id:"refri_1l",  name:"Refrigerante 1L",        Image:"/pizzas/refri1l.png",   tags:["bebida"], desc:"Pet 1 litro",                            sizes:{UN:11}},
      {id:"refri_2l",  name:"Refrigerante 2L",        Image:"/pizzas/refri2l.png",   tags:["bebida"], desc:"Pet 2 litros",                           sizes:{UN:14}},
      {id:"schweppes", name:"Schweppes / H2OH! 1,5L", Image:"/pizzas/h2o.png",       tags:["bebida"], desc:"Garrafa 1,5 litro",                      sizes:{UN:14}},
    ]},
  ]
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function applyPrices(base, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) return base
  return {
    ...base,
    categories: base.categories.map(cat => ({
      ...cat,
      items: cat.items.map(p => {
        const ov = overrides[p.id]
        return ov ? { ...p, sizes: { ...p.sizes, ...ov } } : p
      })
    }))
  }
}

const SZL   = { M:"Média", G:"Grande", UN:"Único" }
const brl   = v => `R$ ${Number(v).toFixed(2).replace(".",",")}`
const genId = () => `c${Date.now()}${Math.random().toString(36).slice(2,5)}`

function halfP(p1, p2, sz) {
  const a = p1.sizes[sz] ?? 0, b = p2.sizes[sz] ?? 0
  return Math.max(a, b)
}
function recalc(it) { it.totalPrice = (it.unitPrice + (it.border?.price ?? 0)) * it.quantity; return it }

const isAdmin = () => sessionStorage.getItem(ADMIN_CONFIG.sessionKey) === "1"

/* ═══════════════════════════════════════════════════════════════
   CART CONTEXT
═══════════════════════════════════════════════════════════════ */
const CartCtx   = createContext(null)
const initCart  = { items:[], co:{name:"",address:"",complement:"",pay:null,change:null,notes:""}, cartOpen:false, coOpen:false }

function cartR(s, {type:t, p}) {
  switch(t) {
    case"ADD_S": { const it=recalc({cartItemId:genId(),type:"single",size:p.size,border:p.border,removed:[],quantity:1,unitPrice:p.pizza.sizes[p.size],totalPrice:0,pizza:p.pizza}); return{...s,items:[...s.items,it],cartOpen:true} }
    case"ADD_H": { const it=recalc({cartItemId:genId(),type:"half",size:p.size,border:p.border,removed:[],quantity:1,unitPrice:p.up,totalPrice:0,h1:p.h1,h2:p.h2}); return{...s,items:[...s.items,it],cartOpen:true} }
    case"UPD":   { const items=s.items.map(i=>{if(i.cartItemId!==p.id)return i;const n={...i,quantity:i.quantity+p.d};return n.quantity<1?null:recalc(n)}).filter(Boolean); return{...s,items} }
    case"RM":    return{...s,items:s.items.filter(i=>i.cartItemId!==p.id)}
    case"CLEAR": return{...s,items:[],coOpen:false}
    case"SET_CO":return{...s,co:{...s.co,[p.f]:p.v}}
    case"TOG":   return{...s,cartOpen:!s.cartOpen,coOpen:false}
    case"OPCO":  return{...s,coOpen:true,cartOpen:false}
    case"CLCO":  return{...s,coOpen:false}
    default:     return s
  }
}

function CartProvider({children, menu}) {
  const [s,d] = useReducer(cartR, initCart)
  const ic  = s.items.reduce((a,i)=>a+i.quantity,0)
  const sub = s.items.reduce((a,i)=>a+i.totalPrice,0)
  return (
    <CartCtx.Provider value={{...s,itemCount:ic,subtotal:sub,menu,
      addSingle:(pz,sz,br)=>d({type:"ADD_S",p:{pizza:pz,size:sz,border:br}}),
      addHalf:(h1,h2,sz,br,up)=>d({type:"ADD_H",p:{h1,h2,size:sz,border:br,up}}),
      upd:(id,delta)=>d({type:"UPD",p:{id,d:delta}}),
      rm:id=>d({type:"RM",p:{id}}),
      clear:()=>d({type:"CLEAR"}),
      setCo:(f,v)=>d({type:"SET_CO",p:{f,v}}),
      toggleCart:()=>d({type:"TOG"}),
      openCo:()=>d({type:"OPCO"}),
      closeCo:()=>d({type:"CLCO"}),
    }}>
      {children}
    </CartCtx.Provider>
  )
}
const useCart = () => useContext(CartCtx)

/* ── WhatsApp ── */
function buildMsg(items, co, sub) {
  const sep  = "─────────────────────────────"
  const addr = [co.address, co.complement].filter(Boolean).join(", ")
  return [
    `🍕 *PIZZARIA VARANDA* — Pindamonhangaba`, `📋 *Novo Pedido*`, sep,
    `👤 *Cliente:* ${co.name||"Não informado"}`, `📍 *Endereço:* ${addr||"Não informado"}`,
    `\n🛒 *Itens:*`,
    ...items.map(it => {
      const b = it.border?.id!=="none" ? ` + ${it.border?.label}` : ""
      if(it.type==="half") return `  • ${it.quantity}x Meia (${SZL[it.size]||it.size})${b} — ${brl(it.totalPrice)}\n      ↳ ${it.h1.name} + ${it.h2.name}`
      return `  • ${it.quantity}x ${it.pizza.name} (${SZL[it.size]||it.size})${b} — ${brl(it.totalPrice)}`
    }),
    `\n${sep}`, `💰 *Subtotal dos itens:* ${brl(sub)}`, `🛵 *Frete:* A confirmar pela pizzaria`,
    `⚠️ _Aguarde confirmação do frete._`, `\n💳 *Pagamento:* ${co.pay?.label??"Não informado"}`,
    co.pay?.needsChange&&co.change ? `   🔄 Troco para: ${brl(co.change)}` : "",
    co.notes ? `\n📝 *Obs:* ${co.notes}` : "",
    `\n${sep}\nAguardo confirmação! 😊`,
  ].filter(Boolean).join("\n")
}

/* ═══════════════════════════════════════════════════════════════
   UI HELPERS
═══════════════════════════════════════════════════════════════ */
const Lbl = ({children}) => <p style={{fontSize:"0.72rem",fontWeight:700,color:"var(--stone-500)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:"0.4rem"}}>{children}</p>
const MH  = ({title,sub,onClose}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem",borderBottom:"1px solid var(--stone-200)"}}>
    <div><h2 className="fd" style={{fontWeight:700,fontSize:"1.1rem"}}>{title}</h2>{sub&&<p style={{fontSize:"0.72rem",color:"var(--stone-400)",marginTop:"0.1rem"}}>{sub}</p>}</div>
    <button onClick={onClose} style={{width:"2rem",height:"2rem",borderRadius:"50%",background:"var(--stone-100)",border:"none",fontWeight:700}}>✕</button>
  </div>
)

/* ── Indicador de carregamento ── */
function LoadingBar() {
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,height:"3px",zIndex:9999,background:"linear-gradient(90deg,var(--terracota),var(--olive),var(--terracota))",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}} />
  )
}

/* ── SizeModal ── */
function SizeModal({pizza, isOpen, onClose, onConfirm}) {
  const sizes = pizza ? Object.keys(pizza.sizes).filter(s=>s!=="UN") : []
  const [size,  setSize]   = useState(sizes[0]||"M")
  const [border,setBorder] = useState(MENU_BASE.meta.borders[0])
  useEffect(()=>{ if(isOpen&&pizza){ setSize(Object.keys(pizza.sizes).filter(k=>k!=="UN")[0]||"M"); setBorder(MENU_BASE.meta.borders[0]) } },[isOpen,pizza])
  if(!isOpen||!pizza) return null
  const calcP = () => (pizza.sizes[size]??0) + (border?.price??0)
  return (
    <div className="mw" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mb">
        <MH title={pizza.name} sub={pizza.desc} onClose={onClose}/>
        <div style={{padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1rem",overflowY:"auto"}}>
          {sizes.length>1 && (
            <div><Lbl>Tamanho</Lbl>
              <div style={{display:"flex",gap:"0.5rem"}}>
                {sizes.map(s=>(
                  <button key={s} onClick={()=>setSize(s)} style={{flex:1,padding:"0.75rem",borderRadius:"0.75rem",border:`2px solid ${size===s?"var(--terracota)":"var(--stone-200)"}`,background:size===s?"rgba(192,64,0,0.05)":"transparent",cursor:"pointer",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"0.9rem",color:size===s?"var(--terracota)":"var(--stone-700)"}}>
                    <div>{SZL[s]}</div><div style={{fontSize:"0.8rem",fontWeight:400,opacity:0.7,marginTop:"0.15rem"}}>{brl(pizza.sizes[s])}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div><Lbl>Borda</Lbl>
            <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
              {MENU_BASE.meta.borders.map(opt=>(
                <button key={opt.id} onClick={()=>setBorder(opt)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.7rem",borderRadius:"0.75rem",border:`2px solid ${border?.id===opt.id?"var(--olive)":"var(--stone-200)"}`,background:border?.id===opt.id?"rgba(85,107,47,0.05)":"transparent",cursor:"pointer",fontFamily:"Lato,sans-serif"}}>
                  <span style={{fontWeight:700,fontSize:"0.85rem",color:"var(--stone-700)"}}>{opt.label}</span>
                  <span style={{fontSize:"0.75rem",fontWeight:700,color:opt.price===0?"var(--stone-400)":"var(--terracota)"}}>{opt.price===0?"grátis":`+${brl(opt.price)}`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{padding:"1rem",borderTop:"1px solid var(--stone-100)",background:"var(--stone-100)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.75rem"}}><span style={{color:"var(--stone-600)",fontSize:"0.85rem"}}>Total</span><span style={{fontWeight:700,color:"var(--terracota)"}}>{brl(calcP())}</span></div>
          <button onClick={()=>onConfirm(size,border)} className="br" style={{width:"100%",padding:"0.75rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.9rem"}}>Adicionar ao Carrinho 🛒</button>
        </div>
      </div>
    </div>
  )
}

/* ── Store components ── */
const TAGMAP = {classica:"tc",vegetariana:"tv",premium:"tp",favorito:"tf",picante:"tpi",especial:"tch",light:"tlt",doce:"td",bebida:"tb"}

function Header({onAdmin}) {
  const {itemCount,toggleCart} = useCart()
  return (
    <header style={{position:"fixed",top:0,left:0,right:0,zIndex:30,background:"rgba(253,246,236,.97)",backdropFilter:"blur(8px)",borderBottom:"1px solid var(--stone-200)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.25rem",height:"4rem",maxWidth:"72rem",margin:"0 auto"}}>
        
        {/* LADO ESQUERDO: LOGO + TITULO */}
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {/* Logo da Pizzaria (Ajuste o transform se ficar torto) */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              height: "120px", 
              width: "auto", 
              objectFit: "contain",
              transform: "translateY(0px)" 
            }} 
          />
          
          {/* Escrita Personalizada */}
          <div className="fd" style={{fontWeight:900, fontSize:"1.3rem", display:"flex", gap:"5px"}}>
            <span style={{color: "#800020"}}>Pizzaria</span>
            <span style={{
              color: "#FFD700", 
              WebkitTextStroke: "0.5px #004d00", 
              textShadow: "0px 0px 1px #004d00"
            }}>
              Varanda
            </span>
          </div>
        </div>

        {/* LADO DIREITO: BOTOES (Mantidos originais) */}
        <div style={{display:"flex",gap:"0.5rem",alignItems:"center"}}>
          <button onClick={onAdmin} style={{padding:"0.4rem 0.8rem",borderRadius:"0.6rem",border:"1px solid var(--stone-200)",background:"transparent",fontSize:"0.75rem",fontWeight:700,color:"var(--stone-500)"}}>⚙️ Admin</button>
          <button onClick={toggleCart} className="br" style={{padding:"0.5rem 1rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.85rem",display:"flex",alignItems:"center",gap:"0.4rem",position:"relative"}}>
            🛒 Carrinho
            {itemCount>0&&<span style={{position:"absolute",top:"-0.5rem",right:"-0.5rem",background:"var(--olive)",color:"white",fontSize:"0.65rem",fontWeight:900,width:"1.2rem",height:"1.2rem",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{itemCount}</span>}
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO (Mantida original) */}
      <nav className="noscroll" style={{display:"flex",gap:"0.25rem",padding:"0 1.25rem 0.5rem",overflowX:"auto",maxWidth:"72rem",margin:"0 auto"}}>
        {MENU_BASE.categories.map(c=>(
          <a key={c.id} href={`#${c.id}`} style={{flexShrink:0,fontSize:"0.75rem",fontWeight:700,padding:"0.3rem 0.7rem",borderRadius:"999px",color:"var(--stone-600)",transition:"all .2s",whiteSpace:"nowrap"}}
            onMouseEnter={e=>{e.target.style.background="rgba(192,64,0,.1)";e.target.style.color="var(--terracota)"}}
            onMouseLeave={e=>{e.target.style.background="transparent";e.target.style.color="var(--stone-600)"}}>
            {c.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
function ProductCard({pizza,allowsHalf,onAdd,onHalf}) {
  const prices = Object.values(pizza.sizes), lo = Math.min(...prices)
  const isUnique = Object.keys(pizza.sizes).length===1 && pizza.sizes.UN!==undefined
  const bg = pizza.tags.includes("bebida")?"linear-gradient(135deg,#dbeafe,#bfdbfe)":pizza.tags.includes("doce")||(pizza.tags.includes("especial")&&pizza.emoji==="🦬")?"linear-gradient(135deg,#fce7f3,#fbcfe8)":"linear-gradient(135deg,#fffbeb,#fed7aa)"
  return (
    <article className="card" style={{display:"flex",flexDirection:"column",overflow:"hidden",borderRadius:"0.8rem",background:"white",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
      <div style={{height:"9rem",width:"100%",overflow:"hidden",background:bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <img src={pizza.Image} alt={pizza.name} style={{width:"100%",height:"100%",objectFit:"cover",userSelect:"none"}} onError={e=>{e.target.style.display="none";e.target.parentNode.innerText=pizza.emoji||"🍕"}}/>
      </div>
      <div style={{padding:"0.9rem",display:"flex",flexDirection:"column",gap:"0.35rem",flex:1}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:"0.2rem"}}>
          {pizza.tags.slice(0,2).map(t=><span key={t} className={`tag ${TAGMAP[t]||""}`}>{t}</span>)}
        </div>
        <h3 className="fd" style={{fontWeight:700,fontSize:"0.95rem",lineHeight:1.2}}>{pizza.name}</h3>
        <p style={{fontSize:"0.75rem",color:"var(--stone-500)",lineHeight:1.4,flex:1,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{pizza.desc}</p>
        <p style={{fontSize:"0.82rem",fontWeight:700,color:"var(--terracota)"}}>{isUnique?brl(lo):`${brl(lo)} – ${brl(Math.max(...prices))}`}</p>
        <div style={{display:"flex",gap:"0.5rem",marginTop:"0.2rem"}}>
          <button onClick={()=>onAdd(pizza)} className="br" style={{flex:1,padding:"0.45rem",borderRadius:"0.6rem",fontWeight:700,fontSize:"0.78rem"}}>{isUnique?"Adicionar":"Escolher tamanho"}</button>
          {allowsHalf&&<button onClick={()=>onHalf(pizza)} className="bg" style={{padding:"0.45rem 0.65rem",borderRadius:"0.6rem",fontWeight:700,fontSize:"0.78rem"}}>Meia</button>}
        </div>
      </div>
    </article>
  )
}

function CartRow({item}) {
  const {upd,rm} = useCart()
  const title = item.type==="half" ? `Meia: ${item.h1.name} + ${item.h2.name}` : item.pizza.name
  const sub   = [SZL[item.size]||item.size, item.border?.id!=="none"?item.border?.label:null].filter(Boolean).join(" · ")
  return (
    <div style={{display:"flex",gap:"0.75rem",paddingTop:"0.75rem",paddingBottom:"0.75rem",borderBottom:"1px solid var(--stone-100)"}}>
      <span style={{fontSize:"1.3rem",width:"2rem",textAlign:"center",flexShrink:0}}>{item.type==="half"?"🍕":item.pizza.emoji}</span>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:"0.85rem",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title}</p>
        {sub&&<p style={{fontSize:"0.7rem",color:"var(--stone-400)",marginTop:"0.1rem"}}>{sub}</p>}
        <p style={{fontSize:"0.85rem",fontWeight:700,color:"var(--terracota)",marginTop:"0.2rem"}}>{brl(item.totalPrice)}</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.2rem",flexShrink:0}}>
        <button onClick={()=>upd(item.cartItemId,1)} style={{width:"1.5rem",height:"1.5rem",borderRadius:"50%",background:"var(--stone-100)",border:"none",fontWeight:700,fontSize:"0.9rem"}}>+</button>
        <span style={{fontSize:"0.85rem",fontWeight:700,width:"1.25rem",textAlign:"center"}}>{item.quantity}</span>
        <button onClick={()=>item.quantity===1?rm(item.cartItemId):upd(item.cartItemId,-1)} style={{width:"1.5rem",height:"1.5rem",borderRadius:"50%",background:"var(--stone-100)",border:"none",fontWeight:700,fontSize:"0.85rem"}}>{item.quantity===1?"🗑":"−"}</button>
      </div>
    </div>
  )
}

function CartDrawer() {
  const {items,subtotal,cartOpen,toggleCart,openCo} = useCart()
  return (
    <>{cartOpen&&<div className="ov" onClick={toggleCart}/>}
    <aside className={`drawer ${cartOpen?"dopen":"dclosed"}`}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem",borderBottom:"1px solid var(--stone-100)"}}>
        <h2 className="fd" style={{fontWeight:700,fontSize:"1.1rem"}}>🛒 Seu Pedido</h2>
        <button onClick={toggleCart} style={{width:"2rem",height:"2rem",borderRadius:"50%",background:"var(--stone-100)",border:"none",fontWeight:700}}>✕</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"1rem"}}>
        {items.length===0?<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:"0.75rem",color:"var(--stone-400)"}}>
          <span style={{fontSize:"3rem"}}>🍕</span><p style={{fontWeight:700}}>Carrinho vazio</p>
          <p style={{fontSize:"0.8rem",textAlign:"center"}}>Adicione pizzas para começar!</p>
        </div>:items.map(it=><CartRow key={it.cartItemId} item={it}/>)}
      </div>
      {items.length>0&&(
        <div style={{padding:"1rem",borderTop:"1px solid var(--stone-100)",background:"var(--stone-100)",display:"flex",flexDirection:"column",gap:"0.4rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",color:"var(--stone-600)"}}><span>Subtotal dos itens</span><span>{brl(subtotal)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.75rem",color:"var(--stone-400)",fontStyle:"italic"}}><span>Frete</span><span>A confirmar</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,paddingTop:"0.5rem",marginTop:"0.1rem",borderTop:"1px solid var(--stone-200)"}}><span>Total s/ frete</span><span style={{color:"var(--terracota)"}}>{brl(subtotal)}</span></div>
          <button onClick={openCo} className="bo" style={{width:"100%",padding:"0.75rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.85rem",marginTop:"0.25rem"}}>📲 Finalizar via WhatsApp</button>
        </div>
      )}
    </aside></>
  )
}

function HalfModal({isOpen,onClose,initPizza}) {
  const {addHalf,menu} = useCart()
  const [h1,setH1]   = useState(initPizza)
  const [h2,setH2]   = useState(null)
  const [size,setSize] = useState("M")
  const [border,setBorder] = useState(MENU_BASE.meta.borders[0])
  const [step,setStep] = useState(initPizza?2:1)
  useEffect(()=>{if(isOpen){setH1(initPizza??null);setH2(null);setSize("M");setBorder(MENU_BASE.meta.borders[0]);setStep(initPizza?2:1)}},[isOpen,initPizza])
  if(!isOpen) return null
  const all   = menu.categories.filter(c=>c.half).flatMap(c=>c.items)
  const avSz  = h1&&h2?Object.keys(h1.sizes).filter(s=>h2.sizes[s]&&s!=="UN"):h1?Object.keys(h1.sizes).filter(s=>s!=="UN"):["M","G"]
  const calcP = ()=>(!h1||!h2)?0:Math.max(h1.sizes[size]??0,h2.sizes[size]??0)+(border?.price??0)
  return (
    <div className="mw" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mb">
        <MH title="Pizza Meio a Meio" sub={step===1?"Escolha a 1ª metade":step===2?"Escolha a 2ª metade":"Configure tamanho e borda"} onClose={onClose}/>
        <div style={{overflowY:"auto",flex:1,padding:"1rem"}}>
          <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
            {[h1,h2].map((h,idx)=>(
              <button key={idx} onClick={()=>setStep(idx+1)} style={{flex:1,padding:"0.75rem",borderRadius:"0.75rem",border:`2px solid ${step===idx+1?"var(--terracota)":h?"var(--olive)":"var(--stone-300)"}`,borderStyle:!h?"dashed":undefined,background:step===idx+1?"rgba(192,64,0,0.05)":h?"rgba(85,107,47,0.05)":"transparent",cursor:"pointer",textAlign:"center",fontFamily:"Lato,sans-serif"}}>
                <div style={{fontSize:"1.5rem"}}>{h?.emoji??"?"}</div>
                <div style={{fontSize:"0.75rem",fontWeight:700,color:"var(--stone-700)",marginTop:"0.2rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h?h.name:`${idx+1}ª metade`}</div>
              </button>
            ))}
          </div>
          {(step===1||step===2)&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
              {all.map(p=>{
                const isSel=step===1?h1?.id===p.id:h2?.id===p.id
                const isOther=step===1?h2?.id===p.id:h1?.id===p.id
                return <button key={p.id} disabled={isOther} onClick={()=>{if(step===1){setH1(p);setStep(2)}else{setH2(p);setStep(3)}}}
                  style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.6rem",borderRadius:"0.75rem",border:`2px solid ${isSel?"var(--terracota)":"var(--stone-200)"}`,background:isSel?"rgba(192,64,0,0.05)":"transparent",cursor:isOther?"not-allowed":"pointer",opacity:isOther?0.3:1,textAlign:"left",fontFamily:"Lato,sans-serif"}}>
                  <span style={{fontSize:"1.1rem",flexShrink:0}}>{p.emoji}</span>
                  <span style={{fontSize:"0.72rem",fontWeight:700,color:"var(--stone-700)",lineHeight:1.3}}>{p.name}</span>
                </button>
              })}
            </div>
          )}
          {step===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:"1.2rem"}}>
              <div><Lbl>Tamanho</Lbl>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                  {avSz.map(s=><button key={s} onClick={()=>setSize(s)} style={{padding:"0.7rem",borderRadius:"0.75rem",border:`2px solid ${size===s?"var(--terracota)":"var(--stone-200)"}`,background:size===s?"rgba(192,64,0,0.05)":"transparent",cursor:"pointer",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"0.85rem",color:size===s?"var(--terracota)":"var(--stone-700)"}}>{SZL[s]||s}</button>)}
                </div>
              </div>
              <div><Lbl>Borda</Lbl>
                <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
                  {MENU_BASE.meta.borders.map(opt=>(
                    <button key={opt.id} onClick={()=>setBorder(opt)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.7rem",borderRadius:"0.75rem",border:`2px solid ${border?.id===opt.id?"var(--olive)":"var(--stone-200)"}`,background:border?.id===opt.id?"rgba(85,107,47,0.05)":"transparent",cursor:"pointer",fontFamily:"Lato,sans-serif"}}>
                      <span style={{fontWeight:700,fontSize:"0.85rem",color:"var(--stone-700)"}}>{opt.label}</span>
                      <span style={{fontSize:"0.75rem",fontWeight:700,color:opt.price===0?"var(--stone-400)":"var(--terracota)"}}>{opt.price===0?"grátis":`+${brl(opt.price)}`}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{padding:"1rem",borderTop:"1px solid var(--stone-100)",background:"var(--stone-100)"}}>
          {h1&&h2&&<div style={{display:"flex",justifyContent:"space-between",fontSize:"0.85rem",marginBottom:"0.75rem"}}><span style={{color:"var(--stone-600)"}}>Preço ({SZL[size]||size})</span><span style={{fontWeight:700,color:"var(--terracota)"}}>{brl(calcP())}</span></div>}
          <div style={{display:"flex",gap:"0.5rem"}}>
            {step>1&&<button onClick={()=>setStep(step-1)} className="bl" style={{flex:1,padding:"0.6rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.85rem"}}>← Voltar</button>}
            {step===3&&h1&&h2?<button onClick={()=>{addHalf(h1,h2,size,border,calcP()-(border?.price??0));onClose()}} className="br" style={{flex:1,padding:"0.6rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.85rem"}}>Adicionar 🛒</button>
            :step<3&&h1?<button onClick={()=>setStep(step+1)} className="br" style={{flex:1,padding:"0.6rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.85rem"}}>Próximo →</button>:null}
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutModal({onOrderSaved}) {
  const {items,co,coOpen,subtotal,setCo,closeCo,clear} = useCart()
  const [errors,setErrors] = useState([])
  const [sent,setSent]     = useState(false)
  const [saving,setSaving] = useState(false)
  if(!coOpen) return null

  const send = async () => {
    const errs = []
    if(!co.name.trim())   errs.push("Informe seu nome.")
    if(!co.address.trim())errs.push("Informe o endereço de entrega.")
    if(!co.pay)           errs.push("Selecione a forma de pagamento.")
    if(co.pay?.needsChange&&!co.change) errs.push("Informe o valor para troco.")
    if(items.length===0)  errs.push("Carrinho vazio.")
    if(errs.length){ setErrors(errs); return }
    setErrors([])
    setSaving(true)

    const order = {
      id:genId(), date:new Date().toISOString(), customerName:co.name,
      address:[co.address,co.complement].filter(Boolean).join(", "),
      payment:co.pay?.label, subtotal,
      items:items.map(it=>({type:it.type,size:it.size,quantity:it.quantity,totalPrice:it.totalPrice,
        pizzaName:it.type==="half"?`Meia: ${it.h1.name} + ${it.h2.name}`:it.pizza.name,
        pizzaIds:it.type==="half"?[it.h1.id,it.h2.id]:[it.pizza.id],
        pizzaNames:it.type==="half"?[it.h1.name,it.h2.name]:[it.pizza.name]}))
    }

    try { await fbSaveOrder(order) } catch(e) { console.warn("Firebase offline, order not saved:", e) }

    window.open(`https://wa.me/${MENU_BASE.meta.whatsappNumber}?text=${encodeURIComponent(buildMsg(items,co,subtotal))}`,"_blank")
    setSaving(false)
    setSent(true)
    onOrderSaved()
  }

  if(sent) return (
    <div className="mw"><div className="mb" style={{padding:"2rem",alignItems:"center",justifyContent:"center",textAlign:"center",gap:"1rem",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:"3rem"}}>✅</div><h2 className="fd" style={{fontWeight:700,fontSize:"1.3rem"}}>Pedido enviado!</h2>
      <p style={{fontSize:"0.9rem",color:"var(--stone-500)",lineHeight:1.6}}>O WhatsApp foi aberto com seu pedido.<br/>A pizzaria confirmará o frete em breve.</p>
      <button onClick={()=>{setSent(false);closeCo();clear()}} className="br" style={{width:"100%",padding:"0.875rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.9rem"}}>Fechar</button>
    </div></div>
  )

  return (
    <div className="mw" onClick={e=>e.target===e.currentTarget&&closeCo()}>
      <div className="mb">
        <MH title="Finalizar Pedido" onClose={closeCo}/>
        <div style={{overflowY:"auto",flex:1,padding:"1.25rem",display:"flex",flexDirection:"column",gap:"1.1rem"}}>
          {errors.length>0&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.75rem",padding:"0.75rem",display:"flex",flexDirection:"column",gap:"0.2rem"}}>{errors.map((e,i)=><p key={i} style={{fontSize:"0.82rem",color:"#b91c1c"}}>⚠️ {e}</p>)}</div>}
          <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:"0.75rem",padding:"0.75rem"}}>
            <p style={{fontSize:"0.82rem",fontWeight:700,color:"#92400e"}}>🛵 Frete a confirmar</p>
            <p style={{fontSize:"0.78rem",color:"#78350f",marginTop:"0.2rem",lineHeight:1.5}}>Após receber seu pedido, a pizzaria confirma o frete pelo seu endereço.</p>
          </div>
          <div><Lbl>Seu Nome *</Lbl><input className="inp" type="text" value={co.name} onChange={e=>setCo("name",e.target.value)} placeholder="Ex: João Silva"/></div>
          <div><Lbl>Endereço de Entrega *</Lbl><input className="inp" type="text" value={co.address} onChange={e=>setCo("address",e.target.value)} placeholder="Ex: Rua das Flores, 123 — Santana"/></div>
          <div><Lbl>Complemento (opcional)</Lbl><input className="inp" type="text" value={co.complement} onChange={e=>setCo("complement",e.target.value)} placeholder="Ex: Apto 42, portão azul..."/></div>
          <div><Lbl>Pagamento *</Lbl>
            <div style={{display:"flex",flexDirection:"column",gap:"0.35rem"}}>
              {MENU_BASE.meta.payments.map(m=>(
                <button key={m.id} onClick={()=>{setCo("pay",m);setCo("change",null)}} style={{padding:"0.7rem",borderRadius:"0.75rem",border:`2px solid ${co.pay?.id===m.id?"var(--olive)":"var(--stone-200)"}`,background:co.pay?.id===m.id?"rgba(85,107,47,0.05)":"transparent",cursor:"pointer",textAlign:"left",fontFamily:"Lato,sans-serif",fontWeight:700,fontSize:"0.85rem",color:co.pay?.id===m.id?"var(--olive)":"var(--stone-700)"}}>{m.label}</button>
              ))}
            </div>
          </div>
          {co.pay?.needsChange&&<div><Lbl>Troco para quanto? *</Lbl><input className="inp" type="number" value={co.change??""} onChange={e=>setCo("change",parseFloat(e.target.value)||null)} placeholder={`Ex: ${(Math.ceil(subtotal/10)*10).toFixed(2)}`} min={subtotal}/></div>}
          <div><Lbl>Observações (opcional)</Lbl><textarea className="inp" rows={3} value={co.notes} onChange={e=>setCo("notes",e.target.value)} placeholder="Ex: Sem cebola, campainha quebrada... (Use este campo para informar os sabores das pizzas 3 e 4 sabores!)"/></div>
        </div>
        <div style={{padding:"1rem",borderTop:"1px solid var(--stone-200)",background:"var(--stone-100)",display:"flex",flexDirection:"column",gap:"0.4rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:700}}><span>Subtotal dos itens</span><span style={{color:"var(--terracota)"}}>{brl(subtotal)}</span></div>
          <p style={{fontSize:"0.72rem",color:"var(--stone-400)",fontStyle:"italic"}}>+ Frete a confirmar pela pizzaria</p>
          <button onClick={send} disabled={saving} className="bgreen" style={{width:"100%",padding:"0.875rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.9rem",display:"flex",alignItems:"center",justifyContent:"center",gap:"0.5rem",marginTop:"0.25rem",opacity:saving?0.7:1}}>
            {saving?"Salvando…":"📲 Enviar Pedido pelo WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ADMIN
═══════════════════════════════════════════════════════════════ */
function AdminLogin({onLogin,onBack}) {
  const [user,setUser]=useState(""), [pass,setPass]=useState(""), [err,setErr]=useState(false)
  const handle=()=>{if(user===ADMIN_CONFIG.username&&pass===ADMIN_CONFIG.password){sessionStorage.setItem(ADMIN_CONFIG.sessionKey,"1");onLogin()}else{setErr(true);setPass("")}}
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--cream)",padding:"1rem"}}>
      <style>{globalStyles}</style>
      <div style={{background:"white",borderRadius:"1.25rem",padding:"2rem",width:"100%",maxWidth:"22rem",boxShadow:"0 8px 40px rgba(0,0,0,.1)"}}>
        <div className="fd" style={{fontWeight:900,fontSize:"1.5rem",color:"var(--terracota)",textAlign:"center",marginBottom:"0.15rem"}}>⚙️ Admin</div>
        <p style={{textAlign:"center",fontSize:"0.8rem",color:"var(--stone-400)",marginBottom:"1.5rem"}}>Pizzaria Varanda</p>
        {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.75rem",padding:"0.65rem",marginBottom:"1rem",fontSize:"0.82rem",color:"#b91c1c",textAlign:"center"}}>❌ Usuário ou senha incorretos</div>}
        <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
          <div><Lbl>Usuário</Lbl><input className="inp" type="text" value={user} onChange={e=>setUser(e.target.value)} placeholder="admin"/></div>
          <div><Lbl>Senha</Lbl><input className="inp" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()}/></div>
          <button onClick={handle} className="br" style={{width:"100%",padding:"0.75rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.9rem",marginTop:"0.25rem"}}>Entrar</button>
          <button onClick={onBack} style={{width:"100%",padding:"0.6rem",borderRadius:"0.75rem",fontWeight:700,fontSize:"0.85rem",background:"transparent",border:"none",color:"var(--stone-400)",cursor:"pointer"}}>← Voltar ao site</button>
        </div>
      </div>
    </div>
  )
}

function AdminOverview({orders}) {
  const today  = new Date().toDateString()
  const todayO = orders.filter(o=>new Date(o.date).toDateString()===today)
  const stats  = [{icon:"📦",label:"Pedidos Hoje",value:todayO.length},{icon:"💰",label:"Receita Hoje*",value:brl(todayO.reduce((a,o)=>a+o.subtotal,0))},{icon:"📋",label:"Total Pedidos",value:orders.length},{icon:"💵",label:"Receita Total*",value:brl(orders.reduce((a,o)=>a+o.subtotal,0))}]
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <h2 className="fd" style={{fontWeight:700,fontSize:"1.3rem"}}>📊 Visão Geral</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"0.75rem"}}>
        {stats.map((s,i)=>(
          <div key={i} style={{background:"white",borderRadius:"1rem",border:"1px solid var(--stone-200)",padding:"1.1rem",display:"flex",flexDirection:"column",gap:"0.3rem"}}>
            <span style={{fontSize:"1.4rem"}}>{s.icon}</span>
            <p style={{fontSize:"1.3rem",fontWeight:900,color:"var(--terracota)",lineHeight:1}}>{s.value}</p>
            <p style={{fontSize:"0.72rem",color:"var(--stone-500)"}}>{s.label}</p>
          </div>
        ))}
      </div>
      <p style={{fontSize:"0.72rem",color:"var(--stone-400)",fontStyle:"italic"}}>* Somente subtotal dos itens, sem frete.</p>
    </div>
  )
}

function AdminRanking({orders}) {
  const ranking = useMemo(()=>{
    const c={}
    orders.forEach(o=>o.items.forEach(it=>it.pizzaIds.forEach((id,idx)=>{
      const name=it.pizzaNames[idx]
      if(!c[id])c[id]={id,name,count:0}
      c[id].count+=it.type==="half"?it.quantity*0.5:it.quantity
    })))
    return Object.values(c).sort((a,b)=>b.count-a.count)
  },[orders])
  if(!ranking.length) return <div style={{textAlign:"center",padding:"3rem",color:"var(--stone-400)"}}><p style={{fontSize:"2rem",marginBottom:"0.5rem"}}>📊</p><p style={{fontWeight:700}}>Nenhum pedido ainda</p></div>
  const max=ranking[0].count, medals=["🥇","🥈","🥉"]
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <h2 className="fd" style={{fontWeight:700,fontSize:"1.3rem"}}>🏆 Sabores Mais Pedidos</h2>
      <p style={{fontSize:"0.8rem",color:"var(--stone-400)"}}>Meio a meio conta 0,5 por metade. Novos sabores aparecem automaticamente.</p>
      <div style={{display:"flex",flexDirection:"column",gap:"0.6rem"}}>
        {ranking.map((item,idx)=>{
          const found=MENU_BASE.categories.flatMap(c=>c.items).find(p=>p.id===item.id)
          const pct=Math.round((item.count/max)*100)
          const countLabel=item.count%1===0?item.count:item.count.toFixed(1)
          return (
            <div key={item.id} style={{background:"white",borderRadius:"0.75rem",border:"1px solid var(--stone-200)",padding:"0.75rem 1rem"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"0.4rem"}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                  <span>{medals[idx]??`${idx+1}º`}</span>
                  <span>{found?.emoji??"🍕"}</span>
                  <span style={{fontWeight:700,fontSize:"0.9rem"}}>{item.name}</span>
                </div>
                <span style={{fontWeight:900,color:"var(--terracota)",fontSize:"0.9rem"}}>{countLabel}×</span>
              </div>
              <div style={{height:"8px",background:"var(--stone-100)",borderRadius:"4px",overflow:"hidden"}}>
                <div className="bar" style={{width:`${pct}%`}}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AdminHistory({orders, onDelete, onClear}) {
  const [confirmClear,setConfirmClear] = useState(false)
  const [confirmDelId,setConfirmDelId] = useState(null)
  if(!orders.length) return <div style={{textAlign:"center",padding:"3rem",color:"var(--stone-400)"}}><p style={{fontSize:"2rem",marginBottom:"0.5rem"}}>📋</p><p style={{fontWeight:700}}>Nenhum pedido registrado</p></div>
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <h2 className="fd" style={{fontWeight:700,fontSize:"1.3rem"}}>📋 Histórico</h2>
        {!confirmClear
          ?<button onClick={()=>setConfirmClear(true)} className="bdan" style={{padding:"0.4rem 0.85rem",borderRadius:"0.6rem",fontSize:"0.78rem",fontWeight:700}}>🗑 Limpar tudo</button>
          :<div style={{display:"flex",gap:"0.5rem"}}>
            <button onClick={()=>{onClear();setConfirmClear(false)}} className="bdan" style={{padding:"0.4rem 0.85rem",borderRadius:"0.6rem",fontSize:"0.78rem",fontWeight:700}}>Confirmar</button>
            <button onClick={()=>setConfirmClear(false)} className="bl" style={{padding:"0.4rem 0.85rem",borderRadius:"0.6rem",fontSize:"0.78rem",fontWeight:700}}>Cancelar</button>
          </div>
        }
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
        {orders.map(o=>(
          <div key={o.id} style={{background:"white",borderRadius:"0.75rem",border:`1px solid ${confirmDelId===o.id?"#fca5a5":"var(--stone-200)"}`,padding:"1rem",transition:"border-color .2s"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"0.35rem"}}>
              <div>
                <p style={{fontWeight:700,fontSize:"0.9rem"}}>{o.customerName}</p>
                <p style={{fontSize:"0.72rem",color:"var(--stone-500)"}}>{new Date(o.date).toLocaleString("pt-BR")}</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <span style={{fontWeight:900,color:"var(--terracota)",fontSize:"0.9rem"}}>{brl(o.subtotal)}</span>
                {confirmDelId===o.id
                  ?<div style={{display:"flex",gap:"0.35rem"}}>
                    <button onClick={()=>{onDelete(o.id);setConfirmDelId(null)}} className="bdan" style={{padding:"0.25rem 0.6rem",borderRadius:"0.5rem",fontSize:"0.72rem",fontWeight:700}}>Remover</button>
                    <button onClick={()=>setConfirmDelId(null)} className="bl" style={{padding:"0.25rem 0.6rem",borderRadius:"0.5rem",fontSize:"0.72rem",fontWeight:700}}>Não</button>
                  </div>
                  :<button onClick={()=>setConfirmDelId(o.id)} style={{padding:"0.25rem 0.5rem",borderRadius:"0.5rem",background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",fontSize:"0.72rem",fontWeight:700,cursor:"pointer"}}>✕ Cancelar</button>
                }
              </div>
            </div>
            <p style={{fontSize:"0.75rem",color:"var(--stone-500)",marginBottom:"0.5rem"}}>📍 {o.address}</p>
            <div style={{borderTop:"1px solid var(--stone-100)",paddingTop:"0.5rem",display:"flex",flexDirection:"column",gap:"0.2rem"}}>
              {o.items.map((it,i)=><p key={i} style={{fontSize:"0.78rem",color:"var(--stone-600)"}}>{it.quantity}× {it.pizzaName} ({SZL[it.size]??it.size})</p>)}
            </div>
            <p style={{fontSize:"0.72rem",color:"var(--stone-400)",marginTop:"0.4rem"}}>💳 {o.payment} · + frete a confirmar</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPrices({currentPrices, onSaved}) {
  const [draft,  setDraft]  = useState(()=>{
    const d = {}
    MENU_BASE.categories.forEach(cat=>cat.items.forEach(p=>{
      d[p.id] = { ...p.sizes, ...(currentPrices[p.id]||{}) }
    }))
    return d
  })
  const [search, setSearch] = useState("")
  const [msg,    setMsg]    = useState("")
  const [saving, setSaving] = useState(false)

  // Atualiza o draft se os preços externos mudarem
  useEffect(()=>{
    setDraft(prev=>{
      const d = {}
      MENU_BASE.categories.forEach(cat=>cat.items.forEach(p=>{
        d[p.id] = { ...p.sizes, ...(currentPrices[p.id]||{}), ...prev[p.id] }
      }))
      return d
    })
  },[currentPrices])

  const allItems = MENU_BASE.categories.flatMap(cat=>cat.items.map(p=>({...p,catLabel:cat.label})))
  const filtered = search.trim() ? allItems.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())) : allItems

  const handleChange = (id,sk,val) => { const n=parseFloat(val); setDraft(d=>({...d,[id]:{...d[id],[sk]:isNaN(n)?d[id][sk]:n}}))}

  const handleSave = async () => {
    setSaving(true)
    const ov = {}
    MENU_BASE.categories.forEach(cat=>cat.items.forEach(p=>{
      const diff = {}
      Object.keys(p.sizes).forEach(k=>{ if(draft[p.id][k]!==p.sizes[k]) diff[k]=draft[p.id][k] })
      if(Object.keys(diff).length>0) ov[p.id] = diff
    }))
    try {
      await fbSavePrices(ov)
      setMsg("✅ Preços salvos e sincronizados!")
      onSaved(ov)
    } catch(e) {
      setMsg("❌ Erro ao salvar. Verifique o Firebase.")
      console.error(e)
    }
    setSaving(false)
    setTimeout(()=>setMsg(""),3000)
  }

  const handleReset = async () => {
    setSaving(true)
    try {
      await fbSavePrices({})
      const d = {}
      MENU_BASE.categories.forEach(cat=>cat.items.forEach(p=>{ d[p.id]={...p.sizes} }))
      setDraft(d)
      setMsg("↩️ Preços restaurados ao padrão!")
      onSaved({})
    } catch(e) {
      setMsg("❌ Erro ao restaurar.")
    }
    setSaving(false)
    setTimeout(()=>setMsg(""),3000)
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 className="fd" style={{fontWeight:700,fontSize:"1.3rem"}}>💰 Editar Preços</h2>
        <div style={{display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
          {msg&&<span style={{fontSize:"0.82rem",fontWeight:700,color:"#16a34a"}}>{msg}</span>}
          <button onClick={handleReset} disabled={saving} className="bl" style={{padding:"0.4rem 0.85rem",borderRadius:"0.6rem",fontSize:"0.78rem",fontWeight:700}}>↩️ Restaurar padrão</button>
          <button onClick={handleSave} disabled={saving} className="bgreen" style={{padding:"0.4rem 0.85rem",borderRadius:"0.6rem",fontSize:"0.78rem",fontWeight:700}}>{saving?"Salvando…":"💾 Salvar"}</button>
        </div>
      </div>
      <p style={{fontSize:"0.8rem",color:"var(--stone-400)"}}>Edite os valores e clique em Salvar. Os novos preços ficam sincronizados em todos os dispositivos automaticamente. Itens com borda amarela foram editados.</p>
      <input className="inp" placeholder="🔍 Buscar pizza..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:"20rem"}}/>
      <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
        {filtered.map(p=>{
          const sizeKeys = Object.keys(p.sizes)
          const hasOverride = sizeKeys.some(k => draft[p.id]?.[k] !== p.sizes[k])
          return (
            <div key={p.id} style={{background:"white",borderRadius:"0.75rem",border:`1px solid ${hasOverride?"#fcd34d":"var(--stone-200)"}`,padding:"0.75rem 1rem",display:"flex",alignItems:"center",gap:"0.75rem",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:"10rem"}}>
                <p style={{fontWeight:700,fontSize:"0.88rem",color:"var(--stone-800)"}}>{p.name}</p>
                <p style={{fontSize:"0.7rem",color:"var(--stone-400)"}}>{p.catLabel}{hasOverride?" · ✏️ editado":""}</p>
              </div>
              <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",alignItems:"center"}}>
                {sizeKeys.map(k=>(
                  <div key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"0.2rem"}}>
                    <span style={{fontSize:"0.65rem",fontWeight:700,color:"var(--stone-500)",textTransform:"uppercase"}}>{SZL[k]||k}</span>
                    <div style={{display:"flex",alignItems:"center",gap:"0.25rem"}}>
                      <span style={{fontSize:"0.75rem",color:"var(--stone-400)"}}>R$</span>
                      <input type="number" className="inp-sm" value={draft[p.id]?.[k]??p.sizes[k]}
                        onChange={e=>handleChange(p.id,k,e.target.value)} step="0.5" min="0"
                        style={{borderColor: draft[p.id]?.[k]!==p.sizes[k] ? "#fcd34d" : "var(--stone-200)"}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AdminPanel({onLogout, orders, prices, onOrdersChanged, onPricesChanged}) {
  const [tab,    setTab]    = useState("overview")
  const [loading,setLoading]= useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const [newOrders, newPrices] = await Promise.all([fbLoadOrders(), fbLoadPrices()])
      onOrdersChanged(newOrders)
      onPricesChanged(newPrices)
    } catch(e){ console.error(e) }
    setLoading(false)
  }

  const handleDelete = async id => {
    await fbDeleteOrder(id)
    onOrdersChanged(orders.filter(o=>o.id!==id))
  }

  const handleClear = async () => {
    await fbClearOrders()
    onOrdersChanged([])
  }

  const tabs = [{id:"overview",label:"📊 Visão Geral"},{id:"ranking",label:"🏆 Ranking"},{id:"prices",label:"💰 Preços"},{id:"history",label:"📋 Histórico"}]

  return (
    <div style={{minHeight:"100vh",background:"#f8f7f5",display:"flex",flexDirection:"column"}}>
      <style>{globalStyles}</style>
      {loading && <LoadingBar/>}
      <div style={{background:"white",borderBottom:"1px solid var(--stone-200)",padding:"0 1.25rem",height:"3.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
          <span className="fd" style={{fontWeight:900,color:"var(--terracota)",fontSize:"1.1rem"}}>⚙️ Admin</span>
          <span style={{fontSize:"0.75rem",color:"var(--stone-400)"}}>Pizzaria Varanda</span>
        </div>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <button onClick={refresh} style={{padding:"0.35rem 0.75rem",borderRadius:"0.6rem",border:"1px solid var(--stone-200)",background:"transparent",fontSize:"0.75rem",fontWeight:700,color:"var(--stone-500)",cursor:"pointer"}}>🔄 Atualizar</button>
          <button onClick={()=>{sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);onLogout()}} style={{padding:"0.35rem 0.75rem",borderRadius:"0.6rem",border:"none",background:"var(--stone-100)",fontSize:"0.75rem",fontWeight:700,color:"var(--stone-600)",cursor:"pointer"}}>Sair</button>
        </div>
      </div>
      <div className="noscroll" style={{background:"white",borderBottom:"1px solid var(--stone-200)",padding:"0 1.25rem",display:"flex",gap:"0.1rem",overflowX:"auto"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"0.75rem 1rem",fontWeight:700,fontSize:"0.82rem",border:"none",background:"transparent",cursor:"pointer",borderBottom:`2px solid ${tab===t.id?"var(--terracota)":"transparent"}`,color:tab===t.id?"var(--terracota)":"var(--stone-500)",transition:"all .2s",whiteSpace:"nowrap"}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{flex:1,padding:"1.25rem",maxWidth:"56rem",width:"100%",margin:"0 auto"}}>
        {tab==="overview" && <AdminOverview orders={orders}/>}
        {tab==="ranking"  && <AdminRanking  orders={orders}/>}
        {tab==="prices"   && <AdminPrices   currentPrices={prices} onSaved={onPricesChanged}/>}
        {tab==="history"  && <AdminHistory  orders={orders} onClear={handleClear} onDelete={handleDelete}/>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STORE VIEW
═══════════════════════════════════════════════════════════════ */
function StoreView({menu, onAdmin, onOrderSaved}) {
  const {addSingle} = useCart()
  const [halfOpen,  setHalfOpen]  = useState(false)
  const [halfInit,  setHalfInit]  = useState(null)
  const [sizeModal, setSizeModal] = useState({open:false,pizza:null})

  const handleAdd = useCallback((pizza)=>{
    const keys = Object.keys(pizza.sizes)
    if(keys.length===1&&keys[0]==="UN") addSingle(pizza,"UN",MENU_BASE.meta.borders[0])
    else setSizeModal({open:true,pizza})
  },[addSingle])

  const handleSizeConfirm = useCallback((size,border)=>{
    addSingle(sizeModal.pizza,size,border)
    setSizeModal({open:false,pizza:null})
  },[addSingle,sizeModal.pizza])

  const handleHalf = useCallback((pizza)=>{setHalfInit(pizza);setHalfOpen(true)},[])

  return (
    <div style={{minHeight:"100vh",background:"var(--cream)"}}>
      <style>{globalStyles}</style>
      <Header onAdmin={onAdmin}/>
      <section style={{paddingTop:"6.5rem",paddingBottom:"3rem",textAlign:"center",background:"linear-gradient(to bottom,#fffbeb,var(--cream))",padding:"6.5rem 1.25rem 3rem"}}>
        <p style={{fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--terracota)",opacity:.8,marginBottom:"0.5rem"}}>Pindamonhangaba · Desde 2007</p>
        <h1 className="fd" style={{fontWeight:900,fontSize:"clamp(2rem,7vw,3.5rem)",lineHeight:1.15,color:"var(--stone-800)"}}>
          Melhor pizzaria<br/><span style={{fontStyle:"italic",color:"var(--terracota)"}}>de Pinda!</span>
        </h1>
        <p style={{color:"var(--stone-500)",fontSize:"0.9rem",maxWidth:"22rem",margin:"0.75rem auto 0"}}>Todos os dias de 11:00 ás 14:30 e 17:00 ás 23:30</p>
        <a href="#trad" className="br" style={{display:"inline-block",marginTop:"1.5rem",padding:"0.75rem 1.5rem",borderRadius:"1rem",fontWeight:700,fontSize:"0.9rem"}}>Ver Cardápio ↓</a>
      </section>
      <main style={{maxWidth:"72rem",margin:"0 auto",padding:"2rem 1.25rem"}}>
        {menu.categories.map(cat=>(
          <section key={cat.id} id={cat.id} style={{marginBottom:"3rem",scrollMarginTop:"5rem"}}>
            <div style={{marginBottom:"1.25rem"}}>
              <h2 className="fd" style={{fontWeight:700,fontSize:"1.5rem",color:"var(--stone-800)"}}>{cat.label}</h2>
              <p style={{fontSize:"0.82rem",color:"var(--stone-500)",marginTop:"0.1rem"}}>{cat.desc}</p>
              <hr className="sdiv"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:"1rem"}}>
              {cat.items.map(pizza=>(
                <ProductCard key={pizza.id} pizza={pizza} allowsHalf={cat.half} onAdd={handleAdd} onHalf={handleHalf}/>
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer style={{background:"var(--stone-800)",color:"#a8a29e",textAlign:"center",padding:"2.5rem 1.25rem",fontSize:"0.85rem"}}>
        <p className="fd" style={{color:"white",fontWeight:900,fontSize:"1.2rem",marginBottom:"0.25rem"}}>Pizzaria <span style={{fontStyle:"italic",color:"#fbbf24"}}>Varanda</span></p>
        <p>Pindamonhangaba, SP</p>
        <p style={{marginTop:"0.2rem"}}>(12) 99137-5580</p>
        <p style={{marginTop:"1.5rem",fontSize:"0.7rem",color:"#57534e"}}>© 2026 Pizzaria Varanda</p>
      </footer>
      <CartDrawer/>
      <HalfModal isOpen={halfOpen} onClose={()=>setHalfOpen(false)} initPizza={halfInit}/>
      <SizeModal pizza={sizeModal.pizza} isOpen={sizeModal.open} onClose={()=>setSizeModal({open:false,pizza:null})} onConfirm={handleSizeConfirm}/>
      <CheckoutModal onOrderSaved={onOrderSaved}/>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   APP ROOT — carrega preços e pedidos do Firebase na inicialização
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [view,    setView]    = useState(()=>isAdmin()?"admin":"store")
  const [prices,  setPrices]  = useState({})          // preços customizados do Firebase
  const [orders,  setOrders]  = useState([])           // histórico do Firebase
  const [loading, setLoading] = useState(true)         // carregando dados iniciais

  const menu = useMemo(()=>applyPrices(MENU_BASE, prices), [prices])

  // Carrega preços e pedidos do Firebase ao iniciar
  useEffect(()=>{
    let cancelled = false
    ;(async()=>{
      setLoading(true)
      try {
        const [p, o] = await Promise.all([fbLoadPrices(), fbLoadOrders()])
        if(!cancelled){ setPrices(p); setOrders(o) }
      } catch(e){
        console.warn("Não foi possível conectar ao Firebase:", e)
      }
      if(!cancelled) setLoading(false)
    })()
    return ()=>{ cancelled=true }
  },[])

  if(loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--cream)"}}>
      <style>{globalStyles}</style>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{textAlign:"center"}}>
        <div style={{width:"3rem",height:"3rem",border:"4px solid var(--stone-200)",borderTopColor:"var(--terracota)",borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 1rem"}}/>
        <p className="fd" style={{fontWeight:700,color:"var(--terracota)",fontSize:"1.1rem"}}>Pizzaria Varanda</p>
        <p style={{fontSize:"0.8rem",color:"var(--stone-400)",marginTop:"0.3rem"}}>Carregando cardápio…</p>
      </div>
    </div>
  )

  if(view==="adminLogin") return <AdminLogin onLogin={()=>setView("admin")} onBack={()=>setView("store")}/>

  if(view==="admin") return (
    <AdminPanel
      onLogout={()=>setView("store")}
      orders={orders}
      prices={prices}
      onOrdersChanged={setOrders}
      onPricesChanged={p=>{ setPrices(p) }}
    />
  )

  return (
    <CartProvider menu={menu}>
      <StoreView
        menu={menu}
        onAdmin={()=>setView("adminLogin")}
        onOrderSaved={async()=>{
          // Recarrega pedidos após novo pedido
          try{ const o=await fbLoadOrders(); setOrders(o) }catch{}
        }}
      />
    </CartProvider>
  )
}
