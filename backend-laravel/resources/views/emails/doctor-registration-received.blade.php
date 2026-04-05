<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro Recebido - Laços</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 0;
            background-color: #ffffff;
        }
        .header { 
            background-color: #4CAF50; 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content { 
            padding: 30px 20px; 
            background-color: #ffffff; 
        }
        .content p {
            margin: 15px 0;
            color: #333;
        }
        .info-box {
            background-color: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 12px; 
            background-color: #f9f9f9;
            border-top: 1px solid #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Laços - Cadastro Recebido</h1>
        </div>
        <div class="content">
            <p>Olá <strong>{{ $doctor->name }}</strong>,</p>
            <p>Recebemos seu cadastro como médico na plataforma Laços!</p>
            
            <div class="info-box">
                <p><strong>📋 Seu processo está em análise</strong></p>
                <p>Nossa equipe está revisando suas informações e documentos. Você receberá um novo email assim que sua conta for aprovada.</p>
            </div>

            <p><strong>O que acontece agora?</strong></p>
            <ul style="line-height: 2;">
                <li>✅ Seu cadastro foi recebido e está em análise</li>
                <li>⏳ Nossa equipe está verificando suas informações</li>
                <li>📧 Você receberá um email quando sua conta for aprovada</li>
                <li>🔗 O email de aprovação conterá um link para ativar sua conta</li>
            </ul>

            <p><strong>⏱️ Tempo de análise:</strong></p>
            <p>O processo de análise geralmente leva de 1 a 3 dias úteis. Pedimos sua paciência enquanto nossa equipe revisa seu cadastro.</p>

            <p><strong>📝 Informações do seu cadastro:</strong></p>
            <ul style="line-height: 2;">
                <li><strong>Nome:</strong> {{ $doctor->name }}</li>
                <li><strong>Email:</strong> {{ $doctor->email }}</li>
                @if($doctor->crm)
                <li><strong>CRM:</strong> {{ $doctor->crm }}</li>
                @endif
            </ul>

            <p>Se você tiver alguma dúvida ou precisar de mais informações, entre em contato conosco.</p>
        </div>
        <div class="footer">
            <p><strong>Laços - Plataforma de Cuidados</strong></p>
            <p>Este é um email automático, por favor não responda.</p>
            <p style="margin-top: 10px; font-size: 11px; color: #999;">
                Em caso de dúvidas, entre em contato com o suporte.
            </p>
        </div>
    </div>
</body>
</html>

