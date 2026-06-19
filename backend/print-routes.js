const routes = require('./src/routes/adminRequests.routes').default;
console.log(routes.stack.map(layer => layer.route ? layer.route.path : 'middleware').join(', '));
