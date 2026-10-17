import {stockStatus} from './domain.mjs';

export function inventoryItems(stock,{tab='all',query='',warehouse=''}={},today){
  const q=query.toLocaleLowerCase('es');
  const items=stock.filter(item=>{
    const status=stockStatus(item,today);
    return (!q||['product','sku','lot'].some(key=>String(item[key]).toLocaleLowerCase('es').includes(q)))
      &&(!warehouse||item.location.startsWith(warehouse))
      &&(tab!=='low'||status.low)
      &&(tab!=='expiry'||status.expiry==='Próximo a vencer'||status.expiry==='Vencido');
  });
  if(tab==='expiry')items.sort((a,b)=>{
    const aExpired=stockStatus(a,today).expiry==='Vencido';
    const bExpired=stockStatus(b,today).expiry==='Vencido';
    return Number(aExpired)-Number(bExpired)||a.expiry.localeCompare(b.expiry);
  });
  return items;
}

export function inventoryState(item,tab,today){
  const status=stockStatus(item,today);
  if(status.expiry==='Vencido')return {label:'Vencido',color:'red'};
  if(tab==='expiry'&&status.expiry==='Próximo a vencer')return {label:'Por vencer',color:'amber'};
  if(status.low)return {label:'Stock bajo',color:'amber'};
  if(status.expiry==='Próximo a vencer')return {label:'Por vencer',color:'amber'};
  return {label:'Disponible',color:'green'};
}
