# Diseño MySQL para DistriGest

Alcance aprobado: publicar el código en GitHub y ejecutarlo localmente. GitHub Pages mantiene la demostración sin servidor.

Arquitectura: interfaz existente -> API Express del mismo origen -> MySQL con soporte JSON (verificado con 5.7.44). El servidor escucha solo en 127.0.0.1. Credenciales únicamente en .env. No se habilita acceso público ni se incorpora autenticación de producción.

Tablas separadas para clientes, proveedores, inventario, órdenes, ventas, documentos, recepciones y configuración. El detalle de documentos se guarda como JSON. Se mantienen los nombres de campos del prototipo para facilitar su explicación. Una transacción sincroniza el conjunto de datos y una revisión evita sobrescribir cambios concurrentes. Este mecanismo es suficiente para el volumen académico, no para gran escala.

El servidor entrega configuración explícita del modo MySQL. En GitHub Pages, donde esa configuración no existe, se mantiene localStorage. Si falla una base configurada, se muestra el error y no se cambia silenciosamente a datos locales.

Verificación: pruebas de API y persistencia con doble de repositorio, pruebas de cliente HTTP, pruebas de repositorio y prueba de integración real opcional con MySQL. Documentar exactamente qué se pudo ejecutar.
