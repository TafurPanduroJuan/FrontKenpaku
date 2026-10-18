import { CajeroOrders } from '../cajero/CajeroOrders';

/**
 * El módulo de Pedidos ha sido transferido operativamente al Cajero (/caja/pedidos).
 * Se mantiene esta exportación para retrocompatibilidad de pruebas y utilidades internas.
 */
export { CajeroOrders as Orders };
export default CajeroOrders;
