#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import re
from datetime import datetime

def fix_getclientdetails(file_path):
    """Adiciona seção de reviews no método getClientDetails"""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Código de reviews a ser inserido
    reviews_code = r"""            // Buscar reviews (se a tabela existir)
            $reviews = collect([]);
            $rating = 0;
            
            try {
                if (DB::getSchemaBuilder()->hasTable('reviews')) {
                    $reviews = DB::table('reviews')
                        ->where('reviewed_user_id', $id)
                        ->select('id', 'rating', 'comment', 'created_at')
                        ->orderBy('created_at', 'desc')
                        ->get();

                    $ratingResult = DB::table('reviews')
                        ->where('reviewed_user_id', $id)
                        ->avg('rating');
                    
                    $rating = $ratingResult ? round($ratingResult, 1) : 0;
                }
            } catch (\Exception $e) {
                // Se a tabela reviews não existir ou houver erro, usar valores padrão
                \Log::warning('Erro ao buscar reviews em getClientDetails: ' . $e->getMessage());
                $reviews = collect([]);
                $rating = 0;
            }
"""
    
    # Verificar se já tem a seção de reviews
    if '// Buscar reviews (se a tabela existir)' in content:
        print("✅ Seção de reviews já existe")
        return True
    
    # Encontrar onde inserir (antes de "$clientData = [")
    # Procurar por "if (!$client)" seguido de "$clientData = ["
    lines = content.split('\n')
    insert_line = None
    
    for i, line in enumerate(lines):
        if '$clientData = [' in line and i > 0:
            # Verificar se a linha anterior tem "if (!$client)"
            if 'if (!$client)' in lines[i-5:i]:
                insert_line = i
                break
    
    if insert_line is None:
        print("❌ Não foi possível encontrar o local para inserir o código")
        return False
    
    # Inserir código
    reviews_lines = reviews_code.rstrip().split('\n')
    lines[insert_line:insert_line] = reviews_lines
    
    new_content = '\n'.join(lines)
    
    if new_content != content:
        # Fazer backup
        backup_path = f"{file_path}.bak.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Backup criado: {backup_path}")
        
        # Salvar novo conteúdo
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("✅ Código de reviews adicionado")
        return True
    else:
        print("❌ Não foi possível encontrar o local para inserir o código")
        return False

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Uso: python3 corrigir_getclientdetails.py <arquivo>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if fix_getclientdetails(file_path):
        sys.exit(0)
    else:
        sys.exit(1)

