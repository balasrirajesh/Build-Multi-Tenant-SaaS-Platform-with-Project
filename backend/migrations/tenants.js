const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subdomain: { type: String, unique: true, required: true },
  status: { 
    type: String, 
    enum: ['active', 'suspended', 'trial'], 
    default: 'trial' 
  },
  subscription_plan: { 
    type: String, 
    enum: ['free', 'pro', 'enterprise'], 
    default: 'free' 
  },
  max_users: { type: Number, default: 10 },
  max_projects: { type: Number, default: 5 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('tenants', TenantSchema);