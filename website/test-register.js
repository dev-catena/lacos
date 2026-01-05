// Script de teste para verificar o que o backend retorna
// Execute com: node test-register.js

const API_BASE_URL = 'https://gateway.lacosapp.com/api';

const testData = {
  name: 'Teste Usuario',
  email: 'teste@example.com',
  password: '123456',
  password_confirmation: '123456',
  profile: 'caregiver'
};

async function testRegister() {
  try {
    console.log('📤 Enviando dados:', { ...testData, password: '***', password_confirmation: '***' });
    
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const text = await response.text();
    console.log('📥 Status:', response.status);
    console.log('📥 Texto bruto:', text);
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('📥 JSON parseado:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('❌ Erro ao parsear JSON:', e);
    }

    if (!response.ok) {
      console.error('❌ Erro na requisição');
      if (data.errors) {
        console.error('❌ Erros:', data.errors);
      }
      if (data.erros) {
        console.error('❌ Erros (pt):', data.erros);
      }
    } else {
      console.log('✅ Sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testRegister();


