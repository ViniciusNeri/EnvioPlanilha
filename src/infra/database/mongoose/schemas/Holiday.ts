import { Schema, model, Document } from 'mongoose';

export interface IHolidaySchema extends Document {
  date: string;        // Ex: "01-01"
  description: string; // Ex: "Confraternização Universal"
  year: number;
}

// 2. O Schema (o "molde" para o MongoDB)
const HolidaySchema = new Schema<IHolidaySchema>({
  date: { type: String, required: true, index: true }, // Index ajuda na velocidade de busca
  description: { type: String, required: true },
  year: { type: Number, required: true, index: true }
}, {
  timestamps: true // Cria automaticamente campos 'createdAt' e 'updatedAt'
});

// 3. O Model (a ferramenta que faz as consultas)
export const HolidayModel = model<IHolidaySchema>('Holiday', HolidaySchema);