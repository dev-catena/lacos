<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('medical_specialties')) {
            Schema::create('medical_specialties', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->timestamps();
            });
            $specialties = ['Acupuntura','Alergia e Imunologia','Anestesiologia','Angiologia','Cardiologia','Cirurgia Cardiovascular','Cirurgia da Mão','Cirurgia de Cabeça e Pescoço','Cirurgia do Aparelho Digestivo','Cirurgia Geral','Cirurgia Oncológica','Cirurgia Pediátrica','Cirurgia Plástica','Cirurgia Torácica','Cirurgia Vascular','Clínica Médica','Coloproctologia','Dermatologia','Endocrinologia e Metabologia','Endoscopia','Gastroenterologia','Genética Médica','Geriatria','Ginecologia e Obstetrícia','Hematologia e Hemoterapia','Homeopatia','Infectologia','Mastologia','Medicina de Emergência','Medicina de Família e Comunidade','Medicina do Trabalho','Medicina de Tráfego','Medicina Esportiva','Medicina Física e Reabilitação','Medicina Intensiva','Medicina Legal e Perícia Médica','Medicina Nuclear','Medicina Preventiva e Social','Nefrologia','Neurocirurgia','Neurologia','Nutrologia','Oftalmologia','Oncologia Clínica','Ortopedia e Traumatologia','Otorrinolaringologia','Patologia','Patologia Clínica/Medicina Laboratorial','Pediatria','Pneumologia','Psiquiatria','Radiologia e Diagnóstico por Imagem','Radioterapia','Reumatologia','Urologia'];
            $data = [];
            foreach ($specialties as $s) {
                $data[] = ['name' => $s, 'created_at' => now(), 'updated_at' => now()];
            }
            DB::table('medical_specialties')->insert($data);
        }
    }
    public function down(): void {
        Schema::dropIfExists('medical_specialties');
    }
};
