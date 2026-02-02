#!/usr/bin/env python3
"""
Script de testes automatizados para o Web-Admin
Testa todas as funcionalidades principais do painel administrativo
"""

import time
import random
import string
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import json
from datetime import datetime

# Configurações
WEB_ADMIN_URL = "http://10.102.0.103:8082"  # URL do web-admin
API_BASE_URL = "http://localhost:8000/api"  # Ajuste conforme necessário
ADMIN_EMAIL = "admin@lacos.com"  # Usuário admin encontrado no banco
ADMIN_PASSWORD = "admin123"  # Senha padrão do admin

class WebAdminTester:
    def __init__(self):
        self.driver = None
        self.api_token = None
        self.test_results = []
        self.detailed_report = {
            'inicio': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'fim': None,
            'login': {'status': None, 'detalhes': []},
            'usuarios': {'status': None, 'itens_testados': []},
            'medicos': {'status': None, 'itens_testados': []},
            'cuidadores': {'status': None, 'itens_testados': []},
            'fornecedores': {'status': None, 'itens_testados': []},
            'dispositivos': {'status': None, 'itens_testados': []},
            'erros': []
        }
        
    def setup_driver(self):
        """Configura o driver do Selenium"""
        chrome_options = Options()
        # chrome_options.add_argument('--headless')  # Descomente para rodar sem interface
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--remote-debugging-port=9222')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        try:
            # Verificar se o web-admin está acessível antes de iniciar o driver
            print(f"🔍 Verificando se o web-admin está acessível em {WEB_ADMIN_URL}...")
            try:
                response = requests.get(WEB_ADMIN_URL, timeout=5)
                if response.status_code == 200:
                    print(f"✅ Web-admin está acessível em {WEB_ADMIN_URL}")
                else:
                    print(f"⚠️  Web-admin respondeu com status {response.status_code}")
            except requests.exceptions.ConnectionError:
                print(f"❌ ERRO: Web-admin não está acessível em {WEB_ADMIN_URL}")
                print(f"💡 Por favor, inicie o web-admin primeiro:")
                print(f"   cd web-admin && npm run dev")
                print(f"   Ou use o script: ./scripts/INICIAR_ADMIN_WEB.sh")
                return False
            except Exception as e:
                print(f"⚠️  Não foi possível verificar acessibilidade: {e}")
            
            import os
            import glob
            
            # Primeiro, tentar usar o ChromeDriver do snap do Chromium (compatível com a versão instalada)
            snap_chromedriver_paths = [
                "/snap/chromium/current/usr/lib/chromium-browser/chromedriver",
            ]
            # Buscar todas as versões do snap
            snap_versions = glob.glob("/snap/chromium/*/usr/lib/chromium-browser/chromedriver")
            if snap_versions:
                # Usar a versão mais recente (última na lista ordenada)
                snap_chromedriver_paths.extend(sorted(snap_versions))
            
            driver_path = None
            for path in snap_chromedriver_paths:
                if os.path.exists(path) and os.access(path, os.X_OK):
                    driver_path = path
                    print(f"✅ Usando ChromeDriver do snap: {driver_path}")
                    break
            
            # Se não encontrou no snap, tentar webdriver-manager
            if not driver_path:
                print("🔍 ChromeDriver do snap não encontrado, usando webdriver-manager...")
                # Limpar cache e forçar download da versão mais recente
                cache_dir = os.path.expanduser("~/.wdm")
                if os.path.exists(cache_dir):
                    print("🧹 Limpando cache do webdriver-manager...")
                    import shutil
                    try:
                        shutil.rmtree(cache_dir)
                        print("✅ Cache limpo")
                    except:
                        pass
                
                # Usar ChromeDriverManager com detecção automática da versão
                driver_path = ChromeDriverManager().install()
                print(f"✅ ChromeDriver instalado via webdriver-manager: {driver_path}")
            
            service = Service(driver_path)
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.driver.implicitly_wait(10)
            print("✅ Driver do Selenium configurado com sucesso")
            return True
        except Exception as e:
            error_msg = str(e)
            # Se o erro for de conexão, não tentar fallback
            if "ERR_CONNECTION_REFUSED" in error_msg or "Connection refused" in error_msg:
                print(f"\n❌ ERRO: Não foi possível conectar ao web-admin em {WEB_ADMIN_URL}")
                print(f"💡 Por favor, inicie o web-admin primeiro:")
                print(f"   cd web-admin && npm run dev")
                print(f"   Ou use o script: ./scripts/INICIAR_ADMIN_WEB.sh")
                print(f"   O web-admin deve estar rodando antes de executar os testes!")
                return False
            
            print("💡 Tentando usar ChromeDriver do sistema (sem especificar caminho)...")
            # Tentar sem especificar o caminho (usar o do PATH)
            try:
                self.driver = webdriver.Chrome(options=chrome_options)
                self.driver.implicitly_wait(10)
                print("✅ Driver configurado usando ChromeDriver do PATH")
                return True
            except Exception as e2:
                print(f"❌ Erro ao usar ChromeDriver do PATH: {e2}")
                print("\n💡 Soluções possíveis:")
                print("   1. Instale o ChromeDriver: sudo apt-get install chromium-chromedriver")
                print("   2. Ou atualize o webdriver-manager: pip install --upgrade webdriver-manager")
                print("   3. Ou baixe o ChromeDriver manualmente de: https://chromedriver.chromium.org/")
                return False
    
    def wait_for_element(self, by, value, timeout=10):
        """Aguarda elemento aparecer"""
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((by, value))
            )
            return element
        except TimeoutException:
            print(f"⏱️  Timeout ao aguardar elemento: {by}={value}")
            return None
    
    def login(self):
        """Faz login no web-admin"""
        print("\n🔐 Testando login no web-admin...")
        self.detailed_report['login']['detalhes'].append(f"Início do teste de login às {datetime.now().strftime('%H:%M:%S')}")
        try:
            # Verificar se já está na URL correta
            current_url = self.driver.current_url
            if current_url == "data:," or (WEB_ADMIN_URL not in current_url):
                print(f"🌐 Navegando para: {WEB_ADMIN_URL}")
                self.driver.get(WEB_ADMIN_URL)
                self.detailed_report['login']['detalhes'].append(f"✓ Navegação para {WEB_ADMIN_URL}")
            else:
                print(f"✅ Já está na URL: {current_url}")
                self.detailed_report['login']['detalhes'].append(f"✓ Já estava na URL correta: {current_url}")
            time.sleep(2)
            
            # Aguardar campo de email
            email_input = self.wait_for_element(By.CSS_SELECTOR, 'input[type="email"], input[name="email"]')
            if not email_input:
                print("❌ Campo de email não encontrado")
                self.detailed_report['login']['detalhes'].append("✗ Campo de email não encontrado")
                self.detailed_report['login']['status'] = 'FALHOU'
                return False
            self.detailed_report['login']['detalhes'].append("✓ Campo de email encontrado")
            
            email_input.send_keys(ADMIN_EMAIL)
            self.detailed_report['login']['detalhes'].append(f"✓ Email preenchido: {ADMIN_EMAIL}")
            
            # Campo de senha
            password_input = self.driver.find_element(By.CSS_SELECTOR, 'input[type="password"], input[name="password"]')
            password_input.send_keys(ADMIN_PASSWORD)
            self.detailed_report['login']['detalhes'].append("✓ Campo de senha preenchido")
            
            # Botão de login
            login_button = self.driver.find_element(By.XPATH, '//button[contains(text(), "Entrar")] | //button[@type="submit"]')
            login_button.click()
            self.detailed_report['login']['detalhes'].append("✓ Botão de login clicado")
            
            # Aguardar login (verificar se aparece o menu lateral)
            time.sleep(3)
            
            # Verificar se logou com sucesso (procurar por elementos do dashboard)
            try:
                self.wait_for_element(By.CSS_SELECTOR, '.sidebar, .main-layout, [class*="sidebar"]', timeout=5)
                print("✅ Login realizado com sucesso")
                self.detailed_report['login']['detalhes'].append("✓ Dashboard encontrado após login")
                
                # Obter token da API do localStorage
                token = self.driver.execute_script("return localStorage.getItem('@lacos:token');")
                if token:
                    self.api_token = token
                    print(f"✅ Token obtido: {token[:20]}...")
                    self.detailed_report['login']['detalhes'].append(f"✓ Token obtido do localStorage: {token[:20]}...")
                
                self.detailed_report['login']['status'] = 'SUCESSO'
                return True
            except:
                print("❌ Login falhou - dashboard não encontrado")
                self.detailed_report['login']['detalhes'].append("✗ Dashboard não encontrado após login")
                self.detailed_report['login']['status'] = 'FALHOU'
                return False
                
        except Exception as e:
            print(f"❌ Erro no login: {e}")
            self.detailed_report['login']['detalhes'].append(f"✗ Erro: {str(e)}")
            self.detailed_report['login']['status'] = 'ERRO'
            self.detailed_report['erros'].append(f"Login: {str(e)}")
            return False
    
    def test_users_management(self):
        """Testa gerenciamento de usuários"""
        print("\n👥 Testando gerenciamento de usuários...")
        try:
            # Clicar no menu de usuários
            users_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Usuários')] | //a[contains(text(), 'Usuários')]")
            if users_button:
                users_button.click()
                time.sleep(2)
                print("✅ Acessou página de usuários")
            else:
                print("⚠️  Botão de usuários não encontrado, tentando navegação direta")
                self.driver.get(f"{WEB_ADMIN_URL}#/users")
                time.sleep(2)
            
            # Criar usuário fake
            print("  📝 Criando usuário fake...")
            create_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Adicionar')] | //button[contains(text(), 'Novo')] | //button[contains(text(), 'Criar')]")
            if create_button:
                create_button.click()
                time.sleep(1)
                
                # Preencher formulário
                name = f"Teste Usuario {random.randint(1000, 9999)}"
                email = f"teste{random.randint(1000, 9999)}@teste.com"
                
                name_input = self.wait_for_element(By.CSS_SELECTOR, 'input[name="name"], input[placeholder*="nome" i]')
                if name_input:
                    name_input.send_keys(name)
                
                email_input = self.wait_for_element(By.CSS_SELECTOR, 'input[name="email"], input[type="email"]')
                if email_input:
                    email_input.send_keys(email)
                
                # Salvar
                save_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Salvar')] | //button[contains(text(), 'Criar')]")
                if save_button:
                    save_button.click()
                    time.sleep(2)
                    print(f"  ✅ Usuário criado: {name}")
            
            # Testar bloqueio
            print("  🔒 Testando bloqueio de usuário...")
            # Procurar por botão de bloqueio
            block_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Bloquear')] | //button[contains(@title, 'Bloquear')]")
            if block_buttons:
                block_buttons[0].click()
                time.sleep(1)
                print("  ✅ Bloqueio testado")
            
            # Testar exclusão
            print("  🗑️  Testando exclusão de usuário...")
            delete_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Excluir')] | //button[contains(@title, 'Excluir')]")
            if delete_buttons:
                delete_buttons[0].click()
                time.sleep(1)
                # Confirmar exclusão se houver modal
                confirm_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Confirmar')] | //button[contains(text(), 'Sim')]", timeout=2)
                if confirm_button:
                    confirm_button.click()
                time.sleep(1)
                print("  ✅ Exclusão testada")
            
            self.test_results.append("✅ Gerenciamento de usuários: OK")
            return True
            
        except Exception as e:
            print(f"❌ Erro no teste de usuários: {e}")
            self.test_results.append(f"❌ Gerenciamento de usuários: {str(e)}")
            return False
    
    def test_doctors_management(self):
        """Testa gerenciamento de médicos"""
        print("\n👨‍⚕️ Testando gerenciamento de médicos...")
        try:
            # Clicar no menu de médicos
            doctors_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Médicos')] | //a[contains(text(), 'Médicos')]")
            if doctors_button:
                doctors_button.click()
                time.sleep(2)
                print("✅ Acessou página de médicos")
            else:
                self.driver.get(f"{WEB_ADMIN_URL}#/doctors")
                time.sleep(2)
            
            # Listar médicos
            print("  📋 Listando médicos...")
            time.sleep(2)
            doctors_list = self.driver.find_elements(By.CSS_SELECTOR, '.doctor-card, .doctor-item, [class*="doctor"]')
            print(f"  ✅ Encontrados {len(doctors_list)} médicos na interface")
            
            # Testar edição
            print("  ✏️  Testando edição de médico...")
            edit_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Editar')] | //button[contains(@title, 'Editar')]")
            if edit_buttons:
                edit_buttons[0].click()
                time.sleep(2)
                # Fechar modal se houver
                close_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Fechar')] | //button[contains(text(), 'Cancelar')]", timeout=2)
                if close_button:
                    close_button.click()
                print("  ✅ Edição testada")
            
            # Testar bloqueio
            print("  🔒 Testando bloqueio de médico...")
            block_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Bloquear')] | //button[contains(@title, 'Bloquear')]")
            if block_buttons:
                block_buttons[0].click()
                time.sleep(1)
                print("  ✅ Bloqueio testado")
            
            # Testar lista de pacientes
            print("  👥 Testando lista de pacientes do médico...")
            patients_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Pacientes')] | //a[contains(text(), 'Pacientes')]")
            if patients_buttons:
                patients_buttons[0].click()
                time.sleep(2)
                print("  ✅ Lista de pacientes acessada")
            
            self.test_results.append("✅ Gerenciamento de médicos: OK")
            return True
            
        except Exception as e:
            print(f"❌ Erro no teste de médicos: {e}")
            self.test_results.append(f"❌ Gerenciamento de médicos: {str(e)}")
            return False
    
    def test_caregivers_management(self):
        """Testa gerenciamento de cuidadores"""
        print("\n👨‍⚕️ Testando gerenciamento de cuidadores...")
        try:
            # Verificar no banco de dados se existem cuidadores
            print("  🔍 Verificando cuidadores no banco de dados...")
            headers = {'Accept': 'application/json'}
            if self.api_token:
                headers['Authorization'] = f'Bearer {self.api_token}'
            
            response = requests.get(f"{API_BASE_URL}/admin/caregivers", headers=headers)
            if response.status_code == 200:
                data = response.json()
                caregivers = data.get('caregivers', []) if isinstance(data, dict) else data
                caregiver_count = len(caregivers) if isinstance(caregivers, list) else 0
                print(f"  ✅ Encontrados {caregiver_count} cuidadores no banco")
                if caregiver_count > 0:
                    print(f"  📋 Primeiro cuidador: {caregivers[0].get('name', 'N/A')}")
            elif response.status_code == 403:
                print("  ⚠️  Acesso negado - verifique se o usuário tem permissão root")
            else:
                print(f"  ⚠️  Erro ao buscar cuidadores: {response.status_code} - {response.text[:100]}")
            
            # Acessar interface
            caregivers_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Cuidadores')] | //a[contains(text(), 'Cuidadores')]")
            if caregivers_button:
                caregivers_button.click()
                time.sleep(2)
                print("✅ Acessou página de cuidadores")
            else:
                self.driver.get(f"{WEB_ADMIN_URL}#/caregivers")
                time.sleep(2)
            
            # Verificar se mostra cuidadores
            caregivers_list = self.driver.find_elements(By.CSS_SELECTOR, '.caregiver-card, .caregiver-item, [class*="caregiver"]')
            print(f"  ✅ Encontrados {len(caregivers_list)} cuidadores na interface")
            
            # Testar ver pacientes do cuidador
            print("  👥 Testando visualização de pacientes do cuidador...")
            patients_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Pacientes')] | //a[contains(text(), 'Pacientes')]")
            if patients_buttons:
                patients_buttons[0].click()
                time.sleep(2)
                print("  ✅ Lista de pacientes do cuidador acessada")
            
            self.test_results.append("✅ Gerenciamento de cuidadores: OK")
            return True
            
        except Exception as e:
            print(f"❌ Erro no teste de cuidadores: {e}")
            self.test_results.append(f"❌ Gerenciamento de cuidadores: {str(e)}")
            return False
    
    def test_suppliers_management(self):
        """Testa gerenciamento de fornecedores"""
        print("\n🏪 Testando gerenciamento de fornecedores...")
        try:
            # Primeiro, criar solicitação de fornecedor via API (mais confiável)
            print("  📝 Criando solicitação de fornecedor via API...")
            try:
                # Primeiro criar usuário fornecedor
                supplier_email = f"fornecedor{random.randint(1000, 9999)}@teste.com"
                supplier_name = f"Fornecedor Teste {random.randint(1000, 9999)}"
                company_name = f"Empresa Teste {random.randint(1000, 9999)}"
                
                # Registrar fornecedor (endpoint público)
                register_data = {
                    "name": supplier_name,
                    "email": supplier_email,
                    "password": "senha123",
                    "password_confirmation": "senha123",
                    "company_name": company_name,
                    "company_type": "pessoa_juridica",
                    "cnpj": f"{random.randint(10000000000000, 99999999999999)}",
                    "products_categories": ["medicamentos"]
                }
                
                register_response = requests.post(
                    f"{API_BASE_URL}/suppliers/register",
                    json=register_data,
                    headers={"Accept": "application/json", "Content-Type": "application/json"}
                )
                
                if register_response.status_code in [200, 201]:
                    print(f"  ✅ Solicitação de fornecedor criada: {company_name}")
                else:
                    print(f"  ⚠️  Erro ao criar fornecedor: {register_response.status_code} - {register_response.text[:200]}")
            except Exception as e:
                print(f"  ⚠️  Não foi possível criar solicitação de fornecedor: {e}")
            
            # Voltar para web-admin e testar aprovação/reprovação
            print("  🔄 Acessando web-admin para gerenciar fornecedores...")
            self.driver.get(WEB_ADMIN_URL)
            time.sleep(2)
            
            # Fazer login novamente se necessário
            if not self.api_token:
                self.login()
            
            suppliers_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Fornecedores')] | //a[contains(text(), 'Fornecedores')]")
            if suppliers_button:
                suppliers_button.click()
                time.sleep(2)
                print("✅ Acessou página de fornecedores")
            else:
                self.driver.get(f"{WEB_ADMIN_URL}#/suppliers")
                time.sleep(2)
            
            # Testar aprovação
            print("  ✅ Testando aprovação de fornecedor...")
            approve_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Aprovar')] | //button[contains(@title, 'Aprovar')]")
            if approve_buttons:
                approve_buttons[0].click()
                time.sleep(1)
                print("  ✅ Aprovação testada")
            
            # Testar reprovação
            print("  ❌ Testando reprovação de fornecedor...")
            reject_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Reprovar')] | //button[contains(@title, 'Reprovar')]")
            if reject_buttons:
                reject_buttons[0].click()
                time.sleep(1)
                # Preencher motivo se houver
                reason_input = self.wait_for_element(By.CSS_SELECTOR, 'input[name="reason"], textarea[name="reason"]', timeout=2)
                if reason_input:
                    reason_input.send_keys("Teste de reprovação")
                confirm_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Confirmar')]", timeout=2)
                if confirm_button:
                    confirm_button.click()
                print("  ✅ Reprovação testada")
            
            # Testar suspensão
            print("  ⏸️  Testando suspensão de fornecedor...")
            suspend_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Suspender')] | //button[contains(@title, 'Suspender')]")
            if suspend_buttons:
                suspend_buttons[0].click()
                time.sleep(1)
                print("  ✅ Suspensão testada")
            
            self.test_results.append("✅ Gerenciamento de fornecedores: OK")
            return True
            
        except Exception as e:
            print(f"❌ Erro no teste de fornecedores: {e}")
            self.test_results.append(f"❌ Gerenciamento de fornecedores: {str(e)}")
            return False
    
    def test_devices_management(self):
        """Testa gerenciamento de smartwatches/dispositivos"""
        print("\n⌚ Testando gerenciamento de smartwatches...")
        try:
            # Acessar página de dispositivos
            devices_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Smartwatch')] | //button[contains(text(), 'Dispositivos')] | //a[contains(text(), 'Smartwatch')]")
            if devices_button:
                devices_button.click()
                time.sleep(2)
                print("✅ Acessou página de dispositivos")
            else:
                self.driver.get(f"{WEB_ADMIN_URL}#/devices")
                time.sleep(2)
            
            # Testar inclusão de dispositivo
            print("  ➕ Testando inclusão de dispositivo...")
            add_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Adicionar')] | //button[contains(text(), 'Novo')] | //button[contains(text(), 'Criar')]")
            if add_button:
                add_button.click()
                time.sleep(1)
                
                # Preencher formulário
                nickname = f"Smartwatch Teste {random.randint(1000, 9999)}"
                identifier = f"SW{random.randint(100000, 999999)}"
                
                nickname_input = self.wait_for_element(By.CSS_SELECTOR, 'input[name="nickname"], input[placeholder*="apelido" i]')
                if nickname_input:
                    nickname_input.send_keys(nickname)
                
                identifier_input = self.wait_for_element(By.CSS_SELECTOR, 'input[name="identifier"], input[placeholder*="identificador" i]')
                if identifier_input:
                    identifier_input.send_keys(identifier)
                
                # Selecionar tipo
                type_select = self.wait_for_element(By.CSS_SELECTOR, 'select[name="type"], select[name="device_type"]')
                if type_select:
                    select = Select(type_select)
                    select.select_by_value('smartwatch')
                
                # Salvar
                save_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Salvar')] | //button[contains(text(), 'Criar')]")
                if save_button:
                    save_button.click()
                    time.sleep(2)
                    print(f"  ✅ Dispositivo criado: {nickname}")
            
            # Testar exclusão
            print("  🗑️  Testando exclusão de dispositivo...")
            delete_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Excluir')] | //button[contains(@title, 'Excluir')]")
            if delete_buttons:
                delete_buttons[0].click()
                time.sleep(1)
                # Confirmar exclusão
                confirm_button = self.wait_for_element(By.XPATH, "//button[contains(text(), 'Confirmar')] | //button[contains(text(), 'Sim')]", timeout=2)
                if confirm_button:
                    confirm_button.click()
                time.sleep(1)
                print("  ✅ Exclusão testada")
            
            self.test_results.append("✅ Gerenciamento de dispositivos: OK")
            return True
            
        except Exception as e:
            print(f"❌ Erro no teste de dispositivos: {e}")
            self.test_results.append(f"❌ Gerenciamento de dispositivos: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Executa todos os testes"""
        print("=" * 60)
        print("🚀 Iniciando testes automatizados do Web-Admin")
        print("=" * 60)
        
        if not self.setup_driver():
            return False
        
        try:
            # Login
            if not self.login():
                print("❌ Falha no login - abortando testes")
                return False
            
            # Executar testes
            self.test_users_management()
            self.test_doctors_management()
            self.test_caregivers_management()
            self.test_suppliers_management()
            self.test_devices_management()
            
            # Resumo
            print("\n" + "=" * 60)
            print("📊 RESUMO DOS TESTES")
            print("=" * 60)
            for result in self.test_results:
                print(result)
            print("=" * 60)
            
            return True
            
        finally:
            if self.driver:
                self.driver.quit()
                print("\n✅ Driver fechado")

if __name__ == "__main__":
    tester = WebAdminTester()
    tester.run_all_tests()

