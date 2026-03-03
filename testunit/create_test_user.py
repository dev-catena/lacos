#!/usr/bin/env python3
"""
Script para criar conta de teste para os testes do wizard de fornecedor
"""

import requests
import json
import sys
import getpass
from datetime import datetime

# Configurações
API_BASE_URL = "https://gateway.lacosapp.com/api"  # ou "http://192.168.0.20/api" para local

def create_test_user(api_url=None):
    """Cria um usuário de teste"""
    if api_url is None:
        api_url = API_BASE_URL
    
    # Gerar email único baseado em timestamp
    timestamp = int(datetime.now().timestamp())
    test_email = f"teste_supplier_{timestamp}@lacos.com"
    test_password = "Teste123456"
    test_name = f"Usuário Teste {timestamp}"
    
    print("=" * 80)
    print("🔧 CRIANDO CONTA DE TESTE PARA TESTES DO WIZARD DE FORNECEDOR")
    print("=" * 80)
    print(f"\n📧 Email: {test_email}")
    print(f"🔐 Senha: {test_password}")
    print(f"👤 Nome: {test_name}")
    print()
    
    # Dados do usuário
    user_data = {
        "name": test_name,
        "email": test_email,
        "password": test_password,
        "password_confirmation": test_password,
        "phone": "+5531999999999",
        "profile": "caregiver"  # Perfil válido: caregiver, accompanied, professional_caregiver, doctor
    }
    
    try:
        print("📤 Criando conta...")
        response = requests.post(
            f"{api_url}/register",
            json=user_data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            timeout=10
        )
        
        try:
            response_data = response.json()
        except:
            response_data = {"raw": response.text}
        
        if response.status_code in [200, 201]:
            print("✅ Conta criada com sucesso!")
            print()
            print("=" * 80)
            print("📋 CREDENCIAIS DE TESTE")
            print("=" * 80)
            print(f"Email:    {test_email}")
            print(f"Senha:    {test_password}")
            print()
            print("💡 Use essas credenciais para executar os testes:")
            # Usar a variável do escopo correto
            current_api_url = api_url if 'api_url' in locals() else API_BASE_URL
            print(f"   python3 test_supplier_wizard.py {current_api_url} {test_email} {test_password}")
            print()
            
            # Salvar credenciais em arquivo
            credentials_file = f"test_credentials_{timestamp}.txt"
            with open(credentials_file, "w") as f:
                f.write(f"Email: {test_email}\n")
                f.write(f"Senha: {test_password}\n")
                f.write(f"Criado em: {datetime.now().isoformat()}\n")
            
            print(f"💾 Credenciais salvas em: {credentials_file}")
            print()
            
            return test_email, test_password
        else:
            print(f"❌ Erro ao criar conta: {response.status_code}")
            print(f"Resposta: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
            
            if response.status_code == 422:
                errors = response_data.get("errors", {})
                if errors:
                    print("\nErros de validação:")
                    for field, messages in errors.items():
                        print(f"  - {field}: {messages}")
            
            return None, None
            
    except Exception as e:
        print(f"❌ Erro ao criar conta: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None


def create_test_user_with_root(root_email, root_password, api_url=None):
    """Cria um usuário de teste usando credenciais root (se necessário)"""
    if api_url is None:
        api_url = API_BASE_URL
    
    # Primeiro tentar criar normalmente
    email, password = create_test_user(api_url)
    
    if email and password:
        return email, password
    
    # Se falhar, tentar criar via root (se tiver endpoint)
    print("\n⚠️  Tentando criar via conta root...")
    
    try:
        # Login como root
        login_response = requests.post(
            f"{api_url}/admin/login",
            json={"email": root_email, "password": root_password},
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            timeout=10
        )
        
        if login_response.status_code != 200:
            print("❌ Não foi possível fazer login como root")
            return None, None
        
        root_data = login_response.json()
        root_token = root_data.get("token")
        
        if not root_token:
            print("❌ Token não recebido")
            return None, None
        
        # Criar usuário via API admin (se existir)
        # Por enquanto, apenas retorna None pois não temos endpoint de criação via admin
        print("⚠️  Criação via root não implementada. Use o método padrão.")
        return None, None
        
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return None, None


def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cria conta de teste para testes do wizard de fornecedor")
    parser.add_argument("--api-url", default=API_BASE_URL, help="URL da API")
    parser.add_argument("--root-email", help="Email root (opcional, para criação via admin)")
    parser.add_argument("--root-password", help="Senha root (opcional)")
    
    args = parser.parse_args()
    
    api_url = args.api_url
    
    if args.root_email and args.root_password:
        email, password = create_test_user_with_root(args.root_email, args.root_password, api_url)
    else:
        email, password = create_test_user(api_url)
    
    if email and password:
        print("\n✅ Conta de teste criada com sucesso!")
        print("\n📝 Próximos passos:")
        print("   1. Execute os testes com as credenciais fornecidas acima")
        print("   2. As credenciais foram salvas em um arquivo .txt")
        print("   3. Você pode usar essa conta para todos os testes")
        sys.exit(0)
    else:
        print("\n❌ Não foi possível criar a conta de teste.")
        print("\n💡 Alternativas:")
        print("   1. Crie manualmente em: https://lacosapp.com/cadastro")
        print("   2. Use uma conta existente")
        print("   3. Use uma conta root para ter permissão de deletar fornecedores")
        sys.exit(1)


if __name__ == "__main__":
    main()

