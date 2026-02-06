import type { IHolidayRepository } from '../interface/IHolidayRepository.js';
import { HolidayModel } from '../../infra/database/mongoose/schemas/Holiday.js';

export class HybridHolidayRepository implements IHolidayRepository {
  async listAll(): Promise<string[]> {
    // Pegamos o ano atual para garantir que o cache é válido para este ano
    const anoAtual = new Date().getFullYear();

    try {
      const feriadosBanco = await HolidayModel.find({ year: anoAtual }).lean();

      // Se o banco tiver dados, retornamos direto
      if (feriadosBanco.length > 0) {
        console.log('✅ Feriados recuperados do Cache (MongoDB)');
        return feriadosBanco.map((f: any) => f.date);
      }

      // 2. Se o banco estiver vazio, busca na API
      console.log('🌐 Banco vazio. Buscando feriados na API externa...');
      const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${anoAtual}`);
      
      if (!response.ok) throw new Error('API externa fora do ar ou ano inválido');

      const feriadosApi = await response.json();

      // 3. Formata e Salva no Banco (para o próximo uso ser rápido)
      const feriadosFormatados = feriadosApi.map((f: any) => {
        const [ano, mes, dia] = f.date.split('-');
        return { date: `${mes}-${dia}`, description: f.name , year: anoAtual};
      });

      // Salvando em lote para performance
      for (const feriado of feriadosFormatados) {
        await HolidayModel.updateOne(
          { date: feriado.date , year: anoAtual}, 
          { $set: feriado }, 
          { upsert: true }
        );
      }

      return feriadosFormatados.map((f: any) => f.date);
    
    } catch (error) {
      // 4. Fallback final: Se tudo der errado, tentamos uma última vez no banco (mesmo código que o try)
      console.error('⚠️ Erro crítico na busca de feriados. Tentando ler cache residual...');
      const fallbackBanco = await HolidayModel.find().lean();
      return fallbackBanco.map((f: any) => f.date);
    }
  }
}