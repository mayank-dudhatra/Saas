import mongoose from 'mongoose';

const SuperAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export default mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);