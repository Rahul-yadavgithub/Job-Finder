require('dotenv').config();
const app = require('./src/index.ts').default;

const printRoutes = (layer, path = '') => {
  if (layer.route) {
    layer.route.stack.forEach(printRoutes.bind(null, path.concat(layer.route.path)));
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(printRoutes.bind(null, path.concat(layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace('^', ''))));
  } else if (layer.method) {
    console.log(`${layer.method.toUpperCase()} ${path}`);
  }
};

app._router.stack.forEach((layer) => {
  if (layer.name === 'router') {
    const basePath = layer.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace('^', '');
    layer.handle.stack.forEach((sublayer) => {
      if (sublayer.route) {
        console.log(`ROUTE: ${basePath}${sublayer.route.path}`);
      }
    });
  }
});
process.exit(0);
