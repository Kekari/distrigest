import { models } from './models.js';
import { validateState } from './validation.js';
import { createHash } from 'node:crypto';

const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,24);
const productId=sku=>`P-${hash(String(sku).trim().toUpperCase())}`;
const lotId=(product,code)=>`L-${hash(`${product}\0${String(code).trim().toUpperCase()}`)}`;
const splitPosition=value=>{
  const pieces=String(value||'').split(' · ');
  return pieces.length<2?{location:String(value||''),position:''}:{location:pieces.slice(0,-1).join(' · '),position:pieces.at(-1)};
};

function productCatalog(state){
  const bySku=new Map(),byName=new Map();
  const add=(sku,name,category,id=null)=>{
    sku=String(sku||'').trim();name=String(name||'').trim();category=String(category||'').trim();
    if(!sku||!name||!category)throw new Error(`Falta SKU, nombre o categoría para el producto "${name}".`);
    const key=sku.toUpperCase(),existing=bySku.get(key);
    if(existing&&(existing.name!==name||existing.category!==category))throw new Error(`El SKU ${sku} aparece asociado a productos distintos.`);
    const item=existing||{id:id||productId(sku),sku,name,category};
    bySku.set(key,item);
    const nameKey=name.toLocaleLowerCase('es-CL'),names=byName.get(nameKey)||new Set();names.add(key);byName.set(nameKey,names);
  };
  for(const product of state.products||[])add(product.sku,product.name,product.category,product.id);
  for(const item of state.stock)add(item.sku,item.product,item.category);
  for(const item of state.orders)add(item.sku,item.product,item.category);
  for(const name of new Set(state.sales.map(item=>item.product))){
    const matches=byName.get(String(name).toLocaleLowerCase('es-CL'));
    if(!matches||matches.size!==1)throw new Error(`No se puede vincular inequívocamente el producto de la venta: ${name}.`);
  }
  return {bySku,byName,products:[...bySku.values()]};
}

// Lee el estado guardado y reconstruye nombres completos para las pantallas actuales.
export function createRepository(pool){
  async function read(){
    const connection=await pool.getConnection();
    try{
      await connection.beginTransaction();
      const [[settings]]=await connection.execute('SELECT revision,tasa FROM configuracion WHERE id=1 FOR UPDATE');
      if(!settings||settings.revision===0)throw new Error('Ejecuta npm run db:init.');
      const state={};
      for(const model of models){
        const [rows]=await connection.execute(`SELECT ${model.fields.map(f=>'`'+f+'`').join(',')} FROM ${model.table} ORDER BY posicion`);
        state[model.key]=rows.map(row=>{
          if(model.key==='documents'&&typeof row.lines==='string')row.lines=JSON.parse(row.lines);
          if(model.key==='documents'&&row.reference===null)delete row.reference;
          if(model.key==='receipts'&&row.note===null)row.note='';
          return row;
        });
      }
      const [products]=await connection.execute('SELECT id,sku,name,category FROM productos ORDER BY name');
      state.products=products;
      const [stock]=await connection.execute(`SELECT i.id,i.lot_id,l.product_id,p.sku,p.name AS product,p.category,l.lot_code AS lot,l.expiry,CONCAT(i.location,IF(l.position='','',CONCAT(' · ',l.position))) AS location,i.quantity,i.minimum,i.posicion FROM inventario i JOIN lotes l ON l.id=i.lot_id JOIN productos p ON p.id=l.product_id ORDER BY i.posicion`);
      state.stock=stock;
      const [orders]=await connection.execute(`SELECT o.id,o.supplier,o.product_id,p.name AS product,p.sku,p.category,o.quantity,o.received,o.price,o.posicion FROM ordenes_compra o JOIN productos p ON p.id=o.product_id ORDER BY o.posicion`);
      state.orders=orders;
      const [sales]=await connection.execute(`SELECT v.id,v.date,v.client,v.seller,v.product_id,p.name AS product,v.quantity,v.price,v.paid,v.posicion FROM ventas v JOIN productos p ON p.id=v.product_id ORDER BY v.posicion`);
      state.sales=sales;
      state.rate=settings.tasa;
      await connection.commit();
      return {state,revision:settings.revision};
    }catch(error){await connection.rollback();throw error;}finally{connection.release();}
  }

  async function write(state,revision){
    validateState(state);
    const catalog=productCatalog(state);
    const connection=await pool.getConnection();
    try{
      await connection.beginTransaction();
      const [[current]]=await connection.execute('SELECT revision FROM configuracion WHERE id=1 FOR UPDATE');
      if(!current||current.revision!==revision)throw Object.assign(new Error('Otra pestaña modificó los datos. Recarga la página antes de continuar.'),{status:409});
      for(const table of ['recepciones','documentos','ventas','ordenes_compra','inventario','lotes','productos','proveedores','clientes'])await connection.execute(`DELETE FROM ${table}`);
      for(const model of models.filter(m=>['clients','suppliers'].includes(m.key)))await insertRows(connection,model,state[model.key]);
      for(const product of catalog.products)await connection.execute('INSERT INTO productos(id,sku,name,category) VALUES (?,?,?,?)',[product.id,product.sku,product.name,product.category]);
      const productBySku=catalog.bySku;
      const lotMap=new Map();
      for(const row of state.stock){
        const product=productBySku.get(String(row.sku).trim().toUpperCase());
        const code=String(row.lot).trim();
        const id=row.lot_id||lotId(product.id,code);
        const pieces=splitPosition(row.location);
        const expiry=String(row.expiry).slice(0,10);
        const previous=lotMap.get(id);
        if(previous&&(previous.expiry!==expiry||previous.product_id!==product.id||previous.position!==pieces.position))throw new Error(`El lote ${code} tiene producto, vencimiento o posición contradictorios.`);
        if(!previous)lotMap.set(id,{id,product_id:product.id,lot_code:code,expiry,position:pieces.position});
      }
      for(const lot of lotMap.values())await connection.execute('INSERT INTO lotes(id,product_id,lot_code,expiry,position) VALUES (?,?,?,?,?)',[lot.id,lot.product_id,lot.lot_code,lot.expiry,lot.position]);
      for(const [index,row] of state.stock.entries()){
        const product=productBySku.get(String(row.sku).trim().toUpperCase());
        const id=row.lot_id||lotId(product.id,row.lot);
        const {location}=splitPosition(row.location);
        await connection.execute('INSERT INTO inventario(id,lot_id,location,quantity,minimum,posicion) VALUES (?,?,?,?,?,?)',[row.id,id,location,row.quantity,row.minimum,row.posicion??index]);
      }
      for(const [index,row] of state.orders.entries()){
        const product=productBySku.get(String(row.sku).trim().toUpperCase());
        await connection.execute('INSERT INTO ordenes_compra(id,supplier,product_id,quantity,received,price,posicion) VALUES (?,?,?,?,?,?,?)',[row.id,row.supplier,product.id,row.quantity,row.received,row.price,index]);
      }
      for(const [index,row] of state.sales.entries()){
        const matches=catalog.byName.get(String(row.product).toLocaleLowerCase('es-CL'));
        if(!matches||matches.size!==1)throw new Error(`No se puede vincular el producto de la venta ${row.product}.`);
        const product=productBySku.get([...matches][0]);
        await connection.execute('INSERT INTO ventas(id,date,client,seller,product_id,quantity,price,paid,posicion) VALUES (?,?,?,?,?,?,?,?,?)',[row.id,row.date,row.client,row.seller,product.id,row.quantity,row.price,row.paid,index]);
      }
      for(const model of models.filter(m=>!['clients','suppliers'].includes(m.key)))await insertRows(connection,model,state[model.key]);
      await connection.execute('UPDATE configuracion SET revision=revision+1,tasa=? WHERE id=1',[state.rate]);
      await connection.commit();
      return revision+1;
    }catch(error){await connection.rollback();throw error;}finally{connection.release();}
  }
  return {read,write};
}

async function insertRows(connection,model,rows){
  for(const [index,row] of rows.entries()){
    const columns=[...model.fields,'posicion'];
    const sql=`INSERT INTO ${model.table} (${columns.map(f=>'`'+f+'`').join(',')}) VALUES (${columns.map(()=>'?').join(',')})`;
    const values=model.fields.map(f=>f==='lines'?JSON.stringify(row[f]):row[f]??null);
    await connection.execute(sql,[...values,index]);
  }
}
