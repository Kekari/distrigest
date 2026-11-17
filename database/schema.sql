-- Esquema normalizado de DistriGest para MySQL 5.7+.
CREATE TABLE IF NOT EXISTS configuracion (
  id INT PRIMARY KEY,
  revision INT UNSIGNED NOT NULL DEFAULT 0,
  tasa DOUBLE NOT NULL DEFAULT 3
) ENGINE=InnoDB;
INSERT IGNORE INTO configuracion (id,revision,tasa) VALUES (1,0,3);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(100) PRIMARY KEY,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  rut VARCHAR(100) NOT NULL,
  giro TEXT NOT NULL,
  address TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  zone TEXT NOT NULL,
  seller TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  posicion INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS proveedores (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  rut VARCHAR(100) NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  terms TEXT NOT NULL,
  delivery TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  posicion INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS productos (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lotes (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL,
  lot_code VARCHAR(100) NOT NULL,
  expiry DATE NOT NULL,
  position VARCHAR(200) NOT NULL DEFAULT '',
  UNIQUE KEY uq_lote_producto_codigo (product_id,lot_code),
  CONSTRAINT fk_lote_producto FOREIGN KEY (product_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventario (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  lot_id VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  minimum INT UNSIGNED NOT NULL,
  posicion INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_inventario_lote_ubicacion (lot_id,location),
  CONSTRAINT fk_inventario_lote FOREIGN KEY (lot_id) REFERENCES lotes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ordenes_compra (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  supplier VARCHAR(100) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  received INT UNSIGNED NOT NULL,
  price BIGINT UNSIGNED NOT NULL,
  posicion INT UNSIGNED NOT NULL,
  CONSTRAINT fk_orden_proveedor FOREIGN KEY (supplier) REFERENCES proveedores(id),
  CONSTRAINT fk_orden_producto FOREIGN KEY (product_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ventas (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  date DATE NOT NULL,
  client VARCHAR(100) NOT NULL,
  seller TEXT NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  price BIGINT UNSIGNED NOT NULL,
  paid DOUBLE NOT NULL,
  posicion INT UNSIGNED NOT NULL,
  CONSTRAINT fk_venta_cliente FOREIGN KEY (client) REFERENCES clientes(id),
  CONSTRAINT fk_venta_producto FOREIGN KEY (product_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS documentos (
  id VARCHAR(100) NOT NULL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  client VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  lines JSON NOT NULL,
  status TEXT NOT NULL,
  reference VARCHAR(100),
  posicion INT UNSIGNED NOT NULL,
  CONSTRAINT fk_documento_cliente FOREIGN KEY (client) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Los valores textuales aquí son una copia histórica de lo recibido.
CREATE TABLE IF NOT EXISTS recepciones (
  `order` VARCHAR(100) NOT NULL,
  product TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  lot TEXT NOT NULL,
  expiry DATE NOT NULL,
  location TEXT NOT NULL,
  received INT UNSIGNED NOT NULL,
  expected INT UNSIGNED NOT NULL,
  minimum INT UNSIGNED NOT NULL,
  note TEXT,
  difference INT NOT NULL,
  date DATE NOT NULL,
  posicion INT UNSIGNED NOT NULL PRIMARY KEY,
  CONSTRAINT fk_recepcion_orden FOREIGN KEY (`order`) REFERENCES ordenes_compra(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
