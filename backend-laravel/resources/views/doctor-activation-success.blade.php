<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conta Ativada - Laços</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
        }
        
        .success-icon {
            width: 100px;
            height: 100px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out;
        }
        
        .success-icon::before {
            content: '✓';
            color: white;
            font-size: 60px;
            font-weight: bold;
        }
        
        @keyframes scaleIn {
            from {
                transform: scale(0);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        h1 {
            color: #1f2937;
            font-size: 28px;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .message {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        
        .doctor-info {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }
        
        .doctor-info p {
            margin: 8px 0;
            color: #374151;
            font-size: 14px;
        }
        
        .doctor-info strong {
            color: #1f2937;
            display: inline-block;
            min-width: 100px;
        }
        
        .button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            text-decoration: none;
            display: inline-block;
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        
        .button:active {
            transform: translateY(0);
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon"></div>
        
        <h1>Conta Ativada com Sucesso! 🎉</h1>
        
        <div class="message">
            <p><strong>Parabéns, {{ $doctor->name }}!</strong></p>
            <p>Sua conta de médico foi ativada com sucesso.</p>
            <p>Agora você pode usar o Laços normalmente como médico.</p>
        </div>
        
        <div class="doctor-info">
            <p><strong>Nome:</strong> {{ $doctor->name }}</p>
            <p><strong>Email:</strong> {{ $doctor->email }}</p>
            @if($doctor->crm)
            <p><strong>CRM:</strong> {{ $doctor->crm }}</p>
            @endif
        </div>
        
        <a href="{{ config('app.mobile_app_url', 'lacos://') }}" class="button">
            📱 Abrir App Laços
        </a>
        
        <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
            Agora você pode fazer login normalmente no app.
        </p>
        
        <div class="footer">
            <p>Laços - Plataforma de Cuidados</p>
            <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
        </div>
    </div>
</body>
</html>

