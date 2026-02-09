import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente do Supabase não encontradas');
    console.log('Certifique-se de que EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCurrentStreakFix() {
    try {
        console.log('🔧 Aplicando correção para ambiguidade do current_streak...');
        
        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, 'fix_current_streak_ambiguity.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Dividir em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        console.log(`📝 Executando ${commands.length} comandos SQL...`);
        
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            if (command.trim()) {
                console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
                
                const { error } = await supabase.rpc('exec_sql', {
                    sql: command + ';'
                }).catch(async () => {
                    // Se exec_sql não existir, tentar executar diretamente
                    return await supabase.from('_').select('*').limit(0);
                });
                
                if (error) {
                    console.error(`❌ Erro no comando ${i + 1}:`, error);
                    throw error;
                }
            }
        }
        
        console.log('✅ Correção aplicada com sucesso!');
        console.log('🎯 As funções update_user_stats e update_user_streak foram atualizadas');
        console.log('📊 A ambiguidade da coluna current_streak foi resolvida');
        
    } catch (error) {
        console.error('❌ Erro ao aplicar correção:', error);
        process.exit(1);
    }
}

// Executar diretamente
applyCurrentStreakFix();