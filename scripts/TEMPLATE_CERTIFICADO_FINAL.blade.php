<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atestado Médico Digital</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            padding: 20px;
        }
        .logo {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 60px;
            height: auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            margin-top: 20px;
        }
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .intro-text {
            font-size: 10px;
            text-align: justify;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-size: 12px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .info-table td {
            padding: 8px;
            vertical-align: top;
        }
        .info-table .label {
            font-weight: bold;
            width: 30%;
        }
        .certificate-text {
            margin: 20px 0;
            text-align: justify;
            line-height: 1.8;
        }
        .signature-block {
            margin-top: 50px;
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #000;
            width: 300px;
            margin: 40px auto 10px;
            padding-top: 5px;
        }
        .signature-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .signature-crm {
            font-size: 11px;
        }
        .footer {
            margin-top: 30px;
            font-size: 9px;
            text-align: center;
            color: #666;
        }
        .legal-notice {
            margin-top: 20px;
            font-size: 9px;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ATESTADO MÉDICO</h1>
    </div>

    <div class="intro-text">
        Emitido em ambiente de telemedicina, nos termos da Resolução CFM nº 2.314/2022 (telemedicina), Resolução CFM nº 2.299/2021 (documentos médicos eletrônicos), Lei nº 14.510/2022 (telessaúde), Lei nº 13.709/2018 (LGPD) e demais normas aplicáveis.
    </div>

    <div class="section">
        <div class="section-title">DADOS DO PACIENTE</div>
        <table class="info-table">
            <tr>
                <td class="label">Nome:</td>
                <td>{{ $patient_name ?? 'Não informado' }}</td>
            </tr>
            <tr>
                <td class="label">Idade:</td>
                <td>
                    @if(!empty($patient_birth_date))
                        {{ \Carbon\Carbon::parse($patient_birth_date)->age }} anos
                    @else
                        Não informado
                    @endif
                </td>
            </tr>
            <tr>
                <td class="label">Sexo:</td>
                <td>{{ $patient_gender ?? 'Não informado' }}</td>
            </tr>
            <tr>
                <td class="label">Identidade (RG):</td>
                <td>{{ $patient_rg ?? 'Não informado' }}</td>
            </tr>
            <tr>
                <td class="label">CPF:</td>
                <td>{{ $patient_cpf ?? 'Não informado' }}</td>
            </tr>
        </table>
    </div>

    @if($type === 'medical_leave' && !empty($start_date) && !empty($end_date))
    <div class="section">
        <div class="section-title">INFORMAÇÕES DA DISPENSA</div>
        <table class="info-table">
            <tr>
                <td class="label">Data da consulta:</td>
                <td>{{ date('d/m/Y') }}</td>
            </tr>
            @if(!empty($cid))
            <tr>
                <td class="label">CID-10:</td>
                <td>{{ $cid }}</td>
            </tr>
            @endif
            @if(!empty($days))
            <tr>
                <td class="label">Quantidade de dias de afastamento:</td>
                <td>{{ $days }} dia(s)</td>
            </tr>
            @endif
            <tr>
                <td class="label">Data de início do afastamento:</td>
                <td>{{ date('d/m/Y', strtotime($start_date)) }}</td>
            </tr>
            <tr>
                <td class="label">Data prevista de retorno:</td>
                <td>{{ date('d/m/Y', strtotime($end_date)) }}</td>
            </tr>
        </table>
    </div>
    @endif

    <div class="certificate-text">
        <p>Atesto, para os devidos fins, que o(a) paciente acima identificado(a) foi<br>
        atendido(a) em consulta médica realizada por meio de telemedicina nesta data,<br>
        encontrando-se, por motivo de saúde, temporariamente inapto(a) para o<br>
        exercício de suas atividades habituais, necessitando de afastamento pelo<br>
        período de {{ $days ?? 0 }} dia(s), a contar de {{ !empty($start_date) ? date('d/m/Y', strtotime($start_date)) : date('d/m/Y') }}, com<br>
        retorno previsto em {{ !empty($end_date) ? date('d/m/Y', strtotime($end_date)) : date('d/m/Y') }}.</p>

        <p style="margin-top: 15px;">Este atestado é emitido com base nas informações clínicas obtidas durante a<br>
        teleconsulta, por meio de plataforma segura de comunicação, respeitando os<br>
        princípios éticos da medicina, o sigilo profissional, a confidencialidade das<br>
        informações e a legislação brasileira vigente em telemedicina, prontuário<br>
        eletrônico e proteção de dados pessoais.</p>
    </div>

    <div class="section">
        <div class="section-title">DADOS DO MÉDICO</div>
        <table class="info-table">
            <tr>
                <td class="label">Nome:</td>
                <td>{{ $doctor_name ?? 'Não informado' }}</td>
            </tr>
            <tr>
                <td class="label">CRM/UF:</td>
                <td>{{ $doctor_crm ?? 'Não informado' }} / {{ $doctor_crm_uf ?? 'Não informado' }}</td>
            </tr>
            <tr>
                <td class="label">Especialidade:</td>
                <td>{{ $doctor_specialty ?? 'Não informado' }}</td>
            </tr>
        </table>
    </div>

    <div style="text-align: right; margin-top: 20px;">
        {{ $city ?? config('app.city', 'Brasil') }}, {{ date('d') }} de {{ \Carbon\Carbon::now()->locale('pt_BR')->monthName }} de {{ date('Y') }}
    </div>

    <div class="signature-block">
        <div class="signature-line">
            <div class="signature-name">{{ $doctor_name ?? '' }}</div>
            <div class="signature-crm">CRM {{ $doctor_crm ?? '' }} / {{ $doctor_crm_uf ?? '' }}</div>
        </div>
    </div>

    <div class="legal-notice" style="margin-top: 30px;">
        <p>Documento emitido com assinatura eletrônica qualificada, padrão ICP-Brasil, ou outro meio eletrônico admitido pelo Conselho Federal de Medicina e pela legislação vigente.</p>
    </div>

    <div class="footer">
        <p>Este documento foi gerado eletronicamente em plataforma de telemedicina, com registro em prontuário</p>
    </div>

    @if(!empty($qr_code))
    <div style="text-align: center; margin-top: 20px;">
        <img src="data:image/png;base64,{{ $qr_code }}" alt="QR Code" style="max-width: 150px; height: auto;">
    </div>
    @endif
</body>
</html>






