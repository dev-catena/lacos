<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; }
        .header { background: #F5A623; padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; }
        .body { padding: 32px; color: #333; line-height: 1.6; }
        .code-box { background: #f0f0f0; border-radius: 6px; padding: 16px; text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 4px; color: #333; margin: 20px 0; }
        .credentials { background: #fff8e1; border-left: 4px solid #F5A623; padding: 16px; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 16px; color: #aaa; font-size: 12px; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>Bem-vinda ao Lacos!</h1>
    </div>
    <div class="body">
        <p>Olá, <strong>{{ $motherName }}</strong>!</p>
        <p>O grupo de acompanhamento de <strong>{{ $babyName }}</strong> foi criado com sucesso no Lacos.</p>

        <p>Para acessar o grupo, utilize o código abaixo no app:</p>
        <div class="code-box">{{ $groupCode }}</div>

        <div class="credentials">
            <p style="margin:0 0 8px"><strong>Suas credenciais de acesso:</strong></p>
            <p style="margin:0">E-mail: <strong>{{ $email }}</strong></p>
            <p style="margin:0">Senha provisória: <strong>{{ $tempPassword }}</strong></p>
        </div>

        <p><strong>Importante:</strong> altere sua senha assim que fizer o primeiro login.</p>

        <p>Com o Lacos você pode acompanhar a saúde e o bem-estar de <strong>{{ $babyName }}</strong>, compartilhar documentos, medicamentos e muito mais.</p>
    </div>
    <div class="footer">
        © {{ date('Y') }} Lacos · Todos os direitos reservados
    </div>
</div>
</body>
</html>
