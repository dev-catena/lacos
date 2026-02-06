#!/usr/bin/env python3
"""
Script para extrair rotas da API de um repositório Laravel no GitHub
Versão melhorada - REQUER Personal Access Token
"""

import requests
import base64
import re
import os
import sys
import json
from typing import List, Dict, Tuple

# Configurações
ORGANIZATION = "Zontec-Software"
REPOSITORY = "thalamus-backend-laravel"

def get_github_token() -> str:
    """
    Obtém o token do GitHub de variável de ambiente ou pede ao usuário
    """
    token = os.getenv('GITHUB_TOKEN')
    
    if not token:
        print("\n" + "="*80)
        print("⚠️  Personal Access Token necessário!")
        print("="*80)
        print("\nO GitHub não aceita mais autenticação com senha.")
        print("Você precisa criar um Personal Access Token:")
        print("\n1. Acesse: https://github.com/settings/tokens")
        print("2. Clique em 'Generate new token (classic)'")
        print("3. Dê um nome (ex: 'Extrator Rotas')")
        print("4. Selecione o escopo: 'repo' (acesso completo a repositórios)")
        print("5. Clique em 'Generate token'")
        print("6. COPIE o token (você só verá uma vez!)")
        print("\n" + "-"*80)
        token = input("\nCole seu Personal Access Token aqui: ").strip()
        
        if not token:
            print("\n❌ Token não fornecido. Encerrando.")
            sys.exit(1)
    
    return token

def list_repo_contents(org: str, repo: str, path: str = "", token: str = "") -> list:
    """
    Lista o conteúdo de um diretório no repositório GitHub
    """
    url = f"https://api.github.com/repos/{org}/{repo}/contents/{path}"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {token}",
        "User-Agent": "Python-Script"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            raise Exception("Token inválido ou expirado. Verifique seu token.")
        elif e.response.status_code == 404:
            raise Exception(f"Repositório ou caminho não encontrado: {org}/{repo}/{path}")
        else:
            raise Exception(f"Erro HTTP {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise Exception(f"Erro ao acessar GitHub: {str(e)}")

def get_file_content(org: str, repo: str, file_path: str, token: str) -> str:
    """
    Obtém o conteúdo de um arquivo do repositório GitHub
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
            raise Exception("Token inválido ou expirado. Verifique seu token.")
        elif e.response.status_code == 404:
            raise Exception(f"Arquivo não encontrado: {file_path}")
        else:
            raise Exception(f"Erro HTTP {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise Exception(f"Erro ao acessar GitHub: {str(e)}")

def find_routes_file(org: str, repo: str, token: str) -> Tuple[str, str]:
    """
    Procura o arquivo de rotas em diferentes locais possíveis
    """
    possible_paths = [
        "routes/api.php",
        "routes/web.php",
        "app/routes/api.php",
        "app/Http/routes/api.php",
    ]
    
    print("\n" + "="*80)
    print("Explorando estrutura do repositório...")
    print("="*80)
    
    # Primeiro, listar o conteúdo da raiz
    try:
        root_contents = list_repo_contents(org, repo, "", token)
        print(f"\n📁 Conteúdo da raiz do repositório:")
        for item in root_contents[:15]:
            if isinstance(item, dict):
                item_type = "📁" if item.get('type') == 'dir' else "📄"
                print(f"  {item_type} {item.get('name', 'N/A')}")
        
        # Verificar se existe pasta routes
        has_routes_dir = any(item.get('name') == 'routes' and item.get('type') == 'dir' 
                            for item in root_contents if isinstance(item, dict))
        
        if has_routes_dir:
            print(f"\n✓ Pasta 'routes' encontrada. Listando conteúdo...")
            try:
                routes_contents = list_repo_contents(org, repo, "routes", token)
                for item in routes_contents:
                    if isinstance(item, dict):
                        print(f"  📄 {item.get('name', 'N/A')}")
            except Exception as e:
                print(f"  ⚠️  Erro ao listar routes: {e}")
    except Exception as e:
        print(f"⚠️  Erro ao listar conteúdo: {e}")
        print("Continuando com busca direta...")
    
    # Tentar cada caminho possível
    print(f"\n{'='*80}")
    print("Procurando arquivo de rotas...")
    print("="*80)
    
    for path in possible_paths:
        print(f"\n🔍 Tentando: {path}...", end=" ")
        try:
            content = get_file_content(org, repo, path, token)
            print(f"✓ ENCONTRADO!")
            return path, content
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg or "não encontrado" in error_msg.lower():
                print("✗ Não encontrado")
                continue
            else:
                print(f"✗ Erro: {error_msg}")
                continue
    
    raise Exception(f"\n❌ Nenhum arquivo de rotas encontrado nos caminhos:\n   " + "\n   ".join(possible_paths))

def extract_parameters(path: str) -> List[Dict[str, str]]:
    """
    Extrai parâmetros de uma rota (ex: {id}, {user_id})
    """
    parameters = []
    # Encontrar todos os parâmetros entre chaves
    param_pattern = r'\{(\w+)(?::([^}]+))?\}'
    matches = re.finditer(param_pattern, path)
    
    for match in matches:
        param_name = match.group(1)
        param_constraint = match.group(2) if match.group(2) else None
        parameters.append({
            'name': param_name,
            'constraint': param_constraint,
            'required': True,  # Por padrão, parâmetros de rota são obrigatórios
            'type': 'route_parameter'
        })
    
    return parameters

def extract_middleware(line: str) -> List[str]:
    """
    Extrai middlewares de uma linha de rota
    """
    middlewares = []
    
    # Padrão: ->middleware('auth', 'admin')
    middleware_match = re.search(r"->middleware\s*\(\s*['\"]([^'\"]+)['\"]", line)
    if middleware_match:
        # Pode ter múltiplos middlewares separados por vírgula
        middleware_str = middleware_match.group(1)
        middlewares = [m.strip() for m in middleware_str.split(',')]
    
    # Padrão: ->middleware(['auth', 'admin'])
    middleware_array_match = re.search(r"->middleware\s*\(\s*\[([^\]]+)\]", line)
    if middleware_array_match:
        middleware_str = middleware_array_match.group(1)
        # Extrair strings entre aspas
        middleware_list = re.findall(r"['\"]([^'\"]+)['\"]", middleware_str)
        middlewares.extend(middleware_list)
    
    return list(set(middlewares))  # Remove duplicatas

def extract_name(line: str) -> str:
    """
    Extrai o nome da rota (->name('route.name'))
    """
    name_match = re.search(r"->name\s*\(\s*['\"]([^'\"]+)['\"]", line)
    if name_match:
        return name_match.group(1)
    return None

def extract_validation_from_controller(controller_content: str, method_name: str) -> Dict:
    """
    Tenta extrair validações do controller (se o conteúdo estiver disponível)
    """
    # Procurar por Request classes ou validação inline
    validation = {
        'rules': [],
        'messages': []
    }
    
    # Padrão: $request->validate([...])
    validate_match = re.search(rf"{method_name}.*?validate\s*\(\s*\[([^\]]+)\]", controller_content, re.DOTALL)
    if validate_match:
        rules_str = validate_match.group(1)
        # Extrair regras básicas
        rules = re.findall(r"['\"]([^'\"]+)['\"]\s*=>\s*['\"]([^'\"]+)['\"]", rules_str)
        for rule_name, rule_value in rules:
            validation['rules'].append({
                'field': rule_name,
                'rule': rule_value
            })
    
    return validation

def extract_routes(content: str) -> List[Dict[str, str]]:
    """
    Extrai rotas do arquivo routes/api.php do Laravel com informações completas
    """
    routes = []
    lines = content.split('\n')
    
    # Variável para rastrear linhas multi-linha
    current_route_line = ""
    current_line_num = 0
    
    for line_num, line in enumerate(lines, 1):
        original_line = line
        stripped = line.strip()
        
        # Ignorar comentários completos
        if stripped.startswith('//') or stripped.startswith('#'):
            continue
        
        # Acumular linhas para rotas multi-linha
        if current_route_line:
            current_route_line += " " + stripped
            # Verificar se a rota está completa (tem ponto e vírgula ou fecha parênteses)
            if ';' in current_route_line or (current_route_line.count('(') == current_route_line.count(')') and current_route_line.count('(') > 0):
                line = current_route_line
                line_num = current_line_num
                current_route_line = ""
            else:
                continue
        
        # Padrão 1: Route::method('path', [Controller::class, 'method'])
        match = re.search(r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*\[([^:]+)::class,\s*['\"]([^'\"]+)['\"]", line)
        if match:
            method = match.group(1).upper()
            path = match.group(2)
            controller = match.group(3).strip()
            action = match.group(4)
            
            # Extrair informações adicionais
            parameters = extract_parameters(path)
            middlewares = extract_middleware(line)
            route_name = extract_name(line)
            
            routes.append({
                'method': method,
                'path': path,
                'controller': controller,
                'action': action,
                'parameters': parameters,
                'middlewares': middlewares,
                'name': route_name,
                'line': line_num,
                'type': 'controller_method',
                'full_line': line.strip()
            })
            continue
        
        # Padrão 2: Route::method('path', 'Controller@method')
        match = re.search(r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*['\"]([^@]+)@([^'\"]+)['\"]", line)
        if match:
            method = match.group(1).upper()
            path = match.group(2)
            controller_action = match.group(3).strip()
            action = match.group(4)
            
            parameters = extract_parameters(path)
            middlewares = extract_middleware(line)
            route_name = extract_name(line)
            
            routes.append({
                'method': method,
                'path': path,
                'controller': controller_action,
                'action': action,
                'parameters': parameters,
                'middlewares': middlewares,
                'name': route_name,
                'line': line_num,
                'type': 'controller_string',
                'full_line': line.strip()
            })
            continue
        
        # Padrão 3: Route::resource('path', Controller::class)
        match = re.search(r"Route::resource\s*\(\s*['\"]([^'\"]+)['\"],\s*([^:]+)::class", line)
        if match:
            path = match.group(1)
            controller = match.group(2).strip()
            middlewares = extract_middleware(line)
            route_name = extract_name(line)
            
            resource_routes = [
                ('GET', f"{path}", 'index', []),
                ('POST', f"{path}", 'store', []),
                ('GET', f"{path}/{{id}}", 'show', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
                ('PUT', f"{path}/{{id}}", 'update', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
                ('PATCH', f"{path}/{{id}}", 'update', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
                ('DELETE', f"{path}/{{id}}", 'destroy', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
            ]
            for method, route_path, action, params in resource_routes:
                route_name_full = f"{route_name}.{action}" if route_name else None
                routes.append({
                    'method': method,
                    'path': route_path,
                    'controller': controller,
                    'action': action,
                    'parameters': params,
                    'middlewares': middlewares,
                    'name': route_name_full,
                    'line': line_num,
                    'type': 'resource',
                    'full_line': line.strip()
                })
            continue
        
        # Padrão 4: Route::apiResource('path', Controller::class)
        match = re.search(r"Route::apiResource\s*\(\s*['\"]([^'\"]+)['\"],\s*([^:]+)::class", line)
        if match:
            path = match.group(1)
            controller = match.group(2).strip()
            middlewares = extract_middleware(line)
            route_name = extract_name(line)
            
            api_routes = [
                ('GET', f"{path}", 'index', []),
                ('POST', f"{path}", 'store', []),
                ('GET', f"{path}/{{id}}", 'show', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
                ('PUT', f"{path}/{{id}}", 'update', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
                ('PATCH', f"{path}/{{id}}", 'update', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
                ('DELETE', f"{path}/{{id}}", 'destroy', [{'name': 'id', 'required': True, 'type': 'route_parameter'}]),
            ]
            for method, route_path, action, params in api_routes:
                route_name_full = f"{route_name}.{action}" if route_name else None
                routes.append({
                    'method': method,
                    'path': route_path,
                    'controller': controller,
                    'action': action,
                    'parameters': params,
                    'middlewares': middlewares,
                    'name': route_name_full,
                    'line': line_num,
                    'type': 'api_resource',
                    'full_line': line.strip()
                })
            continue
        
        # Padrão 5: Route::method('path', function() {})
        match = re.search(r"Route::(get|post|put|patch|delete|options|any|match)\s*\(\s*['\"]([^'\"]+)['\"],\s*function", line)
        if match:
            method = match.group(1).upper()
            path = match.group(2)
            
            parameters = extract_parameters(path)
            middlewares = extract_middleware(line)
            route_name = extract_name(line)
            
            routes.append({
                'method': method,
                'path': path,
                'controller': 'Closure',
                'action': 'anonymous',
                'parameters': parameters,
                'middlewares': middlewares,
                'name': route_name,
                'line': line_num,
                'type': 'closure',
                'full_line': line.strip()
            })
            continue
        
        # Verificar se é início de rota multi-linha (não tem ponto e vírgula e parênteses não estão fechados)
        if re.search(r"Route::(get|post|put|patch|delete|options|any|match|resource|apiResource)\s*\(", stripped):
            if ';' not in stripped and stripped.count('(') > stripped.count(')'):
                current_route_line = stripped
                current_line_num = line_num
                continue

    return routes

def print_routes(routes: List[Dict[str, str]]):
    """
    Imprime as rotas de forma organizada com parâmetros e middlewares
    """
    if not routes:
        print("Nenhuma rota encontrada.")
        return
    
    print(f"\n{'='*80}")
    print(f"✅ Total de rotas encontradas: {len(routes)}")
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
            print(f"\n{'='*80}")
            print(f"{method} Routes ({len(by_method[method])}):")
            print("="*80)
            for route in by_method[method]:
                controller_info = f"{route['controller']}::{route['action']}" if route['controller'] != 'Closure' else 'Closure'
                
                print(f"\n  📍 Rota: {method} {route['path']}")
                print(f"     Controller: {controller_info}")
                
                # Parâmetros
                if route.get('parameters'):
                    params_list = []
                    for p in route['parameters']:
                        param_str = f"${p['name']}"
                        if p.get('constraint'):
                            param_str += f" ({p.get('constraint')})"
                        params_list.append(param_str)
                    params_str = ", ".join(params_list)
                    print(f"     Parâmetros: {params_str}")
                else:
                    print(f"     Parâmetros: Nenhum")
                
                # Middlewares
                if route.get('middlewares'):
                    print(f"     Middlewares: {', '.join(route['middlewares'])}")
                
                # Nome da rota
                if route.get('name'):
                    print(f"     Nome: {route['name']}")
                
                print(f"     Linha: {route['line']}")
    
    # Resumo
    print(f"\n{'='*80}")
    print("Resumo por tipo:")
    by_type = {}
    for route in routes:
        rtype = route['type']
        by_type[rtype] = by_type.get(rtype, 0) + 1
    
    for rtype, count in sorted(by_type.items()):
        print(f"  {rtype}: {count}")
    
    # Estatísticas de parâmetros
    total_params = sum(len(route.get('parameters', [])) for route in routes)
    routes_with_params = sum(1 for route in routes if route.get('parameters'))
    routes_with_middleware = sum(1 for route in routes if route.get('middlewares'))
    
    print(f"\nEstatísticas:")
    print(f"  Rotas com parâmetros: {routes_with_params}/{len(routes)}")
    print(f"  Total de parâmetros: {total_params}")
    print(f"  Rotas com middleware: {routes_with_middleware}/{len(routes)}")

def main():
    """
    Função principal
    """
    print("=" * 80)
    print("🚀 Extrator de Rotas Laravel do GitHub")
    print("=" * 80)
    print(f"Organização: {ORGANIZATION}")
    print(f"Repositório: {REPOSITORY}")
    print("=" * 80)
    
    try:
        # Obter token
        token = get_github_token()
        
        # Verificar acesso
        print(f"\n[1/4] Verificando acesso ao repositório...")
        try:
            test_contents = list_repo_contents(ORGANIZATION, REPOSITORY, "", token)
            if not test_contents:
                raise Exception("Repositório vazio ou sem acesso")
            print(f"✓ Acesso confirmado!")
        except Exception as e:
            print(f"❌ Erro: {str(e)}")
            return 1
        
        # Encontrar arquivo de rotas
        print(f"\n[2/4] Procurando arquivo de rotas...")
        file_path, content = find_routes_file(ORGANIZATION, REPOSITORY, token)
        print(f"✓ Arquivo encontrado: {file_path} ({len(content)} caracteres)")
        
        # Extrair rotas
        print(f"\n[3/4] Extraindo rotas...")
        routes = extract_routes(content)
        print(f"✓ {len(routes)} rotas extraídas")
        
        # Imprimir rotas
        print(f"\n[4/4] Gerando relatório...")
        print_routes(routes)
        
        # Salvar em arquivo texto
        output_file = "rotas_extraidas.txt"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write(f"Rotas extraídas de {ORGANIZATION}/{REPOSITORY}\n")
            f.write(f"Arquivo: {file_path}\n")
            f.write("=" * 80 + "\n\n")
            
            for route in routes:
                controller_info = f"{route['controller']}::{route['action']}" if route['controller'] != 'Closure' else 'Closure'
                f.write(f"\n{'='*80}\n")
                f.write(f"Método: {route['method']}\n")
                f.write(f"Rota: {route['path']}\n")
                f.write(f"Controller: {controller_info}\n")
                
                if route.get('parameters'):
                    params_list = ', '.join([f"${p['name']}" for p in route['parameters']])
                    f.write(f"Parâmetros: {params_list}\n")
                
                if route.get('middlewares'):
                    f.write(f"Middlewares: {', '.join(route['middlewares'])}\n")
                
                if route.get('name'):
                    f.write(f"Nome: {route['name']}\n")
                
                f.write(f"Linha: {route['line']}\n")
        
        # Salvar em JSON
        output_json = "rotas_extraidas.json"
        with open(output_json, 'w', encoding='utf-8') as f:
            json.dump({
                'repository': f"{ORGANIZATION}/{REPOSITORY}",
                'file': file_path,
                'total_routes': len(routes),
                'routes': routes
            }, f, indent=2, ensure_ascii=False)
        
        # Salvar em Markdown
        output_md = "rotas_extraidas.md"
        with open(output_md, 'w', encoding='utf-8') as f:
            f.write(f"# Rotas da API - {ORGANIZATION}/{REPOSITORY}\n\n")
            f.write(f"**Arquivo:** `{file_path}`\n\n")
            f.write(f"**Total de rotas:** {len(routes)}\n\n")
            f.write("---\n\n")
            
            # Agrupar por método
            by_method = {}
            for route in routes:
                method = route['method']
                if method not in by_method:
                    by_method[method] = []
                by_method[method].append(route)
            
            for method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'ANY']:
                if method in by_method:
                    f.write(f"## {method} Routes\n\n")
                    for route in by_method[method]:
                        controller_info = f"`{route['controller']}::{route['action']}`" if route['controller'] != 'Closure' else '`Closure`'
                        f.write(f"### {route['path']}\n\n")
                        f.write(f"- **Método:** `{route['method']}`\n")
                        f.write(f"- **Controller:** {controller_info}\n")
                        
                        if route.get('parameters'):
                            params_list = "\n".join([f"  - `${p['name']}`" + (f" (constraint: `{p.get('constraint', '')}`)" if p.get('constraint') else "") for p in route['parameters']])
                            f.write(f"- **Parâmetros:**\n{params_list}\n")
                        
                        if route.get('middlewares'):
                            f.write(f"- **Middlewares:** `{', '.join(route['middlewares'])}`\n")
                        
                        if route.get('name'):
                            f.write(f"- **Nome:** `{route['name']}`\n")
                        
                        f.write(f"- **Linha:** {route['line']}\n\n")
                        f.write("---\n\n")
        
        print(f"\n{'='*80}")
        print(f"✅ Arquivos gerados:")
        print(f"   📄 {output_file} (texto)")
        print(f"   📄 {output_json} (JSON)")
        print(f"   📄 {output_md} (Markdown)")
        print(f"{'='*80}\n")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Operação cancelada pelo usuário.")
        return 1
    except Exception as e:
        print(f"\n❌ Erro: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())

