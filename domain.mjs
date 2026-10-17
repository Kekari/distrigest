export function receiveStock(stock, entry) {
  if (!Number.isInteger(entry.received) || entry.received < 1 || !Number.isInteger(entry.expected) || entry.expected < entry.received) throw new Error('Cantidad inválida: debe ser un entero positivo y no superar el saldo pendiente.');
  if (!entry.product || !entry.lot || !entry.location || !entry.expiry) throw new Error('Completa producto, lote, ubicación y vencimiento.');
  if (stock.some(x=>x.product===entry.product && x.lot===entry.lot && x.expiry!==entry.expiry)) throw new Error('El lote ya existe con otra fecha de vencimiento. Revisa la información antes de recibir.');
  const result = structuredClone(stock);
  const found = result.find(x => x.product === entry.product && x.lot === entry.lot && x.location === entry.location && x.expiry === entry.expiry);
  if (found) found.quantity += entry.received;
  else result.push({id:crypto.randomUUID(),product:entry.product,lot:entry.lot,location:entry.location,expiry:entry.expiry,quantity:entry.received,minimum:entry.minimum || 30,category:entry.category || 'Abarrotes',sku:entry.sku || 'NUEVO'});
  return {stock:result,difference:entry.received-entry.expected};
}
export function commission(net, paidRatio, rate) { return Math.round(net * Math.min(1,Math.max(0,paidRatio)) * rate/100); }
export function totals(lines) { const net=Math.round(lines.reduce((s,x)=>s+x.quantity*x.price,0)); const tax=Math.round(net*.19); return {net,tax,total:net+tax}; }
export function stockStatus(item,today) {
  const days=Math.round((Date.parse(item.expiry+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);
  return {low:item.quantity<item.minimum,days,expiry:days<0?'Vencido':days<=30?'Próximo a vencer':'Vigente'};
}
