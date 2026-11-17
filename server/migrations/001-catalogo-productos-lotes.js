import { createHash } from 'node:crypto';

const VERSION = '001_catalogo_productos_lotes';
const hash = value => createHash('sha256').update(value).digest('hex').slice(0,24);
const productId = sku => `P-${hash(sku.trim().toUpperCase())}`;
const lotId = (product, code) => `L-${hash(`${product}\0${code.trim().toUpperCase()}`)}`;
const splitPosition = value => {
  const parts=String(value||'').split(' · ');
  if(parts.length<2)return {location:String(value||''),position:''};
  return {location:parts.slice(0,-1).join(' · '),position:parts.at(-1)};
};

async function columns(pool, table) {
  const [rows]=await pool.execute(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?',[table]
  );
  return new Set(rows.map(row=>row.COLUMN_NAME));
}
async function ensureNormalizedInventory(pool) {
  const cols=await columns(pool,'inventario');
  if(cols.has('lot_id'))return;
  if(cols.has('product')) {
    const old=await columns(pool,'inventario_legacy');
    if(old.size)throw new Error('Existe inventario_legacy y el inventario antiguo sigue activo. Revisa la migración antes de continuar.');
    await pool.query('RENAME TABLE inventario TO inventario_legacy');
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS inventario (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    lot_id VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    minimum INT UNSIGNED NOT NULL,
    posicion INT UNSIGNED NOT NULL,
    UNIQUE KEY uq_inventario_lote_ubicacion (lot_id,location),
    CONSTRAINT fk_inventario_lote FOREIGN KEY (lot_id) REFERENCES lotes(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

// Convierte los nombres y SKU del esquema anterior en productos y relaciones normalizadas.
export async function migrateCatalog(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  const [[done]]=await pool.execute('SELECT version FROM schema_migrations WHERE version=?',[VERSION]);
  if(done)return false;

  const inventoryColumns=await columns(pool,'inventario');
  const legacyColumns=await columns(pool,'inventario_legacy');
  const legacy=inventoryColumns.has('product')||legacyColumns.has('product');
  const stockTable=inventoryColumns.has('product')?'inventario':'inventario_legacy';

  // Las tablas vacías de una instalación nueva ya nacen con el esquema normalizado.
  if(!legacy && inventoryColumns.has('lot_id')){
    await pool.execute('INSERT IGNORE INTO schema_migrations(version) VALUES (?)',[VERSION]);
    return false;
  }
  if(!legacy)throw new Error('No se reconoce el esquema de inventario. No se modificó la base.');

  const [stock]=await pool.query(`SELECT id,sku,product,category,lot,expiry,location,quantity,minimum,posicion FROM \`${stockTable}\` ORDER BY posicion`);
  const orderColumns=await columns(pool,'ordenes_compra');
  const salesColumns=await columns(pool,'ventas');
  const [existingProducts]=await pool.query('SELECT id,sku,name,category FROM productos');
  const ordersSql=orderColumns.has('sku')
    ? 'SELECT id,product,sku,category FROM ordenes_compra'
    : 'SELECT o.id,p.name AS product,p.sku,p.category FROM ordenes_compra o JOIN productos p ON p.id=o.product_id';
  const salesSql=salesColumns.has('product')
    ? 'SELECT id,product FROM ventas'
    : 'SELECT v.id,p.name AS product FROM ventas v JOIN productos p ON p.id=v.product_id';
  const [orders]=await pool.query(ordersSql);
  const [sales]=await pool.query(salesSql);
  const catalog=new Map();
  const names=new Map();
  const add=(sku,name,category)=>{
    sku=String(sku||'').trim();name=String(name||'').trim();category=String(category||'').trim();
    if(!sku||!name||!category)throw new Error(`Producto incompleto en el esquema anterior: ${name||'(sin nombre)'}. Completa SKU, nombre y categoría y vuelve a ejecutar npm run db:init.`);
    const prev=catalog.get(sku.toUpperCase());
    if(prev&&(prev.name!==name||prev.category!==category))throw new Error(`El SKU ${sku} aparece con nombres o categorías distintos. Corrige los registros antes de migrar.`);
    catalog.set(sku.toUpperCase(),{sku,name,category,id:productId(sku)});
    const alias=names.get(name.toLocaleLowerCase('es-CL'))||new Set();alias.add(sku.toUpperCase());names.set(name.toLocaleLowerCase('es-CL'),alias);
  };
  for(const row of existingProducts)add(row.sku,row.name,row.category,row.id);
  for(const row of stock)add(row.sku,row.product,row.category);
  for(const row of orders)if(row.sku)add(row.sku,row.product,row.category);
  for(const row of sales){
    const matches=names.get(String(row.product).toLocaleLowerCase('es-CL'));
    if(!matches||matches.size!==1)throw new Error(`La venta ${row.id} no se puede vincular inequívocamente a un SKU (${row.product}). No se retiraron los datos antiguos.`);
  }

  // El esquema antiguo se conserva como archivo de seguridad de la migración.
  await ensureNormalizedInventory(pool);
  if(!orderColumns.has('product_id'))await pool.query('ALTER TABLE ordenes_compra ADD COLUMN product_id VARCHAR(100) NULL');
  const saleColumns=await columns(pool,'ventas');
  if(!saleColumns.has('product_id'))await pool.query('ALTER TABLE ventas ADD COLUMN product_id VARCHAR(100) NULL');

  const connection=await pool.getConnection();
  try{
    await connection.beginTransaction();
    for(const item of catalog.values()){
      await connection.execute('INSERT IGNORE INTO productos(id,sku,name,category) VALUES (?,?,?,?)',[item.id,item.sku,item.name,item.category]);
      const [[stored]]=await connection.execute('SELECT id,name,category FROM productos WHERE sku=?',[item.sku]);
      if(stored.name!==item.name||stored.category!==item.category)throw new Error(`El SKU ${item.sku} ya existe con otros datos en productos. La migración se canceló.`);
      item.id=stored.id;
    }
    const bySku=new Map([...catalog].map(([sku,item])=>[sku,item]));
    const byName=new Map();
    for(const item of catalog.values())byName.set(item.name.toLocaleLowerCase('es-CL'),item);
    const lots=new Map();
    for(const row of stock){
      const product=bySku.get(String(row.sku).trim().toUpperCase());
      const id=lotId(product.id,row.lot);
      const pieces=splitPosition(row.location);
      const expiry=String(row.expiry).slice(0,10);
      const existing=lots.get(id);
      if(existing&&(existing.expiry!==expiry||existing.product_id!==product.id||existing.position!==pieces.position))throw new Error(`El lote ${row.lot} tiene fecha, producto o posición contradictorios.`);
      lots.set(id,{id,product_id:product.id,lot_code:row.lot,expiry,position:pieces.position});
    }
    for(const lot of lots.values()){
      await connection.execute('INSERT IGNORE INTO lotes(id,product_id,lot_code,expiry,position) VALUES (?,?,?,?,?)',[lot.id,lot.product_id,lot.lot_code,lot.expiry,lot.position]);
      const [[stored]]=await connection.execute('SELECT product_id,expiry FROM lotes WHERE id=?',[lot.id]);
      if(stored.product_id!==lot.product_id||String(stored.expiry).slice(0,10)!==lot.expiry)throw new Error(`El lote ${lot.lot_code} contradice un lote existente.`);
    }
    for(const row of stock){
      const product=bySku.get(String(row.sku).trim().toUpperCase());
      const id=lotId(product.id,row.lot);
      const {location}=splitPosition(row.location);
      await connection.execute('INSERT IGNORE INTO inventario(id,lot_id,location,quantity,minimum,posicion) VALUES (?,?,?,?,?,?)',[row.id,id,location,row.quantity,row.minimum,row.posicion]);
      const [[stored]]=await connection.execute('SELECT lot_id,location FROM inventario WHERE id=?',[row.id]);
      if(stored.lot_id!==id||stored.location!==location)throw new Error(`La existencia ${row.id} ya existe con otra relación.`);
    }
    for(const row of orders){
      const item=bySku.get(String(row.sku||'').trim().toUpperCase());
      if(!item)throw new Error(`La orden ${row.id} no encuentra un SKU válido.`);
      await connection.execute('UPDATE ordenes_compra SET product_id=? WHERE id=?',[item.id,row.id]);
    }
    for(const row of sales){
      const item=byName.get(String(row.product).toLocaleLowerCase('es-CL'));
      if(!item)throw new Error(`La venta ${row.id} no tiene producto relacionado.`);
      await connection.execute('UPDATE ventas SET product_id=? WHERE id=?',[item.id,row.id]);
    }
    await connection.commit();
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}

  // Las claves foráneas se agregan tras completar todos los identificadores.
  await addForeignKey(pool,'ordenes_compra','fk_orden_producto','product_id','productos');
  await addForeignKey(pool,'ventas','fk_venta_producto','product_id','productos');
  await pool.query('ALTER TABLE ordenes_compra MODIFY product_id VARCHAR(100) NOT NULL');
  await pool.query('ALTER TABLE ventas MODIFY product_id VARCHAR(100) NOT NULL');
  await dropIfPresent(pool,'ordenes_compra','product');
  await dropIfPresent(pool,'ordenes_compra','sku');
  await dropIfPresent(pool,'ordenes_compra','category');
  await dropIfPresent(pool,'ventas','product');
  await pool.execute('INSERT IGNORE INTO schema_migrations(version) VALUES (?)',[VERSION]);
  return true;
}

async function addForeignKey(pool,table,name,column,reference){
  const [rows]=await pool.execute(`SELECT CONSTRAINT_NAME FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME=?`,[table,name]);
  if(!rows.length)await pool.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` FOREIGN KEY (\`${column}\`) REFERENCES \`${reference}\`(id)`);
}

async function dropIfPresent(pool,table,column){
  const cols=await columns(pool,table);
  if(cols.has(column))await pool.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
}
