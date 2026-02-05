import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../../../../entities/User.js';

// Interface para o Documento do Mongoose
interface IUserDocument extends User, Document {}

const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model<IUserDocument>('User', UserSchema);