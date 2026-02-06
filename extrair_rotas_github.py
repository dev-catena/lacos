#!/usr/bin/env python3
"""
Script para extrair rotas da API de um repositório Laravel no GitHub
"""

import requests
import base64
import re
from typing import List, Dict

# Configurações
GITHUB_USERNAME = "devRoboflex"
GITHUB_PASSWORD = "Th!l!m5&"
ORGANIZATION = "Zontec-Software"
REPOSITORY = "thalamus-backend-laravel"
ROUTES_FILE = "routes/api.php"

def get_github_token(username: str, password: str) -> str:
    """
    Obtém um token de acesso pessoal do GitHub usando autenticação básica.
    Nota: Para produção, use tokens de acesso pessoal em vez de senha.
    """
    # Para autenticação com senha, precisamos usar Basic Auth
    # Mas GitHub não permite mais autenticação com senha para API
    # Vamos usar autenticação básica diretamente
    auth_string = f"{username}:{password}"
    auth_bytes = auth_string.encode('ascii')
    auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
    return auth_b64

def list_repo_contents(org: str, repo: str, path: str = "", auth: str = "") -> list:
    """
    Lista o conteúdo de um diretório no repositório GitHub
    """
    url = f"https://api.github.com/repos/{org}/{repo}/contents/{path}"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"Basic {auth}",
        "User-Agent": "Python-Script"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return []

def find_routes_file(org: str, repo: str, auth: str) -> str:
    """
    Procura o arquivo de rotas em diferentes locais possíveis
    """
    possible_paths = [
        "routes/api.php",
        "app/routes/api.php",
        "routes/web.php",
        "app/Http/routes/api.php",
    ]
    
    print("Procurando arquivo de rotas...")
    
    # Primeiro, listar o conteúdo da raiz
    root_contents = list_repo_contents(org, repo, "", auth)
    print(f"Conteúdo da raiz do repositório:")
    for item in root_contents[:10]:
        if isinstance(item, dict):
            item_type = "📁 diretório" if item.get('type') == 'dir' else "📄 arquivo"
            print(f"  {item_type}: {item.get('name', 'N/A')}")
    
    # Verificar se existe pasta routes
    has_routes_dir = any(item.get('name') == 'routes' and item.get('type') == 'dir' 
                        for item in root_contents if isinstance(item, dict))
    
    if has_routes_dir:
        print("\n✓ Pasta 'routes' encontrada. Listando conteúdo...")
        routes_contents = list_repo_contents(org, repo, "routes", auth)
        for item in routes_contents:
            if isinstance(item, dict):
                print(f"  📄 {item.get('name', 'N/A')}")
    
    # Tentar cada caminho possível
    for path in possible_paths:
        print(f"\nTentando: {path}...")
        try:
            content = get_file_content(org, repo, path, auth)
            print(f"✓ Arquivo encontrado: {path}")
            return path, content
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg or "não encontrado" in error_msg.lower():
                print(f"  ✗ Não encontrado")
                continue
            elif "401" in error_msg or "autenticação" in error_msg.lower():
                print(f"  ✗ Erro de autenticação")
                raise Exception(f"Erro de autenticação ao acessar {path}: {error_msg}")
            else:
                print(f"  ✗ Erro: {error_msg}")
                continue
    
    raise Exception(f"Nenhum arquivo de rotas encontrado. Caminhos testados: {', '.join(possible_paths)}")

def get_file_content(org: str, repo: str, file_path: str, auth: str) -> str:
    """
    Obtém o conteúdo de um arquivo do repositório GitHub
    """
    url = f"https://api.github.com/repos/{org}/{repo}/contents/{file_path}"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"Basic {auth}",
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
            raise Exception("Erro de autenticação. Verifique suas credenciais.")
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
    
    # Padrões comuns de rotas Laravel
    patterns = [
        # Route::get('path', [Controller::class, 'method'])
        r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*\[([^:]+)::class,\s*['\"]([^'\"]+)['\"]",
        # Route::get('path', 'Controller@method')
        r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*['\"]([^@]+)@([^'\"]+)['\"]",
        # Route::get('path', function() {})
        r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*function",
        # Route::resource('path', Controller::class)
        r"Route::resource\s*\(\s*['\"]([^'\"]+)['\"],\s*([^:]+)::class",
        # Route::apiResource('path', Controller::class)
        r"Route::apiResource\s*\(\s*['\"]([^'\"]+)['\"],\s*([^:]+)::class",
    ]
    
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
            # Resource routes geram múltiplas rotas
            resource_methods = ['GET', 'POST', 'GET', 'PUT', 'PATCH', 'DELETE']
            resource_paths = [
                f"{path}",
                f"{path}",
                f"{path}/{{id}}",
                f"{path}/{{id}}",
                f"{path}/{{id}}",
                f"{path}/{{id}}"
            ]
            resource_actions = ['index', 'store', 'show', 'update', 'update', 'destroy']
            for i, (m, p, a) in enumerate(zip(resource_methods, resource_paths, resource_actions)):
                routes.append({
                    'method': m,
                    'path': p,
                    'controller': controller,
                    'action': a,
                    'line': line_num,
                    'type': 'resource'
                })
            continue
        
        # Padrão 4: Route::apiResource('path', Controller::class)
        match = re.search(r"Route::apiResource\s*\(\s*['\"]([^'\"]+)['\"],\s*([^:]+)::class", line)
        if match:
            path = match.group(1)
            controller = match.group(2).strip()
            # API Resource routes (sem create/edit)
            api_methods = ['GET', 'POST', 'GET', 'PUT', 'PATCH', 'DELETE']
            api_paths = [
                f"{path}",
                f"{path}",
                f"{path}/{{id}}",
                f"{path}/{{id}}",
                f"{path}/{{id}}",
                f"{path}/{{id}}"
            ]
            api_actions = ['index', 'store', 'show', 'update', 'update', 'destroy']
            for i, (m, p, a) in enumerate(zip(api_methods, api_paths, api_actions)):
                routes.append({
                    'method': m,
                    'path': p,
                    'controller': controller,
                    'action': a,
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
    print("Extrator de Rotas Laravel do GitHub")
    print("=" * 80)
    print(f"Organização: {ORGANIZATION}")
    print(f"Repositório: {REPOSITORY}")
    print(f"Arquivo: {ROUTES_FILE}")
    print("=" * 80)
    
    try:
        # Autenticação
        print("\n[1/3] Autenticando no GitHub...")
        auth = get_github_token(GITHUB_USERNAME, GITHUB_PASSWORD)
        
        # Verificar acesso ao repositório
        print("Verificando acesso ao repositório...")
        try:
            test_contents = list_repo_contents(ORGANIZATION, REPOSITORY, "", auth)
            if not test_contents:
                raise Exception("Não foi possível acessar o repositório. Verifique suas credenciais e permissões.")
            print(f"✓ Acesso ao repositório confirmado")
        except Exception as e:
            error_msg = str(e)
            if "401" in error_msg or "autenticação" in error_msg.lower():
                print("\n⚠️  ATENÇÃO: GitHub pode não aceitar autenticação com senha.")
                print("   Recomendação: Use um Personal Access Token (PAT)")
                print("   1. Acesse: https://github.com/settings/tokens")
                print("   2. Gere um novo token com escopo 'repo'")
                print("   3. Use o script: extrair_rotas_github_token.py")
            raise
        
        # Obter arquivo (com busca automática)
        print(f"\n[2/3] Obtendo arquivo de rotas...")
        file_path, content = find_routes_file(ORGANIZATION, REPOSITORY, auth)
        print(f"✓ Arquivo obtido: {file_path} ({len(content)} caracteres)")
        
        # Extrair rotas
        print(f"[3/3] Extraindo rotas...")
        routes = extract_routes(content)
        print(f"✓ {len(routes)} rotas extraídas")
        
        # Imprimir rotas
        print_routes(routes)
        
        # Salvar em arquivo
        output_file = "rotas_extraidas.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"Rotas extraídas de {ORGANIZATION}/{REPOSITORY}\n")
            f.write(f"Arquivo: {file_path}\n")
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

