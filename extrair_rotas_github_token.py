#!/usr/bin/env python3
"""
Script para extrair rotas da API de um repositório Laravel no GitHub
Versão usando Token de Acesso Pessoal (mais seguro)
"""

import requests
import base64
import re
import os
from typing import List, Dict

# Configurações
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '')  # Use variável de ambiente ou defina aqui
ORGANIZATION = "Zontec-Software"
REPOSITORY = "thalamus-backend-laravel"
ROUTES_FILE = "routes/api.php"

def get_file_content(org: str, repo: str, file_path: str, token: str) -> str:
    """
    Obtém o conteúdo de um arquivo do repositório GitHub usando token
    """
    url = f"https://api.github.com/repos/{org}/{repo}/contents/{file_path}"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}",
        "User-Agent": "Python-Script"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        
        # O conteúdo vem em base64
        if 'content' in data:
            content = base64.b64decode(data['content']).decode('utf-8')
            return content
        else:
            raise Exception("Arquivo não encontrado ou sem conteúdo")
            
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise Exception("Erro de autenticação. Verifique seu token.")
        elif e.response.status_code == 404:
            raise Exception(f"Arquivo não encontrado: {file_path}")
        else:
            raise Exception(f"Erro HTTP {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise Exception(f"Erro ao acessar GitHub: {str(e)}")

def extract_routes(content: str) -> List[Dict[str, str]]:
    """
    Extrai rotas do arquivo routes/api.php do Laravel
    """
    routes = []
    lines = content.split('\n')
    
    for line_num, line in enumerate(lines, 1):
        # Ignorar comentários
        if line.strip().startswith('//') or line.strip().startswith('#'):
            continue
        
        # Padrão 1: Route::method('path', [Controller::class, 'method'])
        match = re.search(r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*\[([^:]+)::class,\s*['\"]([^'\"]+)['\"]", line)
        if match:
            method = match.group(1).upper()
            path = match.group(2)
            controller = match.group(3).strip()
            action = match.group(4)
            routes.append({
                'method': method,
                'path': path,
                'controller': controller,
                'action': action,
                'line': line_num,
                'type': 'controller_method'
            })
            continue
        
        # Padrão 2: Route::method('path', 'Controller@method')
        match = re.search(r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*['\"]([^@]+)@([^'\"]+)['\"]", line)
        if match:
            method = match.group(1).upper()
            path = match.group(2)
            controller_action = match.group(3).strip()
            action = match.group(4)
            routes.append({
                'method': method,
                'path': path,
                'controller': controller_action,
                'action': action,
                'line': line_num,
                'type': 'controller_string'
            })
            continue
        
        # Padrão 3: Route::resource('path', Controller::class)
        match = re.search(r"Route::resource\s*\(\s*['\"]([^'\"]+)['\"],\s*([^:]+)::class", line)
        if match:
            path = match.group(1)
            controller = match.group(2).strip()
            resource_routes = [
                ('GET', f"{path}", 'index'),
                ('POST', f"{path}", 'store'),
                ('GET', f"{path}/{{id}}", 'show'),
                ('PUT', f"{path}/{{id}}", 'update'),
                ('PATCH', f"{path}/{{id}}", 'update'),
                ('DELETE', f"{path}/{{id}}", 'destroy'),
            ]
            for method, route_path, action in resource_routes:
                routes.append({
                    'method': method,
                    'path': route_path,
                    'controller': controller,
                    'action': action,
                    'line': line_num,
                    'type': 'resource'
                })
            continue
        
        # Padrão 4: Route::apiResource('path', Controller::class)
        match = re.search(r"Route::apiResource\s*\(\s*['\"]([^'\"]+)['\"],\s*([^:]+)::class", line)
        if match:
            path = match.group(1)
            controller = match.group(2).strip()
            api_routes = [
                ('GET', f"{path}", 'index'),
                ('POST', f"{path}", 'store'),
                ('GET', f"{path}/{{id}}", 'show'),
                ('PUT', f"{path}/{{id}}", 'update'),
                ('PATCH', f"{path}/{{id}}", 'update'),
                ('DELETE', f"{path}/{{id}}", 'destroy'),
            ]
            for method, route_path, action in api_routes:
                routes.append({
                    'method': method,
                    'path': route_path,
                    'controller': controller,
                    'action': action,
                    'line': line_num,
                    'type': 'api_resource'
                })
            continue
        
        # Padrão 5: Route::method('path', function() {})
        match = re.search(r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*function", line)
        if match:
            method = match.group(1).upper()
            path = match.group(2)
            routes.append({
                'method': method,
                'path': path,
                'controller': 'Closure',
                'action': 'anonymous',
                'line': line_num,
                'type': 'closure'
            })
            continue

    return routes

def print_routes(routes: List[Dict[str, str]]):
    """
    Imprime as rotas de forma organizada
    """
    if not routes:
        print("Nenhuma rota encontrada.")
        return
    
    print(f"\n{'='*80}")
    print(f"Total de rotas encontradas: {len(routes)}")
    print(f"{'='*80}\n")
    
    # Agrupar por método
    by_method = {}
    for route in routes:
        method = route['method']
        if method not in by_method:
            by_method[method] = []
        by_method[method].append(route)
    
    # Imprimir por método
    for method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'ANY']:
        if method in by_method:
            print(f"\n{method} Routes:")
            print("-" * 80)
            for route in by_method[method]:
                controller_info = f"{route['controller']}::{route['action']}" if route['controller'] != 'Closure' else 'Closure'
                print(f"  {method:8} {route['path']:40} -> {controller_info:30} (linha {route['line']})")
    
    # Resumo
    print(f"\n{'='*80}")
    print("Resumo por tipo:")
    by_type = {}
    for route in routes:
        rtype = route['type']
        by_type[rtype] = by_type.get(rtype, 0) + 1
    
    for rtype, count in by_type.items():
        print(f"  {rtype}: {count}")

def main():
    """
    Função principal
    """
    print("=" * 80)
    print("Extrator de Rotas Laravel do GitHub (versão com Token)")
    print("=" * 80)
    print(f"Organização: {ORGANIZATION}")
    print(f"Repositório: {REPOSITORY}")
    print(f"Arquivo: {ROUTES_FILE}")
    print("=" * 80)
    
    # Verificar token
    if not GITHUB_TOKEN:
        print("\n❌ Erro: Token do GitHub não encontrado!")
        print("Defina a variável de ambiente GITHUB_TOKEN ou edite o script.")
        print("\nPara criar um token:")
        print("1. Acesse: https://github.com/settings/tokens")
        print("2. Clique em 'Generate new token (classic)'")
        print("3. Selecione o escopo 'repo'")
        print("4. Use: export GITHUB_TOKEN='seu_token_aqui'")
        return 1
    
    try:
        # Obter arquivo
        print(f"\n[1/2] Obtendo arquivo {ROUTES_FILE}...")
        content = get_file_content(ORGANIZATION, REPOSITORY, ROUTES_FILE, GITHUB_TOKEN)
        print(f"✓ Arquivo obtido ({len(content)} caracteres)")
        
        # Extrair rotas
        print(f"[2/2] Extraindo rotas...")
        routes = extract_routes(content)
        print(f"✓ {len(routes)} rotas extraídas")
        
        # Imprimir rotas
        print_routes(routes)
        
        # Salvar em arquivo
        output_file = "rotas_extraidas.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"Rotas extraídas de {ORGANIZATION}/{REPOSITORY}\n")
            f.write(f"Arquivo: {ROUTES_FILE}\n")
            f.write("=" * 80 + "\n\n")
            
            for route in routes:
                controller_info = f"{route['controller']}::{route['action']}" if route['controller'] != 'Closure' else 'Closure'
                f.write(f"{route['method']:8} {route['path']:40} -> {controller_info:30} (linha {route['line']})\n")
        
        print(f"\n✓ Rotas salvas em: {output_file}")
        
    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())


