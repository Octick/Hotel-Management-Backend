import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json' assert { type: 'json' };

export function buildSwaggerSpec() {
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Hotel Management API',
        version,
      },
      servers: [{ url: 'http://localhost:3000' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      paths: {
        '/health': { get: { summary: 'Health', responses: { '200': { description: 'ok' } } } },
        '/rooms': {
          get: { tags: ['Rooms'], summary: 'List rooms' },
          post: { tags: ['Rooms'], summary: 'Create room' }
        },
        '/rooms/{id}': {
          get: { tags: ['Rooms'], summary: 'Get room', parameters: [{ name: 'id', in: 'path', required: true }] }
        },
        '/rooms/{id}/status': {
          patch: { tags: ['Rooms'], summary: 'Update room status', parameters: [{ name: 'id', in: 'path', required: true }] }
        },
        '/bookings': {
          get: { tags: ['Bookings'], summary: 'List bookings (scoped)' },
          post: { tags: ['Bookings'], summary: 'Create booking' }
        },
        '/bookings/{id}/checkin': {
          post: { tags: ['Bookings'], summary: 'Check-in', parameters: [{ name: 'id', in: 'path', required: true }] }
        },
        '/bookings/{id}/checkout': {
          post: { tags: ['Bookings'], summary: 'Check-out', parameters: [{ name: 'id', in: 'path', required: true }] }
        },
        '/menu': {
          get: { tags: ['Dining'], summary: 'List menu items' },
          post: { tags: ['Dining'], summary: 'Create menu item' }
        },
        '/orders': {
          post: { tags: ['Dining'], summary: 'Place order' }
        },
        '/orders/{id}/status': {
          patch: { tags: ['Dining'], summary: 'Update order status', parameters: [{ name: 'id', in: 'path', required: true }] }
        },
        '/trips': {
          get: { tags: ['Trips'], summary: 'List public trips' },
          post: { tags: ['Trips'], summary: 'Create trip package' }
        },
        '/trips/{id}/attach': {
          post: { tags: ['Trips'], summary: 'Attach trip to booking', parameters: [{ name: 'id', in: 'path', required: true }] }
        },
        '/trips/requests': {
          post: { tags: ['Trips'], summary: 'Create trip request' }
        },
        '/invoices/{bookingId}': {
          get: { tags: ['Invoices'], summary: 'Get or preview invoice', parameters: [{ name: 'bookingId', in: 'path', required: true }] }
        },
        '/invoices/{bookingId}/generate': {
          post: { tags: ['Invoices'], summary: 'Generate invoice', parameters: [{ name: 'bookingId', in: 'path', required: true }] }
        },
        '/inventory': {
          get: { tags: ['Inventory'], summary: 'List inventory items' },
          post: { tags: ['Inventory'], summary: 'Create inventory item' }
        },
        '/inventory/{id}/adjust': {
          patch: { tags: ['Inventory'], summary: 'Adjust inventory quantity', parameters: [{ name: 'id', in: 'path', required: true }] }
        },
        '/inventory/alerts': {
          get: { tags: ['Inventory'], summary: 'Low stock alerts' }
        },
        '/me': { get: { tags: ['Users'], summary: 'Get current profile' }, put: { tags: ['Users'], summary: 'Update current profile' } }
      }
    },
    apis: [],
  });
}





