<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f0f4f8; padding: 24px 16px; color: #1a202c; }
        .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 36px 32px; text-align: center; }
        .header-emoji { font-size: 48px; display: block; margin-bottom: 12px; }
        .header h1 { color: #fff; font-size: 22px; font-weight: 700; line-height: 1.3; }
        .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
        .body { padding: 32px; }
        .greeting { font-size: 16px; color: #374151; margin-bottom: 20px; line-height: 1.6; }
        .baby-card { background: #f5f3ff; border: 1px solid #e0d9ff; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .baby-card-title { font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }
        .baby-info-row { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; color: #374151; }
        .baby-info-row:last-child { margin-bottom: 0; }
        .baby-info-label { color: #6b7280; min-width: 120px; font-size: 13px; }
        .baby-info-value { font-weight: 600; color: #1a202c; }
        .credentials { background: #fff8e1; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .credentials-title { font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; }
        .cred-row { font-size: 14px; color: #374151; margin-bottom: 8px; }
        .cred-row:last-child { margin-bottom: 0; }
        .cred-label { color: #6b7280; font-size: 13px; }
        .cred-value { font-weight: 700; color: #1a202c; font-family: monospace; font-size: 15px; }
        .warning { font-size: 12px; color: #92400e; margin-top: 12px; padding-top: 12px; border-top: 1px solid #fcd34d; }
        .download-section { margin: 24px 0; }
        .download-title { font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 14px; text-align: center; }
        .store-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .store-btn { display: inline-block; background: #1a202c; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; text-align: center; }
        .store-btn span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.7); }
        .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
        .footer-text { font-size: 13px; color: #6b7280; line-height: 1.6; text-align: center; }
        .footer { text-align: center; padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
        .footer p { font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <span class="header-emoji">🍼</span>
        <h1>Bem-vinda ao Laços, {{ $motherName }}!</h1>
        <p>O grupo familiar de <strong>{{ $babyName }}</strong> foi criado</p>
    </div>

    <div class="body">
        <p class="greeting">
            Olá, <strong>{{ $motherName }}</strong>! A maternidade criou um grupo no <strong>Laços</strong> para você acompanhar a saúde e o desenvolvimento de <strong>{{ $babyName }}</strong> junto com a família e cuidadores.
        </p>

        @if($birthDate || $bloodType || $birthWeight || $birthLength)
        <div class="baby-card">
            <div class="baby-card-title">📋 Dados de Nascimento</div>
            @if($birthDate)
            <div class="baby-info-row">
                <span class="baby-info-label">Data de nascimento</span>
                <span class="baby-info-value">{{ \Carbon\Carbon::parse($birthDate)->format('d/m/Y') }}</span>
            </div>
            @endif
            @if($bloodType)
            <div class="baby-info-row">
                <span class="baby-info-label">Tipo sanguíneo</span>
                <span class="baby-info-value">{{ $bloodType }}</span>
            </div>
            @endif
            @if($birthWeight)
            <div class="baby-info-row">
                <span class="baby-info-label">Peso ao nascer</span>
                <span class="baby-info-value">{{ number_format($birthWeight / 1000, 3, ',', '') }} kg</span>
            </div>
            @endif
            @if($birthLength)
            <div class="baby-info-row">
                <span class="baby-info-label">Comprimento</span>
                <span class="baby-info-value">{{ $birthLength }} cm</span>
            </div>
            @endif
        </div>
        @endif

        @if($isNewUser && $tempPassword)
        <div class="credentials">
            <div class="credentials-title">🔑 Suas Credenciais de Acesso</div>
            <div class="cred-row">
                <span class="cred-label">E-mail: </span>
                <span class="cred-value">{{ $email }}</span>
            </div>
            <div class="cred-row">
                <span class="cred-label">Senha provisória: </span>
                <span class="cred-value">{{ $tempPassword }}</span>
            </div>
            <p class="warning">⚠️ Altere sua senha assim que fizer o primeiro acesso.</p>
        </div>
        @else
        <div class="credentials" style="background:#f0fdf4; border-color:#86efac;">
            <div class="credentials-title" style="color:#166534;">✅ Você já tem uma conta no Laços</div>
            <div class="cred-row">
                <span class="cred-label">E-mail: </span>
                <span class="cred-value">{{ $email }}</span>
            </div>
            <div class="cred-row" style="margin-top:8px;">
                <span class="cred-label">Código do grupo: </span>
                <span class="cred-value" style="font-size:18px; letter-spacing:3px;">{{ $groupCode }}</span>
            </div>
            <p class="warning" style="color:#166534; border-color:#86efac;">Entre no app e use o código acima para acessar o novo grupo.</p>
        </div>
        @endif

        <div class="download-section">
            <p class="download-title">
                @if($isNewUser) Baixe o app Laços e entre com as credenciais acima:
                @else Abra o app Laços e acesse o novo grupo:
                @endif
            </p>
            <div class="store-buttons">
                <a href="https://play.google.com/store/apps/details?id=com.lacos.app" class="store-btn">
                    <span>Disponível no</span>Google Play
                </a>
                <a href="https://apps.apple.com/app/lacos/id6784869366" class="store-btn">
                    <span>Disponível na</span>App Store
                </a>
            </div>
        </div>

        <div class="divider"></div>
        <p class="footer-text">
            Com o Laços você pode registrar vacinas, consultas, medicamentos, compartilhar fotos e muito mais com toda a família. 💙
        </p>
    </div>

    <div class="footer">
        <p>© {{ date('Y') }} Laços · Todos os direitos reservados</p>
        <p style="margin-top:4px">Este e-mail foi enviado pela maternidade onde {{ $babyName }} nasceu.</p>
    </div>
</div>
</body>
</html>
