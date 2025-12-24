const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a tenant/company name'],
    unique: true,
    trim: true
  },
  tenantId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true // Indexing for faster lookups 
  },
  subscriptionPlan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'], // Enforce valid plans
    default: 'basic'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tenant', TenantSchema);