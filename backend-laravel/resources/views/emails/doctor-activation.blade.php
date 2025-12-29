<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ativação de Conta - Laços</title>
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
        .button { 
            display: inline-block; 
            padding: 14px 28px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-weight: bold;
        }
        .button:hover {
            background-color: #45a049;
        }
        .link-text {
            word-break: break-all; 
            color: #666; 
            font-size: 12px;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #666; 
            font-size: 12px; 
            background-color: #f9f9f9;
            border-top: 1px solid #e0e0e0;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Laços - Ativação de Conta</h1>
        </div>
        <div class="content">
            <p>Olá <strong>{{ $doctor->name }}</strong>,</p>
            <p>Sua conta de médico foi aprovada pela equipe Laços!</p>
            <p>Para ativar sua conta e começar a usar a plataforma, clique no botão abaixo:</p>
            <p style="text-align: center;">
                <a href="{{ $activationUrl }}" class="button">Ativar Minha Conta</a>
            </p>
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p class="link-text">{{ $activationUrl }}</p>
            <div class="warning">
                <p><strong>⚠️ Este link expira em 7 dias.</strong></p>
            </div>
            <p>Se você não solicitou esta conta, pode ignorar este email.</p>
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

