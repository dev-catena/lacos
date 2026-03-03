#!/usr/bin/env python3
"""
Script de Testes Unitários para o Wizard de Cadastro de Fornecedor
Testa validações, tipos de dados, obrigatoriedade e regras de negócio
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

# Configurações
API_BASE_URL = "https://gateway.lacosapp.com/api"  # ou "http://192.168.0.20/api" para local
TEST_EMAIL = ""  # Será solicitado se não fornecido
TEST_PASSWORD = ""  # Será solicitado se não fornecido

# Estados válidos do Brasil
VALID_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

# Categorias válidas
VALID_CATEGORIES = [
    'Medicamentos', 'Suplementos', 'Equipamentos Médicos',
    'Produtos de Higiene', 'Acessórios', 'Serviços de Saúde',
    'Fisioterapia', 'Enfermagem Domiciliar', 'Nutrição',
    'Produtos para o Lar', 'Dispositivos de Segurança', 'Outros'
]


class TestStatus(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    ERROR = "ERROR"


@dataclass
class TestCase:
    name: str
    description: str
    data: Dict
    expected_status: int
    expected_errors: Optional[List[str]] = None
    should_accept: bool = True


@dataclass
class TestResult:
    test_case: TestCase
    status: TestStatus
    actual_status: int
    actual_response: Dict
    message: str
    timestamp: datetime


class SupplierWizardTester:
    def __init__(self, api_base_url: str, email: str, password: str):
        self.api_base_url = api_base_url
        self.email = email
        self.password = password
        self.token = None
        self.user = None
        self.results: List[TestResult] = []
        
    def login(self) -> bool:
        """Faz login e obtém token"""
        try:
            response = requests.post(
                f"{self.api_base_url}/login",
                json={"login": self.email, "password": self.password},
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.user = data.get("user")
                print(f"✅ Login realizado com sucesso: {self.user.get('email')}")
                return True
            else:
                print(f"❌ Erro no login: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Erro ao fazer login: {str(e)}")
            return False
    
    def get_my_supplier(self) -> Tuple[int, Dict]:
        """Obtém o fornecedor do usuário logado"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
            
            response = requests.get(
                f"{self.api_base_url}/suppliers/me",
                headers=headers,
                timeout=10
            )
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text}
            
            return response.status_code, response_data
        except Exception as e:
            return 500, {"error": str(e)}
    
    def delete_supplier(self, supplier_id: int) -> Tuple[int, Dict]:
        """Deleta um fornecedor (apenas root)"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
            
            response = requests.delete(
                f"{self.api_base_url}/suppliers/{supplier_id}",
                headers=headers,
                timeout=10
            )
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text}
            
            return response.status_code, response_data
        except Exception as e:
            return 500, {"error": str(e)}
    
    def register_supplier(self, data: Dict) -> Tuple[int, Dict]:
        """Registra um fornecedor e retorna status e resposta"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
            
            response = requests.post(
                f"{self.api_base_url}/suppliers/register",
                json=data,
                headers=headers,
                timeout=10
            )
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw": response.text}
            
            return response.status_code, response_data
        except Exception as e:
            return 500, {"error": str(e)}
    
    def cleanup_existing_supplier(self, silent: bool = False) -> bool:
        """Remove fornecedor existente do usuário, se houver"""
        try:
            if not silent:
                print(f"   🔍 Verificando fornecedores existentes...")
            
            status, response = self.get_my_supplier()
            
            if not silent:
                print(f"   📊 Status da verificação: {status}")
                if status != 404:
                    print(f"   📋 Resposta: {json.dumps(response, indent=2, ensure_ascii=False)[:500]}")
            
            if status == 404:
                # Não tem fornecedor, tudo ok
                if not silent:
                    print(f"   ✅ Nenhum fornecedor existente encontrado")
                return True
            
            if status == 200:
                # Verificar se tem supplier no response
                supplier = None
                if "supplier" in response:
                    supplier = response["supplier"]
                elif isinstance(response, dict) and "id" in response:
                    supplier = response
                elif isinstance(response, dict) and "success" in response and response.get("success"):
                    # Pode estar em response["supplier"] ou diretamente no response
                    supplier = response.get("supplier") or response
                
                if supplier:
                    supplier_id = supplier.get("id")
                    
                    if supplier_id:
                        if not silent:
                            print(f"   ⚠️  Fornecedor existente encontrado (ID: {supplier_id}, Nome: {supplier.get('company_name', 'N/A')})")
                            print(f"   🔄 Tentando remover...")
                        
                        # Tentar deletar (só funciona se for root)
                        delete_status, delete_response = self.delete_supplier(supplier_id)
                        
                        if not silent:
                            print(f"   📊 Status da remoção: {delete_status}")
                            if delete_status != 200:
                                print(f"   📋 Resposta da remoção: {json.dumps(delete_response, indent=2, ensure_ascii=False)[:500]}")
                        
                        if delete_status == 200:
                            if not silent:
                                print(f"   ✅ Fornecedor removido com sucesso")
                            # Verificar novamente para confirmar (com múltiplas tentativas)
                            for attempt in range(3):
                                time.sleep(0.5 * (attempt + 1))  # Aumentar delay a cada tentativa
                                verify_status, verify_response = self.get_my_supplier()
                                if verify_status == 404:
                                    if not silent:
                                        print(f"   ✅ Confirmação: Fornecedor realmente removido")
                                    return True
                                if not silent and attempt < 2:
                                    print(f"   ⏳ Tentativa {attempt + 1}/3: Ainda existe, aguardando...")
                            
                            # Se chegou aqui, ainda existe após 3 tentativas
                            if not silent:
                                print(f"   ⚠️  Ainda existe fornecedor após remoção (status {verify_status})")
                                print(f"   📋 Resposta da verificação: {json.dumps(verify_response, indent=2, ensure_ascii=False)[:500]}")
                                print(f"   💡 Possíveis causas:")
                                print(f"      - O fornecedor foi deletado mas ainda está em cache")
                                print(f"      - Há um problema com o endpoint /suppliers/me")
                                print(f"      - O fornecedor foi deletado mas não completamente")
                                print(f"   💡 Soluções:")
                                print(f"      1. Aguarde alguns segundos e tente novamente")
                                print(f"      2. Verifique manualmente em http://admin.lacosapp.com")
                                print(f"      3. Use uma conta diferente para os testes")
                            return False
                        else:
                            if not silent:
                                print(f"   ❌ Não foi possível remover automaticamente (status {delete_status})")
                                if delete_status == 403:
                                    print(f"   💡 Você não tem permissão para deletar. Use uma conta root ou remova manualmente.")
                                    print(f"   💡 Para usar conta root:")
                                    print(f"      python3 test_supplier_wizard.py {self.api_base_url} root@lacos.com SUA_SENHA_ROOT")
                                elif delete_status == 404:
                                    print(f"   💡 Fornecedor não encontrado (pode ter sido deletado por outro processo)")
                                    # Verificar novamente
                                    time.sleep(1)
                                    verify_status, verify_response = self.get_my_supplier()
                                    if verify_status == 404:
                                        if not silent:
                                            print(f"   ✅ Confirmado: Fornecedor não existe mais")
                                        return True
                                else:
                                    print(f"   💡 Resposta: {json.dumps(delete_response, indent=2, ensure_ascii=False)}")
                            return False
                else:
                    # Status 200 mas sem supplier válido
                    if not silent:
                        print(f"   ⚠️  Resposta 200 mas sem fornecedor válido na resposta")
                        print(f"   📋 Resposta completa: {json.dumps(response, indent=2, ensure_ascii=False)}")
                    # Considerar como não tendo fornecedor
                    return True
            
            # Outros status codes
            if not silent:
                print(f"   ⚠️  Status inesperado: {status}")
                print(f"   📋 Resposta: {json.dumps(response, indent=2, ensure_ascii=False)[:500]}")
            
            # Se não é 404 nem 200, assumir que não tem fornecedor (pode ser erro de API)
            return True
        except Exception as e:
            if not silent:
                print(f"   ⚠️  Erro ao verificar fornecedor existente: {str(e)}")
                import traceback
                traceback.print_exc()
            return False
    
    def run_test(self, test_case: TestCase) -> TestResult:
        """Executa um teste e retorna o resultado"""
        print(f"\n🧪 Testando: {test_case.name}")
        print(f"   Descrição: {test_case.description}")
        
        status, response = self.register_supplier(test_case.data)
        
        # Determinar se passou ou falhou
        if test_case.should_accept:
            # Deve aceitar (status 201 ou 200)
            if status in [200, 201]:
                result_status = TestStatus.PASS
                message = f"✅ Aceito corretamente (status {status})"
            elif status == 400 and response.get("error") == "Already registered":
                # Caso especial: já existe fornecedor - precisa limpar primeiro
                result_status = TestStatus.FAIL
                message = f"⚠️  Erro: Usuário já possui fornecedor cadastrado. Execute a limpeza manualmente ou use outra conta."
            else:
                result_status = TestStatus.FAIL
                message = f"❌ Deveria aceitar mas retornou {status}: {json.dumps(response, indent=2, ensure_ascii=False)}"
        else:
            # Não deve aceitar (status 422 ou 400)
            if status in [422, 400]:
                # Verificar se os erros esperados estão presentes
                errors_found = True
                if test_case.expected_errors:
                    errors = response.get("errors", {})
                    
                    # Mapeamento de palavras-chave em inglês para português
                    keyword_translations = {
                        "required": ["obrigatório", "required", "é obrigatório", "is required", "field is required"],
                        "máximo": ["máximo", "maximum", "must not be greater than", "não pode exceder", "greater than"],
                        "mínimo": ["mínimo", "minimum", "must be at least", "deve ter pelo menos", "at least"],
                        "inválido": ["inválido", "invalid", "is invalid", "é inválido", "selected.*is invalid"],
                        "array": ["array", "deve ser um array", "must be an array", "be an array"],
                        "url": ["url", "deve ser uma url", "must be a url", "url válida", "valid url"]
                    }
                    
                    for expected_error in test_case.expected_errors:
                        found = False
                        expected_lower = expected_error.lower()
                        
                        # Verificar se é um campo (ex: "company_name", "cnpj")
                        # ou uma palavra-chave (ex: "obrigatório", "máximo")
                        is_field = expected_lower in [field.lower() for field in errors.keys()]
                        
                        if is_field:
                            # É um campo - verificar se o campo existe nos erros
                            for field, messages in errors.items():
                                if field.lower() == expected_lower:
                                    found = True
                                    break
                        else:
                            # É uma palavra-chave - procurar em todas as mensagens
                            # Obter traduções possíveis
                            possible_keywords = [expected_lower]
                            for en_key, pt_keywords in keyword_translations.items():
                                if expected_lower in pt_keywords or any(kw in expected_lower for kw in pt_keywords):
                                    possible_keywords.extend(pt_keywords)
                            
                            # Se não encontrou nas traduções, usar a palavra original
                            if len(possible_keywords) == 1:
                                possible_keywords.append(expected_lower)
                            
                            for field, messages in errors.items():
                                messages_list = messages if isinstance(messages, list) else [messages]
                                for msg in messages_list:
                                    msg_lower = str(msg).lower()
                                    # Verificar se alguma palavra-chave está na mensagem
                                    for keyword in possible_keywords:
                                        if keyword.lower() in msg_lower:
                                            found = True
                                            break
                                    if found:
                                        break
                                if found:
                                    break
                        
                        if not found:
                            errors_found = False
                            break
                
                if errors_found:
                    result_status = TestStatus.PASS
                    message = f"✅ Rejeitado corretamente (status {status})"
                else:
                    result_status = TestStatus.FAIL
                    message = f"⚠️ Rejeitado mas erros não correspondem. Esperado: {test_case.expected_errors}, Recebido: {response.get('errors', {})}"
            else:
                result_status = TestStatus.FAIL
                message = f"❌ Deveria rejeitar mas retornou {status}: {json.dumps(response, indent=2)}"
        
        print(f"   {message}")
        
        return TestResult(
            test_case=test_case,
            status=result_status,
            actual_status=status,
            actual_response=response,
            message=message,
            timestamp=datetime.now()
        )
    
    def generate_test_cases(self) -> List[TestCase]:
        """Gera todos os casos de teste"""
        import random
        import time
        
        # Gerar dados únicos para evitar conflitos
        timestamp = int(time.time())
        random_suffix = random.randint(1000, 9999)
        unique_cnpj = f"{timestamp % 100000000:08d}{random_suffix:04d}"[:14]
        unique_cpf = f"{timestamp % 1000000000:09d}{random_suffix:02d}"[:11]
        
        test_cases = []
        
        # ========== CAMINHO FELIZ ==========
        test_cases.append(TestCase(
            name="Caminho Feliz - Pessoa Jurídica Completo",
            description="Todos os campos preenchidos corretamente para PJ",
            data={
                "company_name": f"Empresa Teste {timestamp} LTDA",
                "company_type": "pessoa_juridica",
                "cnpj": unique_cnpj,
                "address": "Rua Teste, 123",
                "address_number": "123",
                "address_complement": "Sala 101",
                "neighborhood": "Centro",
                "city": "Belo Horizonte",
                "state": "MG",
                "zip_code": "30123456",
                "bank_name": "Banco do Brasil",
                "bank_code": "001",
                "agency": "1234",
                "account": "12345-6",
                "account_type": "checking",
                "account_holder_name": "Empresa Teste LTDA",
                "account_holder_document": "12345678000190",
                "pix_key": "12345678000190",
                "pix_key_type": "cnpj",
                "business_description": "Empresa especializada em produtos para idosos",
                "products_categories": ["Medicamentos", "Suplementos"],
                "website": "https://www.empresateste.com.br",
                "instagram": "@empresateste",
                "facebook": "https://facebook.com/empresateste"
            },
            expected_status=201,
            should_accept=True
        ))
        
        test_cases.append(TestCase(
            name="Caminho Feliz - Pessoa Física Completo",
            description="Todos os campos preenchidos corretamente para PF",
            data={
                "company_name": f"João da Silva {timestamp}",
                "company_type": "pessoa_fisica",
                "cpf": unique_cpf,
                "address": "Rua Teste, 456",
                "city": "São Paulo",
                "state": "SP",
                "zip_code": "01234567",
                "business_description": "Prestador de serviços para idosos",
                "products_categories": ["Fisioterapia", "Enfermagem Domiciliar"],
                "website": "https://www.joaosilva.com.br"
            },
            expected_status=201,
            should_accept=True
        ))
        
        test_cases.append(TestCase(
            name="Caminho Feliz - Mínimo Obrigatório",
            description="Apenas campos obrigatórios preenchidos",
            data={
                "company_name": f"Empresa Mínima {timestamp} LTDA",
                "company_type": "pessoa_juridica",
                "cnpj": f"{timestamp % 100000000:08d}{random_suffix:04d}"[:14],
                "address": "Av. Principal, 789",
                "city": "Rio de Janeiro",
                "state": "RJ",
                "zip_code": "20000000",
                "products_categories": ["Outros"]
            },
            expected_status=201,
            should_accept=True
        ))
        
        # ========== VALIDAÇÕES DE OBRIGATORIEDADE ==========
        test_cases.append(TestCase(
            name="Campo Obrigatório - company_name vazio",
            description="Nome da empresa é obrigatório",
            data={
                "company_name": "",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["company_name", "obrigatório"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Campo Obrigatório - company_name ausente",
            description="Nome da empresa não pode estar ausente",
            data={
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["company_name", "obrigatório"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Campo Obrigatório - company_type ausente",
            description="Tipo de cadastro é obrigatório",
            data={
                "company_name": "Empresa Teste",
                "cnpj": "12345678000190",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["company_type", "obrigatório"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Campo Obrigatório - CNPJ ausente para PJ",
            description="CNPJ é obrigatório para pessoa jurídica",
            data={
                "company_name": f"Empresa Teste {timestamp} LTDA",
                "company_type": "pessoa_juridica",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["cnpj", "obrigatório"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Campo Obrigatório - CPF ausente para PF",
            description="CPF é obrigatório para pessoa física",
            data={
                "company_name": f"João Silva {timestamp}",
                "company_type": "pessoa_fisica",
                "products_categories": ["Fisioterapia"]
            },
            expected_status=422,
            expected_errors=["cpf", "obrigatório"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Campo Obrigatório - products_categories vazio",
            description="Pelo menos uma categoria é obrigatória",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": []
            },
            expected_status=422,
            expected_errors=["products_categories", "obrigatório", "mínimo"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Campo Obrigatório - products_categories ausente",
            description="Categorias não podem estar ausentes",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190"
            },
            expected_status=422,
            expected_errors=["products_categories", "obrigatório"],
            should_accept=False
        ))
        
        # ========== VALIDAÇÕES DE TAMANHO MÁXIMO ==========
        test_cases.append(TestCase(
            name="Tamanho Máximo - company_name excede 255 caracteres",
            description="Nome da empresa não pode exceder 255 caracteres",
            data={
                "company_name": "A" * 256,
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["company_name", "máximo", "255"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Tamanho Máximo - CNPJ excede 18 caracteres",
            description="CNPJ não pode exceder 18 caracteres",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "1" * 19,
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["cnpj", "máximo"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Tamanho Máximo - CPF excede 14 caracteres",
            description="CPF não pode exceder 14 caracteres",
            data={
                "company_name": "João Silva",
                "company_type": "pessoa_fisica",
                "cpf": "1" * 15,
                "products_categories": ["Fisioterapia"]
            },
            expected_status=422,
            expected_errors=["cpf", "máximo"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Tamanho Máximo - state excede 2 caracteres",
            description="Estado não pode exceder 2 caracteres",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "state": "MGG",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["state", "máximo", "2"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Tamanho Máximo - zip_code excede 10 caracteres",
            description="CEP não pode exceder 10 caracteres",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "zip_code": "1" * 11,
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["zip_code", "máximo"],
            should_accept=False
        ))
        
        # ========== VALIDAÇÕES DE TIPO ==========
        test_cases.append(TestCase(
            name="Tipo Inválido - company_type inválido",
            description="Tipo de cadastro deve ser pessoa_fisica ou pessoa_juridica",
            data={
                "company_name": "Empresa Teste",
                "company_type": "tipo_invalido",
                "cnpj": "12345678000190",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["company_type", "inválido"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Tipo Inválido - account_type inválido",
            description="Tipo de conta deve ser checking ou savings",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "account_type": "tipo_invalido",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["account_type", "inválido"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Tipo Inválido - products_categories não é array",
            description="Categorias devem ser um array",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": "Medicamentos"  # String ao invés de array
            },
            expected_status=422,
            expected_errors=["products_categories", "array"],
            should_accept=False
        ))
        
        # ========== VALIDAÇÕES DE FORMATO ==========
        test_cases.append(TestCase(
            name="Formato Inválido - website não é URL válida",
            description="Website deve ser uma URL válida",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "website": "não-é-uma-url",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["website", "url"],
            should_accept=False
        ))
        
        test_cases.append(TestCase(
            name="Formato Inválido - website sem protocolo",
            description="Website deve ter protocolo http:// ou https://",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "website": "www.empresa.com",
                "products_categories": ["Medicamentos"]
            },
            expected_status=422,
            expected_errors=["website", "url"],
            should_accept=False
        ))
        
        # ========== VALIDAÇÕES DE REGRAS DE NEGÓCIO ==========
        test_cases.append(TestCase(
            name="Regra de Negócio - CNPJ fornecido para PF",
            description="CNPJ não deve ser aceito para pessoa física",
            data={
                "company_name": "João Silva",
                "company_type": "pessoa_fisica",
                "cpf": "12345678901",
                "cnpj": "12345678000190",  # Não deveria ser aceito
                "products_categories": ["Fisioterapia"]
            },
            expected_status=400,  # Deve rejeitar
            should_accept=False,  # Deve rejeitar
            expected_errors=["cnpj", "não deve"]
        ))
        
        test_cases.append(TestCase(
            name="Regra de Negócio - CPF fornecido para PJ",
            description="CPF não deve ser aceito para pessoa jurídica",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "cpf": "12345678901",  # Não deveria ser aceito
                "products_categories": ["Medicamentos"]
            },
            expected_status=400,  # Deve rejeitar
            should_accept=False,  # Deve rejeitar
            expected_errors=["cpf", "não deve"]
        ))
        
        test_cases.append(TestCase(
            name="Regra de Negócio - Categoria inválida",
            description="Categoria deve estar na lista de categorias válidas",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": ["Categoria Inexistente"]
            },
            expected_status=400,  # Deve rejeitar
            should_accept=False,  # Deve rejeitar
            expected_errors=["products_categories", "inválida"]
        ))
        
        test_cases.append(TestCase(
            name="Regra de Negócio - Estado inválido",
            description="Estado deve ser uma sigla válida do Brasil",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "state": "XX",  # Estado inválido
                "products_categories": ["Medicamentos"]
            },
            expected_status=400,  # Deve rejeitar
            should_accept=False,  # Deve rejeitar
            expected_errors=["state", "inválido"]
        ))
        
        # ========== VALIDAÇÕES DE INTEGRIDADE ==========
        test_cases.append(TestCase(
            name="Integridade - Campos bancários parciais",
            description="Se fornecer dados bancários, alguns campos podem ser obrigatórios",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "bank_name": "Banco do Brasil",
                # Faltando agency e account
                "products_categories": ["Medicamentos"]
            },
            expected_status=201,  # Pode aceitar dados bancários parciais
            should_accept=True
        ))
        
        test_cases.append(TestCase(
            name="Integridade - PIX sem tipo",
            description="PIX key sem tipo pode ser aceito",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "pix_key": "12345678000190",
                # pix_key_type ausente
                "products_categories": ["Medicamentos"]
            },
            expected_status=201,
            should_accept=True
        ))
        
        # ========== TESTES DE VALORES LIMITE ==========
        test_cases.append(TestCase(
            name="Valor Limite - company_name com exatamente 255 caracteres",
            description="Nome da empresa no limite máximo",
            data={
                "company_name": "A" * 255,
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": ["Medicamentos"]
            },
            expected_status=201,
            should_accept=True
        ))
        
        test_cases.append(TestCase(
            name="Valor Limite - CNPJ com exatamente 18 caracteres",
            description="CNPJ no limite máximo",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "1" * 18,
                "products_categories": ["Medicamentos"]
            },
            expected_status=201,
            should_accept=True
        ))
        
        test_cases.append(TestCase(
            name="Valor Limite - Apenas uma categoria",
            description="Mínimo de uma categoria",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": ["Medicamentos"]  # Apenas uma
            },
            expected_status=201,
            should_accept=True
        ))
        
        test_cases.append(TestCase(
            name="Valor Limite - Todas as categorias",
            description="Máximo de categorias",
            data={
                "company_name": "Empresa Teste",
                "company_type": "pessoa_juridica",
                "cnpj": "12345678000190",
                "products_categories": VALID_CATEGORIES  # Todas
            },
            expected_status=201,
            should_accept=True
        ))
        
        return test_cases
    
    def run_all_tests(self):
        """Executa todos os testes"""
        print("=" * 80)
        print("🧪 TESTES DO WIZARD DE CADASTRO DE FORNECEDOR")
        print("=" * 80)
        
        if not self.login():
            print("❌ Não foi possível fazer login. Abortando testes.")
            return
        
        # Limpar fornecedor existente antes dos testes de caminho feliz
        print("\n🧹 Verificando fornecedores existentes...")
        cleanup_success = self.cleanup_existing_supplier()
        
        if not cleanup_success:
            print("\n" + "=" * 80)
            print("❌ ERRO: Não foi possível limpar fornecedor existente.")
            print("=" * 80)
            print("\n💡 SOLUÇÕES:")
            print("\n   1. 🔑 Use uma conta ROOT (Recomendado):")
            print(f"      python3 test_supplier_wizard.py {self.api_base_url} root@lacos.com SUA_SENHA_ROOT")
            print("\n   2. 🗑️  Remova manualmente via painel admin:")
            print("      - Acesse: http://admin.lacosapp.com")
            print("      - Vá em 'Fornecedores'")
            print("      - Delete o fornecedor existente")
            print("      - Aguarde alguns segundos e tente novamente")
            print("\n   3. 👤 Use uma conta diferente:")
            print("      python3 create_test_user.py")
            print("      (Isso criará uma nova conta sem fornecedor)")
            print("\n   4. ⏳ Aguarde alguns segundos:")
            print("      - Pode haver cache ou delay na remoção")
            print("      - Tente novamente em alguns segundos")
            print()
            resposta = input("   Deseja continuar mesmo assim? (s/N): ").strip().lower()
            if resposta != 's':
                print("   ❌ Testes cancelados pelo usuário.")
                return
            print("   ⚠️  Continuando com aviso: Os testes podem falhar se houver fornecedor existente.")
        
        test_cases = self.generate_test_cases()
        print(f"\n📋 Total de testes: {len(test_cases)}")
        
        for i, test_case in enumerate(test_cases, 1):
            # Limpar fornecedor ANTES de cada teste que deve aceitar (qualquer teste com should_accept=True)
            # Isso inclui: Caminho Feliz, Valor Limite, Integridade que aceita, etc.
            if test_case.should_accept:
                print(f"   🧹 Limpando fornecedor existente antes do teste...")
                cleanup_success = self.cleanup_existing_supplier()
                if not cleanup_success:
                    print(f"   ⚠️  Não foi possível limpar. O teste pode falhar se já houver fornecedor.")
                time.sleep(0.5)
            
            result = self.run_test(test_case)
            self.results.append(result)
            
            # Se o teste falhou por "Already registered", tentar limpar e repetir uma vez
            if (test_case.should_accept and 
                result.actual_status == 400 and 
                result.actual_response.get("error") == "Already registered" and
                "Caminho Feliz" in test_case.name):
                print(f"   🔄 Tentando limpar e repetir o teste...")
                cleanup_success = self.cleanup_existing_supplier()
                if cleanup_success:
                    print(f"   🔄 Repetindo teste após limpeza...")
                    time.sleep(1)
                    result = self.run_test(test_case)
                    self.results[-1] = result  # Substituir resultado anterior
            
            # Se o teste passou e foi um cadastro bem-sucedido, limpar após
            elif (test_case.should_accept and 
                  result.actual_status in [200, 201] and 
                  "Caminho Feliz" in test_case.name):
                # Limpar fornecedor criado para permitir próximos testes
                print(f"   🧹 Limpando fornecedor criado para próximo teste...")
                time.sleep(0.5)
                self.cleanup_existing_supplier()
            
            time.sleep(0.5)  # Pequeno delay entre testes
        
        self.generate_report()
    
    def generate_report(self):
        """Gera relatório detalhado dos testes"""
        print("\n" + "=" * 80)
        print("📊 RELATÓRIO DE TESTES")
        print("=" * 80)
        
        total = len(self.results)
        passed = sum(1 for r in self.results if r.status == TestStatus.PASS)
        failed = sum(1 for r in self.results if r.status == TestStatus.FAIL)
        errors = sum(1 for r in self.results if r.status == TestStatus.ERROR)
        
        print(f"\n📈 RESUMO:")
        print(f"   Total de testes: {total}")
        print(f"   ✅ Passou: {passed} ({passed/total*100:.1f}%)")
        print(f"   ❌ Falhou: {failed} ({failed/total*100:.1f}%)")
        print(f"   ⚠️  Erro: {errors} ({errors/total*100:.1f}%)")
        
        # Testes que falharam
        failed_tests = [r for r in self.results if r.status == TestStatus.FAIL]
        if failed_tests:
            print(f"\n❌ TESTES QUE FALHARAM ({len(failed_tests)}):")
            print("-" * 80)
            for result in failed_tests:
                print(f"\n🔴 {result.test_case.name}")
                print(f"   Descrição: {result.test_case.description}")
                print(f"   Esperado: {'Aceitar' if result.test_case.should_accept else 'Rejeitar'}")
                print(f"   Status recebido: {result.actual_status}")
                print(f"   Mensagem: {result.message}")
                print(f"   Resposta: {json.dumps(result.actual_response, indent=2, ensure_ascii=False)}")
        
        # Testes que passaram
        passed_tests = [r for r in self.results if r.status == TestStatus.PASS]
        if passed_tests:
            print(f"\n✅ TESTES QUE PASSARAM ({len(passed_tests)}):")
            print("-" * 80)
            for result in passed_tests:
                print(f"   ✓ {result.test_case.name}")
        
        # Salvar relatório em arquivo (usar caminho relativo ao diretório atual)
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        report_file = os.path.join(script_dir, f"report_{timestamp}.json")
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": total,
                "passed": passed,
                "failed": failed,
                "errors": errors
            },
            "results": [
                {
                    "name": r.test_case.name,
                    "description": r.test_case.description,
                    "status": r.status.value,
                    "expected": "accept" if r.test_case.should_accept else "reject",
                    "actual_status": r.actual_status,
                    "message": r.message,
                    "response": r.actual_response
                }
                for r in self.results
            ]
        }
        
        with open(report_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Relatório salvo em: {report_file}")
        
        # Gerar relatório HTML
        html_file = self.generate_html_report(report_data)
        return html_file
    
    def generate_html_report(self, report_data: Dict):
        """Gera relatório HTML visual"""
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        html_file = os.path.join(script_dir, f"report_{timestamp}.html")
        
        html = f"""
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Testes - Wizard de Fornecedor</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            border-bottom: 3px solid #4a90e2;
            padding-bottom: 10px;
        }}
        .summary {{
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }}
        .summary-card {{
            flex: 1;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
        }}
        .summary-card.total {{
            background: #e3f2fd;
            color: #1976d2;
        }}
        .summary-card.passed {{
            background: #e8f5e9;
            color: #2e7d32;
        }}
        .summary-card.failed {{
            background: #ffebee;
            color: #c62828;
        }}
        .summary-card h2 {{
            margin: 0;
            font-size: 36px;
        }}
        .summary-card p {{
            margin: 5px 0 0 0;
            font-size: 14px;
        }}
        .test-result {{
            margin: 15px 0;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid;
        }}
        .test-result.passed {{
            background: #e8f5e9;
            border-color: #4caf50;
        }}
        .test-result.failed {{
            background: #ffebee;
            border-color: #f44336;
        }}
        .test-result h3 {{
            margin: 0 0 10px 0;
        }}
        .test-result .details {{
            margin-top: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }}
        .badge.pass {{
            background: #4caf50;
            color: white;
        }}
        .badge.fail {{
            background: #f44336;
            color: white;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Relatório de Testes - Wizard de Cadastro de Fornecedor</h1>
        <p><strong>Data:</strong> {report_data['timestamp']}</p>
        
        <div class="summary">
            <div class="summary-card total">
                <h2>{report_data['summary']['total']}</h2>
                <p>Total de Testes</p>
            </div>
            <div class="summary-card passed">
                <h2>{report_data['summary']['passed']}</h2>
                <p>Passou ({report_data['summary']['passed']/report_data['summary']['total']*100:.1f}%)</p>
            </div>
            <div class="summary-card failed">
                <h2>{report_data['summary']['failed']}</h2>
                <p>Falhou ({report_data['summary']['failed']/report_data['summary']['total']*100:.1f}%)</p>
            </div>
        </div>
        
        <h2>Resultados Detalhados</h2>
"""
        
        for result in report_data['results']:
            status_class = "passed" if result['status'] == "PASS" else "failed"
            badge_class = "pass" if result['status'] == "PASS" else "fail"
            badge_text = "✅ PASS" if result['status'] == "PASS" else "❌ FAIL"
            
            html += f"""
        <div class="test-result {status_class}">
            <h3>
                <span class="badge {badge_class}">{badge_text}</span>
                {result['name']}
            </h3>
            <p><strong>Descrição:</strong> {result['description']}</p>
            <p><strong>Esperado:</strong> {result['expected']} | <strong>Status:</strong> {result['actual_status']}</p>
            <p><strong>Mensagem:</strong> {result['message']}</p>
            <div class="details">
                <strong>Resposta da API:</strong><br>
                <pre>{json.dumps(result['response'], indent=2, ensure_ascii=False)}</pre>
            </div>
        </div>
"""
        
        html += """
    </div>
</body>
</html>
"""
        
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html)
        
        print(f"📄 Relatório HTML salvo em: {html_file}")
        return html_file


def main():
    """Função principal"""
    import sys
    import getpass
    
    # Permitir configuração via argumentos
    api_url = sys.argv[1] if len(sys.argv) > 1 else API_BASE_URL
    email = sys.argv[2] if len(sys.argv) > 2 else TEST_EMAIL
    password = sys.argv[3] if len(sys.argv) > 3 else TEST_PASSWORD
    
    # Solicitar credenciais se não fornecidas
    if not email:
        email = input("📧 Digite o email para login: ").strip()
    if not password:
        password = getpass.getpass("🔐 Digite a senha: ")
    
    if not email or not password:
        print("❌ Email e senha são obrigatórios!")
        print("\nUso:")
        print("  python3 test_supplier_wizard.py [API_URL] [EMAIL] [PASSWORD]")
        print("\nOu execute sem parâmetros para inserir interativamente.")
        sys.exit(1)
    
    print(f"\n🔧 Configuração:")
    print(f"   API URL: {api_url}")
    print(f"   Email: {email}")
    print(f"   Password: {'*' * len(password)}")
    print()
    
    tester = SupplierWizardTester(api_url, email, password)
    tester.run_all_tests()


if __name__ == "__main__":
    main()

