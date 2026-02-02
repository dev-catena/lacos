#!/usr/bin/env python3
"""
Script de Teste Funcional - Fluxo de Agendamento
Testa o fluxo completo: médico disponibiliza horários -> cuidador agenda consulta
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# Configurações padrão
DEFAULT_API_URL = "http://10.102.0.103:8000/api"  # ou "https://gateway.lacosapp.com/api"
DOCTOR_CPF = "40780462319"
DOCTOR_PASSWORD = "11111111"
CAREGIVER_LOGIN = "amigo@gmail.com"  # Credenciais padrão do cuidador
CAREGIVER_PASSWORD = "22222222"  # Senha padrão do cuidador


class TestStatus(Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    ERROR = "ERROR"


@dataclass
class TestStep:
    name: str
    description: str
    status: TestStatus = TestStatus.PASS
    message: str = ""
    data: Optional[Dict] = None
    error: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


class AppointmentFlowTester:
    def __init__(self, api_base_url: str, doctor_cpf: str, doctor_password: str, 
                 caregiver_login: str, caregiver_password: str):
        self.api_base_url = api_base_url
        self.doctor_cpf = doctor_cpf
        self.doctor_password = doctor_password
        self.caregiver_login = caregiver_login
        self.caregiver_password = caregiver_password
        
        # Tokens e dados
        self.doctor_token = None
        self.doctor_user = None
        self.doctor_id = None
        self.caregiver_token = None
        self.caregiver_user = None
        self.group_id = None
        
        # Horários criados
        self.available_slots = []
        self.created_appointment = None
        
        # Resultados
        self.steps: List[TestStep] = []
        
    def log_step(self, name: str, description: str, status: TestStatus = TestStatus.PASS, 
                 message: str = "", data: Optional[Dict] = None, error: Optional[str] = None):
        """Registra um passo do teste"""
        step = TestStep(
            name=name,
            description=description,
            status=status,
            message=message,
            data=data,
            error=error
        )
        self.steps.append(step)
        
        # Exibir no console
        status_icon = "✅" if status == TestStatus.PASS else "❌" if status == TestStatus.FAIL else "⚠️"
        print(f"{status_icon} {name}: {message}")
        if error:
            print(f"   Erro: {error}")
    
    def login_doctor(self) -> bool:
        """Faz login como médico"""
        try:
            self.log_step(
                "Login Médico",
                f"Fazendo login como médico (CPF: {self.doctor_cpf})",
                TestStatus.PASS,
                "Tentando fazer login..."
            )
            
            response = requests.post(
                f"{self.api_base_url}/login",
                json={"login": self.doctor_cpf, "password": self.doctor_password},
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.doctor_token = data.get("token")
                self.doctor_user = data.get("user")
                self.doctor_id = self.doctor_user.get("id")
                
                self.log_step(
                    "Login Médico",
                    f"Login realizado com sucesso",
                    TestStatus.PASS,
                    f"Médico logado: {self.doctor_user.get('name')} (ID: {self.doctor_id})",
                    data={"user_id": self.doctor_id, "email": self.doctor_user.get("email")}
                )
                return True
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_step(
                    "Login Médico",
                    "Falha no login",
                    TestStatus.FAIL,
                    "Não foi possível fazer login",
                    error=error_msg
                )
                return False
        except Exception as e:
            self.log_step(
                "Login Médico",
                "Erro ao fazer login",
                TestStatus.ERROR,
                "Erro de conexão ou timeout",
                error=str(e)
            )
            return False
    
    def create_availability(self) -> bool:
        """Cria disponibilidade para hoje com 2 horários a partir da hora atual"""
        try:
            # Calcular horários (1 hora e 2 horas a partir de agora)
            now = datetime.now()
            slot1_time = now + timedelta(hours=1)
            slot2_time = now + timedelta(hours=2)
            
            # Formatar como HH:MM
            slot1_str = slot1_time.strftime("%H:%M")
            slot2_str = slot2_time.strftime("%H:%M")
            
            # Obter dia da semana (0=segunda, 6=domingo)
            day_of_week = now.weekday()
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            day_name = day_names[day_of_week]
            
            # Formato esperado pela API
            availability_data = {
                "availableDays": [day_name],
                "daySchedules": {
                    day_name: [slot1_str, slot2_str]
                }
            }
            
            self.log_step(
                "Criar Disponibilidade",
                f"Criando disponibilidade para hoje ({day_name})",
                TestStatus.PASS,
                f"Horários: {slot1_str} e {slot2_str}",
                data=availability_data
            )
            
            response = requests.post(
                f"{self.api_base_url}/doctors/{self.doctor_id}/availability",
                json=availability_data,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {self.doctor_token}"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.available_slots = [slot1_str, slot2_str]
                
                self.log_step(
                    "Criar Disponibilidade",
                    "Disponibilidade criada com sucesso",
                    TestStatus.PASS,
                    f"2 horários disponibilizados: {slot1_str} e {slot2_str}",
                    data=data
                )
                return True
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_step(
                    "Criar Disponibilidade",
                    "Falha ao criar disponibilidade",
                    TestStatus.FAIL,
                    "Não foi possível criar disponibilidade",
                    error=error_msg
                )
                return False
        except Exception as e:
            self.log_step(
                "Criar Disponibilidade",
                "Erro ao criar disponibilidade",
                TestStatus.ERROR,
                "Erro de conexão ou timeout",
                error=str(e)
            )
            return False
    
    def login_caregiver(self) -> bool:
        """Faz login como cuidador/amigo"""
        try:
            self.log_step(
                "Login Cuidador",
                f"Fazendo login como cuidador",
                TestStatus.PASS,
                "Tentando fazer login..."
            )
            
            response = requests.post(
                f"{self.api_base_url}/login",
                json={"login": self.caregiver_login, "password": self.caregiver_password},
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.caregiver_token = data.get("token")
                self.caregiver_user = data.get("user")
                
                self.log_step(
                    "Login Cuidador",
                    "Login realizado com sucesso",
                    TestStatus.PASS,
                    f"Cuidador logado: {self.caregiver_user.get('name')}",
                    data={"user_id": self.caregiver_user.get("id"), "email": self.caregiver_user.get("email")}
                )
                return True
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_step(
                    "Login Cuidador",
                    "Falha no login",
                    TestStatus.FAIL,
                    "Não foi possível fazer login",
                    error=error_msg
                )
                return False
        except Exception as e:
            self.log_step(
                "Login Cuidador",
                "Erro ao fazer login",
                TestStatus.ERROR,
                "Erro de conexão ou timeout",
                error=str(e)
            )
            return False
    
    def get_caregiver_groups(self) -> bool:
        """Obtém os grupos do cuidador"""
        try:
            self.log_step(
                "Obter Grupos",
                "Buscando grupos do cuidador",
                TestStatus.PASS,
                "Tentando obter grupos..."
            )
            
            response = requests.get(
                f"{self.api_base_url}/groups",
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {self.caregiver_token}"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                groups = response.json()
                if isinstance(groups, dict) and 'data' in groups:
                    groups = groups['data']
                elif not isinstance(groups, list):
                    groups = []
                
                if groups and len(groups) > 0:
                    # Pegar o primeiro grupo
                    self.group_id = groups[0].get('id')
                    
                    self.log_step(
                        "Obter Grupos",
                        "Grupos obtidos com sucesso",
                        TestStatus.PASS,
                        f"Grupo selecionado: {groups[0].get('name')} (ID: {self.group_id})",
                        data={"group_id": self.group_id, "total_groups": len(groups)}
                    )
                    return True
                else:
                    self.log_step(
                        "Obter Grupos",
                        "Nenhum grupo encontrado",
                        TestStatus.FAIL,
                        "O cuidador não possui grupos cadastrados",
                        error="Nenhum grupo disponível"
                    )
                    return False
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_step(
                    "Obter Grupos",
                    "Falha ao obter grupos",
                    TestStatus.FAIL,
                    "Não foi possível obter grupos",
                    error=error_msg
                )
                return False
        except Exception as e:
            self.log_step(
                "Obter Grupos",
                "Erro ao obter grupos",
                TestStatus.ERROR,
                "Erro de conexão ou timeout",
                error=str(e)
            )
            return False
    
    def create_appointment(self) -> bool:
        """Cria um agendamento usando um dos horários disponíveis"""
        try:
            if not self.available_slots:
                self.log_step(
                    "Criar Agendamento",
                    "Nenhum horário disponível",
                    TestStatus.FAIL,
                    "Não há horários disponíveis para agendar",
                    error="available_slots está vazio"
                )
                return False
            
            # Usar o primeiro horário disponível
            selected_time = self.available_slots[0]
            
            # Criar data/hora completa para hoje
            now = datetime.now()
            time_parts = selected_time.split(':')
            appointment_datetime = now.replace(
                hour=int(time_parts[0]),
                minute=int(time_parts[1]),
                second=0,
                microsecond=0
            )
            
            # Se o horário já passou hoje, usar amanhã
            if appointment_datetime <= now:
                appointment_datetime += timedelta(days=1)
            
            appointment_date_str = appointment_datetime.strftime("%Y-%m-%d %H:%M:%S")
            
            appointment_data = {
                "group_id": self.group_id,
                "type": "medical",
                "title": "Consulta de Teste Automatizado",
                "description": "Consulta criada por teste funcional automatizado",
                "appointment_date": appointment_date_str,
                "scheduled_at": appointment_date_str,
                "doctor_id": self.doctor_id,
                "is_teleconsultation": False,
                "recurrence_type": "none"
            }
            
            self.log_step(
                "Criar Agendamento",
                f"Criando agendamento para {appointment_date_str}",
                TestStatus.PASS,
                f"Agendando consulta com médico ID {self.doctor_id} no grupo {self.group_id}",
                data=appointment_data
            )
            
            response = requests.post(
                f"{self.api_base_url}/appointments",
                json=appointment_data,
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": f"Bearer {self.caregiver_token}"
                },
                timeout=10
            )
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                self.created_appointment = data
                
                self.log_step(
                    "Criar Agendamento",
                    "Agendamento criado com sucesso",
                    TestStatus.PASS,
                    f"Consulta agendada para {appointment_date_str}",
                    data={"appointment_id": data.get("id"), "scheduled_at": appointment_date_str}
                )
                return True
            else:
                error_msg = f"Status {response.status_code}: {response.text}"
                self.log_step(
                    "Criar Agendamento",
                    "Falha ao criar agendamento",
                    TestStatus.FAIL,
                    "Não foi possível criar o agendamento",
                    error=error_msg
                )
                return False
        except Exception as e:
            self.log_step(
                "Criar Agendamento",
                "Erro ao criar agendamento",
                TestStatus.ERROR,
                "Erro de conexão ou timeout",
                error=str(e)
            )
            return False
    
    def run_test(self) -> Dict:
        """Executa o teste completo"""
        print("=" * 80)
        print("🧪 TESTE FUNCIONAL - FLUXO DE AGENDAMENTO")
        print("=" * 80)
        print(f"API: {self.api_base_url}")
        print(f"Médico CPF: {self.doctor_cpf}")
        print(f"Cuidador: {self.caregiver_login}")
        print("=" * 80)
        print()
        
        # Passo 1: Login como médico
        if not self.login_doctor():
            return self.generate_report()
        
        time.sleep(0.5)  # Pequeno delay entre requisições
        
        # Passo 2: Criar disponibilidade
        if not self.create_availability():
            return self.generate_report()
        
        time.sleep(0.5)
        
        # Passo 3: Login como cuidador
        if not self.login_caregiver():
            return self.generate_report()
        
        time.sleep(0.5)
        
        # Passo 4: Obter grupos do cuidador
        if not self.get_caregiver_groups():
            return self.generate_report()
        
        time.sleep(0.5)
        
        # Passo 5: Criar agendamento
        if not self.create_appointment():
            return self.generate_report()
        
        print()
        print("=" * 80)
        print("✅ TESTE CONCLUÍDO COM SUCESSO!")
        print("=" * 80)
        
        return self.generate_report()
    
    def generate_report(self) -> Dict:
        """Gera relatório do teste"""
        total_steps = len(self.steps)
        passed = sum(1 for s in self.steps if s.status == TestStatus.PASS)
        failed = sum(1 for s in self.steps if s.status == TestStatus.FAIL)
        errors = sum(1 for s in self.steps if s.status == TestStatus.ERROR)
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "api_url": self.api_base_url,
            "summary": {
                "total_steps": total_steps,
                "passed": passed,
                "failed": failed,
                "errors": errors,
                "success_rate": f"{(passed/total_steps*100):.1f}%" if total_steps > 0 else "0%"
            },
            "steps": [
                {
                    "name": step.name,
                    "description": step.description,
                    "status": step.status.value,
                    "message": step.message,
                    "timestamp": step.timestamp.isoformat(),
                    "data": step.data,
                    "error": step.error
                }
                for step in self.steps
            ],
            "test_data": {
                "doctor_id": self.doctor_id,
                "doctor_name": self.doctor_user.get("name") if self.doctor_user else None,
                "caregiver_id": self.caregiver_user.get("id") if self.caregiver_user else None,
                "caregiver_name": self.caregiver_user.get("name") if self.caregiver_user else None,
                "group_id": self.group_id,
                "available_slots": self.available_slots,
                "appointment_id": self.created_appointment.get("id") if self.created_appointment else None
            }
        }
        
        # Exibir relatório no console
        print()
        print("=" * 80)
        print("📊 RELATÓRIO DE TESTE")
        print("=" * 80)
        print()
        print(f"📈 RESUMO:")
        print(f"   Total de passos: {total_steps}")
        print(f"   ✅ Passou: {passed} ({passed/total_steps*100:.1f}%)" if total_steps > 0 else "   ✅ Passou: 0")
        print(f"   ❌ Falhou: {failed} ({failed/total_steps*100:.1f}%)" if total_steps > 0 else "   ❌ Falhou: 0")
        print(f"   ⚠️  Erro: {errors} ({errors/total_steps*100:.1f}%)" if total_steps > 0 else "   ⚠️  Erro: 0")
        print()
        
        if failed > 0 or errors > 0:
            print("❌ PASSOS COM PROBLEMAS:")
            print("-" * 80)
            for step in self.steps:
                if step.status != TestStatus.PASS:
                    status_icon = "❌" if step.status == TestStatus.FAIL else "⚠️"
                    print(f"{status_icon} {step.name}")
                    print(f"   {step.message}")
                    if step.error:
                        print(f"   Erro: {step.error}")
                    print()
        
        # Salvar relatório em arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"testunit/report_appointment_flow_{timestamp}.json"
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            print(f"💾 Relatório salvo em: {report_file}")
        except Exception as e:
            print(f"⚠️  Erro ao salvar relatório: {e}")
        
        return report


def main():
    import sys
    
    # Obter parâmetros da linha de comando ou usar padrões
    if len(sys.argv) >= 6:
        api_url = sys.argv[1]
        doctor_cpf = sys.argv[2]
        doctor_password = sys.argv[3]
        caregiver_login = sys.argv[4]
        caregiver_password = sys.argv[5]
    else:
        # Usar valores padrão ou solicitar
        api_url = DEFAULT_API_URL
        doctor_cpf = DOCTOR_CPF
        doctor_password = DOCTOR_PASSWORD
        
        # Usar credenciais padrão do cuidador
        caregiver_login = CAREGIVER_LOGIN
        caregiver_password = CAREGIVER_PASSWORD
    
    # Criar e executar teste
    tester = AppointmentFlowTester(
        api_base_url=api_url,
        doctor_cpf=doctor_cpf,
        doctor_password=doctor_password,
        caregiver_login=caregiver_login,
        caregiver_password=caregiver_password
    )
    
    report = tester.run_test()
    
    # Retornar código de saída baseado no resultado
    if report["summary"]["failed"] > 0 or report["summary"]["errors"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()

