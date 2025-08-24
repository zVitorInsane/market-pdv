const $$ = (sel, root=document)=>root.querySelector(sel);
const $$$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));
const money = n => (n||0).toLocaleString('pt-BR',{ style:'currency', currency:'BRL' });
const uid = () => Math.random().toString(36).slice(2);
