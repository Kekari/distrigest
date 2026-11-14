-- DistriGest: tablas del prototipo. Ejecutar mediante npm run db:init.

CREATE TABLE IF NOT EXISTS configuracion (id INT PRIMARY KEY, revision INT UNSIGNED NOT NULL DEFAULT 0, tasa DOUBLE NOT NULL DEFAULT 3) ENGINE=InnoDB;

INSERT IGNORE INTO configuracion (id,revision,tasa) VALUES (1,0,3);

CREATE TABLE IF NOT EXISTS clientes (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` TEXT NOT NULL,
  `rut` VARCHAR(100) NOT NULL,
  `giro` TEXT NOT NULL,
  `address` TEXT NOT NULL,
  `contact` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `phone` TEXT,
  `zone` TEXT NOT NULL,
  `seller` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `posicion` INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS proveedores (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `name` TEXT NOT NULL,
  `rut` VARCHAR(100) NOT NULL,
  `contact` TEXT NOT NULL,
  `email` TEXT NOT NULL,
  `phone` TEXT,
  `terms` TEXT NOT NULL,
  `delivery` TEXT NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `posicion` INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventario (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `sku` TEXT NOT NULL,
  `product` TEXT NOT NULL,
  `category` TEXT NOT NULL,
  `lot` TEXT NOT NULL,
  `expiry` DATE NOT NULL,
  `location` TEXT NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `minimum` INT UNSIGNED NOT NULL,
  `posicion` INT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ordenes_compra (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `supplier` VARCHAR(100) NOT NULL,
  `product` TEXT NOT NULL,
  `sku` TEXT NOT NULL,
  `category` TEXT NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `received` INT UNSIGNED NOT NULL,
  `price` BIGINT UNSIGNED NOT NULL,
  `posicion` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`supplier`) REFERENCES proveedores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ventas (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `date` DATE NOT NULL,
  `client` VARCHAR(100) NOT NULL,
  `seller` TEXT NOT NULL,
  `product` TEXT NOT NULL,
  `quantity` INT UNSIGNED NOT NULL,
  `price` BIGINT UNSIGNED NOT NULL,
  `paid` DOUBLE NOT NULL,
  `posicion` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`client`) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS documentos (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `type` VARCHAR(100) NOT NULL,
  `client` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `lines` JSON NOT NULL,
  `status` TEXT NOT NULL,
  `reference` VARCHAR(100),
  `posicion` INT UNSIGNED NOT NULL,
  FOREIGN KEY (`client`) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recepciones (
  `order` VARCHAR(100) NOT NULL,
  `product` TEXT NOT NULL,
  `sku` TEXT NOT NULL,
  `category` TEXT NOT NULL,
  `lot` TEXT NOT NULL,
  `expiry` DATE NOT NULL,
  `location` TEXT NOT NULL,
  `received` INT UNSIGNED NOT NULL,
  `expected` INT UNSIGNED NOT NULL,
  `minimum` INT UNSIGNED NOT NULL,
  `note` TEXT,
  `difference` INT NOT NULL,
  `date` DATE NOT NULL,
  `posicion` INT UNSIGNED NOT NULL PRIMARY KEY,
  FOREIGN KEY (`order`) REFERENCES ordenes_compra(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
