<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f0f4f8; padding: 24px 16px; }
        .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #3d6b4f 0%, #2e5038 100%); padding: 36px 32px; text-align: center; }
        .emoji { font-size: 48px; display: block; margin-bottom: 12px; }
        .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
        .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
        .body { padding: 32px; color: #374151; }
        .greeting { font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
        .cta-box { background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
        .cta-box p { font-size: 14px; color: #6b7280; margin-bottom: 16px; line-height: 1.5; }
        .cta-btn { display: inline-block; background: #7c3aed; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; }
        .expiry { font-size: 12px; color: #9ca3af; margin-top: 12px; }
        .security { background: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
        .footer { text-align: center; padding: 20px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
        .footer p { font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <span class="emoji">🍼</span>
        <h1>Ola, {{ $motherName }}!</h1>
        <p>A maternidade criou um grupo para <strong>{{ $babyName }}</strong></p>
    </div>
    <div class="body">
        <p class="greeting">
            A equipe da maternidade preparou um grupo no <strong>Lacos</strong> para voce acompanhar
            a saude e o desenvolvimento de <strong>{{ $babyName }}</strong> junto com sua familia.
        </p>
        <div class="cta-box">
            <p>Clique no botao abaixo para criar sua conta e acessar o grupo. Voce escolhera sua propria senha — leva menos de 1 minuto.</p>
            <a href="{{ $inviteUrl }}" class="cta-btn">Criar minha conta &rarr;</a>
            <p class="expiry">Este link expira em {{ $expiresAt }}</p>
        </div>
        <div class="security">
            Seguranca: Nunca enviamos sua senha por e-mail. Voce a define diretamente no formulario ao clicar no link acima.
        </div>
    </div>
    <div class="footer">
        <p>&copy; {{ date('Y') }} Spec Hospital &middot; Se nao reconhece este convite, ignore este e-mail.</p>
    </div>
</div>
</body>
</html>
