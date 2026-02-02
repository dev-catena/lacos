#!/usr/bin/env python3
"""
Script Python para corrigir validação de acesso ao grupo para médicos
no arquivo PrescriptionController.php
"""

import re
import sys
import os

def corrigir_controller(caminho_arquivo):
    """Corrige o arquivo PrescriptionController.php"""
    
    if not os.path.exists(caminho_arquivo):
        print(f"❌ Arquivo não encontrado: {caminho_arquivo}")
        return False
    
    # Ler o arquivo
    with open(caminho_arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()
    
    conteudo_original = conteudo
    
    # Código novo que será inserido
    codigo_novo = """            // Verificar acesso ao grupo
            $user = Auth::user();
            $isDoctor = $user->profile === 'doctor';

            if ($isDoctor) {
                // Para médicos: verificar se tem consulta com o grupo/paciente
                $hasAppointment = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->where('group_id', $validated['group_id'])
                    ->exists();
                
                // Se não tem consulta geral, verificar se tem a consulta específica
                if (!$hasAppointment && ($validated['appointment_id'] ?? null)) {
                    $appointment = DB::table('appointments')
                        ->where('id', $validated['appointment_id'])
                        ->where('doctor_id', $user->id)
                        ->where('group_id', $validated['group_id'])
                        ->first();
                    
                    if (!$appointment) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Você não tem permissão para gerar documentos para esta consulta.',
                        ], 403);
                    }
                } elseif (!$hasAppointment) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem consultas agendadas com este paciente/grupo.',
                    ], 403);
                }
            } else {
                // Para não-médicos (cuidadores): verificar se pertence ao grupo
                $group = $user->groups()->find($validated['group_id']);
                if (!$group) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem acesso a este grupo',
                    ], 403);
                }
            }"""
    
    # Padrão para encontrar o código antigo
    # Buscar pelo comentário e o bloco completo até o fechamento
    padrao_antigo = r'// Verificar se o usuário pertence ao grupo\s+\$group = \$user->groups\(\)->find\(\$validated\[\'group_id\'\]\);\s+if \(!\$group\) \{\s+return response\(\)->json\(\[\s+\'success\' => false,\s+\'message\' => \'Você não tem acesso a este grupo\',\s+\], 403\);\s+\}'
    
    # Tentar substituir com regex
    conteudo_novo = re.sub(padrao_antigo, codigo_novo, conteudo, flags=re.DOTALL)
    
    # Se não encontrou, tentar método linha por linha
    if conteudo_novo == conteudo:
        print("⚠️  Regex não encontrou padrão, tentando método linha por linha...")
        linhas = conteudo.split('\n')
        resultado = []
        i = 0
        
        while i < len(linhas):
            linha = linhas[i]
            
            # Procurar pelo comentário que marca o início do bloco antigo
            if '// Verificar se o usuário pertence ao grupo' in linha:
                # Adicionar código novo
                resultado.extend(codigo_novo.split('\n'))
                
                # Pular as linhas antigas até encontrar o fechamento do if
                i += 1
                nivel_abertura = 0
                dentro_bloco = False
                
                while i < len(linhas):
                    linha_atual = linhas[i]
                    
                    # Contar chaves para saber quando o bloco fecha
                    if '{' in linha_atual:
                        nivel_abertura += linha_atual.count('{')
                        dentro_bloco = True
                    if '}' in linha_atual:
                        nivel_abertura -= linha_atual.count('}')
                        if dentro_bloco and nivel_abertura <= 0:
                            i += 1
                            break
                    
                    i += 1
                continue
            
            resultado.append(linha)
            i += 1
        
        conteudo_novo = '\n'.join(resultado)
    
    # Verificar se houve mudança
    if conteudo_novo == conteudo_original:
        print("⚠️  Nenhuma alteração foi feita. O código pode já estar corrigido ou ter estrutura diferente.")
        # Verificar se já tem o código novo
        if '$isDoctor = $user->profile' in conteudo_novo:
            print("✅ O arquivo parece já estar corrigido!")
            return True
        else:
            print("❌ Não foi possível encontrar o código antigo para substituir.")
            return False
    
    # Adicionar import do DB se não existir
    if 'use Illuminate\\Support\\Facades\\DB;' not in conteudo_novo:
        # Procurar onde adicionar (após outros imports do Facades)
        padrao_import = r'(use Illuminate\\Support\\Facades\\[^;]+;)'
        matches = list(re.finditer(padrao_import, conteudo_novo))
        if matches:
            # Adicionar após o último import do Facades
            ultimo_match = matches[-1]
            posicao = ultimo_match.end()
            conteudo_novo = conteudo_novo[:posicao] + '\nuse Illuminate\\Support\\Facades\\DB;' + conteudo_novo[posicao:]
            print("✅ Import do DB adicionado")
        else:
            # Adicionar após os imports
            padrao_namespace = r'(namespace App\\Http\\Controllers\\Api;)'
            match = re.search(padrao_namespace, conteudo_novo)
            if match:
                posicao = match.end()
                conteudo_novo = conteudo_novo[:posicao] + '\n\nuse Illuminate\\Support\\Facades\\DB;' + conteudo_novo[posicao:]
                print("✅ Import do DB adicionado")
    
    # Escrever arquivo corrigido
    with open(caminho_arquivo, 'w', encoding='utf-8') as f:
        f.write(conteudo_novo)
    
    print(f"✅ Arquivo corrigido: {caminho_arquivo}")
    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 corrigir_validacao_medico_grupo.py <caminho_do_arquivo>")
        sys.exit(1)
    
    caminho = sys.argv[1]
    sucesso = corrigir_controller(caminho)
    sys.exit(0 if sucesso else 1)


