# 📋 Implementação de Telemedicina - Receita e Atestado Digital

## ✅ Frontend Implementado

### 1. Telas Criadas
- ✅ `src/screens/Teleconsultation/RecipeFormScreen.js` - Formulário de Receita Médica
- ✅ `src/screens/Teleconsultation/MedicalCertificateFormScreen.js` - Formulário de Atestado Médico
- ✅ `src/screens/Home/DoctorVideoCallScreen.js` - Atualizado com botões de receita e atestado

### 2. Serviços Criados
- ✅ `src/services/prescriptionService.js` - Serviço para comunicação com backend

### 3. Navegação Atualizada
- ✅ Rotas adicionadas no `DoctorNavigator.js`:
  - `RecipeForm` - Tela de formulário de receita
  - `MedicalCertificateForm` - Tela de formulário de atestado

## 🔨 Backend a Implementar

### 1. Controller de Prescrições

Criar `backend-laravel/app/Http/Controllers/Api/PrescriptionController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Document;
use App\Services\PDFService;
use App\Services\DigitalSignatureService;

class PrescriptionController extends Controller
{
    /**
     * Gerar receita médica assinada digitalmente
     * POST /api/prescriptions/generate-signed-recipe
     */
    public function generateSignedRecipe(Request $request)
    {
        try {
            // Validação
            $validated = $request->validate([
                'appointment_id' => 'nullable|exists:appointments,id',
                'group_id' => 'required|exists:groups,id',
                'patient_id' => 'required',
                'doctor_id' => 'required',
                'medication' => 'required|string',
                'concentration' => 'required|string',
                'pharmaceutical_form' => 'required|string',
                'dosage' => 'required|string',
                'treatment_duration' => 'required|string',
                'notes' => 'nullable|string',
                'patient_name' => 'required|string',
                'patient_cpf' => 'nullable|string',
                'patient_birth_date' => 'nullable|date',
                'doctor_name' => 'required|string',
                'doctor_crm' => 'required|string',
                'doctor_crm_uf' => 'required|string',
                'doctor_specialty' => 'nullable|string',
            ]);

            // Gerar PDF da receita
            $pdfService = app(PDFService::class);
            $pdfPath = $pdfService->generateRecipePDF($validated);

            // Assinar digitalmente
            $signatureService = app(DigitalSignatureService::class);
            $signedPdfPath = $signatureService->signPDF($pdfPath);

            // Gerar hash para validação
            $documentHash = hash_file('sha256', storage_path('app/' . $signedPdfPath));

            // Salvar no storage público
            $publicPath = 'documents/prescriptions/' . date('Y/m') . '/' . $documentHash . '.pdf';
            Storage::disk('public')->put($publicPath, file_get_contents(storage_path('app/' . $signedPdfPath)));

            // Criar registro no banco de dados
            $document = Document::create([
                'group_id' => $validated['group_id'],
                'user_id' => Auth::id(),
                'doctor_id' => $validated['doctor_id'],
                'consultation_id' => $validated['appointment_id'] ?? null,
                'type' => 'prescription',
                'title' => 'Receita Médica Digital - ' . $validated['medication'],
                'document_date' => now()->toDateString(),
                'file_path' => $publicPath,
                'file_name' => 'receita_' . $documentHash . '.pdf',
                'file_type' => 'application/pdf',
                'file_size' => Storage::disk('public')->size($publicPath),
                'notes' => $validated['notes'] ?? null,
            ]);

            // Limpar arquivo temporário
            Storage::delete($signedPdfPath);

            return response()->json([
                'success' => true,
                'message' => 'Receita gerada e assinada com sucesso',
                'data' => [
                    'document_id' => $document->id,
                    'hash' => $documentHash,
                    'validation_url' => url("/api/prescriptions/validate/{$documentHash}"),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar receita assinada: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar receita: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Gerar atestado médico assinado digitalmente
     * POST /api/prescriptions/generate-signed-certificate
     */
    public function generateSignedCertificate(Request $request)
    {
        // Similar ao generateSignedRecipe, mas para atestados
        // ...
    }

    /**
     * Validar documento assinado
     * GET /api/prescriptions/validate/{hash}
     */
    public function validateDocument($hash)
    {
        // Validar assinatura digital e retornar informações
        // ...
    }
}
```

### 2. Service de Geração de PDF

Criar `backend-laravel/app/Services/PDFService.php`:

```php
<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PDFService
{
    /**
     * Gerar PDF da receita médica conforme template
     */
    public function generateRecipePDF(array $data): string
    {
        // Usar template Blade com todos os dados necessários
        $pdf = Pdf::loadView('prescriptions.recipe', $data);
        
        // Salvar temporariamente
        $filename = 'recipe_' . uniqid() . '.pdf';
        $path = 'temp/' . $filename;
        Storage::put($path, $pdf->output());
        
        return $path;
    }

    /**
     * Gerar PDF do atestado médico
     */
    public function generateCertificatePDF(array $data): string
    {
        // Similar ao generateRecipePDF
        // ...
    }
}
```

### 3. Service de Assinatura Digital

Criar `backend-laravel/app/Services/DigitalSignatureService.php`:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use setasign\Fpdi\Fpdi;
use setasign\Fpdi\PdfParser\StreamReader;
use Illuminate\Support\Facades\Log;

class DigitalSignatureService
{
    /**
     * Assinar PDF com certificado ICP-Brasil A1
     */
    public function signPDF(string $pdfPath): string
    {
        // Carregar certificado A1 (deve estar configurado)
        $certificatePath = config('digital_signature.certificate_path');
        $certificatePassword = config('digital_signature.certificate_password');
        
        // Usar biblioteca FPDI para assinar
        // Exemplo com setasign/fpdi e setasign/fpdf
        
        try {
            $pdf = new Fpdi();
            $pdf->SetFont('Arial', '', 10);
            
            // Importar páginas do PDF original
            $pageCount = $pdf->setSourceFile(Storage::path($pdfPath));
            
            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $tplId = $pdf->importPage($pageNo);
                $pdf->AddPage();
                $pdf->useTemplate($tplId);
            }
            
            // Assinar digitalmente
            // Implementar assinatura com certificado ICP-Brasil
            
            // Salvar PDF assinado
            $signedPath = 'temp/signed_' . basename($pdfPath);
            $pdf->Output('F', Storage::path($signedPath));
            
            return $signedPath;
        } catch (\Exception $e) {
            Log::error('Erro ao assinar PDF: ' . $e->getMessage());
            throw $e;
        }
    }
}
```

### 4. View Blade para Template de Receita

Criar `backend-laravel/resources/views/prescriptions/recipe.blade.php`:

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receita Médica Digital</title>
    <style>
        /* Estilos conforme template fornecido */
        /* ... */
    </style>
</head>
<body>
    <!-- Template HTML conforme imagem fornecida -->
    <!-- Incluir todos os campos obrigatórios -->
    <!-- QR Code será gerado após assinatura -->
</body>
</html>
```

### 5. Rotas da API

Adicionar em `backend-laravel/routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/prescriptions/generate-signed-recipe', [PrescriptionController::class, 'generateSignedRecipe']);
    Route::post('/prescriptions/generate-signed-certificate', [PrescriptionController::class, 'generateSignedCertificate']);
    Route::get('/prescriptions/validate/{hash}', [PrescriptionController::class, 'validateDocument']);
});
```

### 6. Dependências Necessárias (composer.json)

```json
{
    "require": {
        "barryvdh/laravel-dompdf": "^2.0",
        "setasign/fpdi": "^2.0",
        "simplesoftwareio/simple-qrcode": "^4.0",
        "setasign/fpdf": "^2.0"
    }
}
```

## 📝 Próximos Passos

1. ✅ Frontend completo
2. 🔨 Implementar backend:
   - Criar PrescriptionController
   - Criar PDFService
   - Criar DigitalSignatureService
   - Criar views Blade para templates
   - Configurar certificado ICP-Brasil A1
   - Implementar geração de QR Code
   - Implementar validação de documentos

## 🔐 Configuração de Certificado ICP-Brasil

O certificado A1 deve ser configurado em `config/digital_signature.php`:

```php
return [
    'certificate_path' => storage_path('certificates/certificado.pfx'),
    'certificate_password' => env('CERTIFICATE_PASSWORD'),
];
```

## 📌 Notas Importantes

1. **Certificado ICP-Brasil**: O certificado A1 deve estar instalado/configurado no servidor
2. **QR Code**: Deve apontar para URL de validação: `https://lacos.app/validar-receita/{hash}`
3. **Assinatura Digital**: Deve seguir padrões ICP-Brasil (MP 2.200-2/2001 e Lei 14.063/2020)
4. **PDF**: Deve ser imutável após assinatura
5. **Validação**: Endpoint público para validação de documentos assinados


