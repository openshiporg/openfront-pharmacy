import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { integer, relationship } from '@keystone-6/core/fields'

import { permissions, rules } from '../access'
import { cartItemHooks } from '../hooks/cart-item'
import { requiredRelationshipDb } from './requiredRelationship'
import { trackingFields } from './trackingFields'

export const CartItem = list({
  access: {
    operation: {
      query: permissions.canManageOrders,
      create: denyAll,
      update: denyAll,
      delete: denyAll,
    },
    filter: { query: rules.canReadCartItems },
  },
  graphql: { omit: { create: true, update: true, delete: true } },
  ui: { hideCreate: true, hideDelete: true },
  hooks: cartItemHooks,
  fields: {
    quantity: integer({ validation: { isRequired: true, min: 1 }, defaultValue: 1 }),
    unitPriceAmount: integer({ validation: { isRequired: true, min: 0 } }),
    cart: relationship({ ref: 'Cart.items', db: requiredRelationshipDb }),
    product: relationship({ ref: 'Product.cartItems', db: requiredRelationshipDb }),
    ...trackingFields,
  },
})
