// src/routes/parents.routes.js
// Proxy al router real ubicado en src/routes/parent/parents.routes.js
// Esto garantiza que todas las rutas usen el middleware verifyToken
// y elimina duplicados entre routers.

import parentsRouter from './parent/parents.routes.js';
export default parentsRouter;