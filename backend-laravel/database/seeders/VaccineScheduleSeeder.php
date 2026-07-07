<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VaccineScheduleSeeder extends Seeder
{
    public function run(): void
    {
        // Limpa para permitir re-seed sem duplicar
        DB::table('vaccine_schedules')->truncate();

        $schedules = [
            // ── Ao nascer ─────────────────────────────────────────────────────
            ['vaccine_name' => 'BCG', 'dose' => 'Dose única', 'age_months' => 0, 'age_label' => 'Ao nascer', 'description' => 'Previne formas graves de tuberculose.', 'notes' => 'Aplicar ainda na maternidade.', 'order' => 1],
            ['vaccine_name' => 'Hepatite B', 'dose' => '1ª dose', 'age_months' => 0, 'age_label' => 'Ao nascer', 'description' => 'Previne a hepatite B.', 'notes' => 'Aplicar nas primeiras 12h de vida.', 'order' => 2],

            // ── 2 meses ───────────────────────────────────────────────────────
            ['vaccine_name' => 'Hepatite B', 'dose' => '2ª dose', 'age_months' => 2, 'age_label' => '2 meses', 'description' => 'Previne a hepatite B.', 'notes' => null, 'order' => 10],
            ['vaccine_name' => 'Pentavalente (DTP+Hib+HepB)', 'dose' => '1ª dose', 'age_months' => 2, 'age_label' => '2 meses', 'description' => 'Previne difteria, tétano, coqueluche, meningite por Hib e hepatite B.', 'notes' => null, 'order' => 11],
            ['vaccine_name' => 'VIP — Poliomielite inativada', 'dose' => '1ª dose', 'age_months' => 2, 'age_label' => '2 meses', 'description' => 'Previne a poliomielite (paralisia infantil).', 'notes' => null, 'order' => 12],
            ['vaccine_name' => 'Pneumocócica 10-valente', 'dose' => '1ª dose', 'age_months' => 2, 'age_label' => '2 meses', 'description' => 'Previne pneumonia, meningite e outras infecções por pneumococo.', 'notes' => null, 'order' => 13],
            ['vaccine_name' => 'Rotavírus', 'dose' => '1ª dose', 'age_months' => 2, 'age_label' => '2 meses', 'description' => 'Previne diarreia grave por rotavírus.', 'notes' => 'Administrar até 3 meses e 15 dias de vida.', 'order' => 14],

            // ── 3 meses ───────────────────────────────────────────────────────
            ['vaccine_name' => 'Meningocócica C', 'dose' => '1ª dose', 'age_months' => 3, 'age_label' => '3 meses', 'description' => 'Previne meningite e septicemia por meningococo C.', 'notes' => null, 'order' => 20],

            // ── 4 meses ───────────────────────────────────────────────────────
            ['vaccine_name' => 'Pentavalente (DTP+Hib+HepB)', 'dose' => '2ª dose', 'age_months' => 4, 'age_label' => '4 meses', 'description' => 'Previne difteria, tétano, coqueluche, meningite por Hib e hepatite B.', 'notes' => null, 'order' => 30],
            ['vaccine_name' => 'VIP — Poliomielite inativada', 'dose' => '2ª dose', 'age_months' => 4, 'age_label' => '4 meses', 'description' => 'Previne a poliomielite.', 'notes' => null, 'order' => 31],
            ['vaccine_name' => 'Pneumocócica 10-valente', 'dose' => '2ª dose', 'age_months' => 4, 'age_label' => '4 meses', 'description' => 'Previne pneumonia, meningite e outras infecções por pneumococo.', 'notes' => null, 'order' => 32],
            ['vaccine_name' => 'Rotavírus', 'dose' => '2ª dose', 'age_months' => 4, 'age_label' => '4 meses', 'description' => 'Previne diarreia grave por rotavírus.', 'notes' => 'Administrar até 5 meses e 15 dias de vida.', 'order' => 33],

            // ── 5 meses ───────────────────────────────────────────────────────
            ['vaccine_name' => 'Meningocócica C', 'dose' => '2ª dose', 'age_months' => 5, 'age_label' => '5 meses', 'description' => 'Previne meningite e septicemia por meningococo C.', 'notes' => null, 'order' => 40],

            // ── 6 meses ───────────────────────────────────────────────────────
            ['vaccine_name' => 'Hepatite B', 'dose' => '3ª dose', 'age_months' => 6, 'age_label' => '6 meses', 'description' => 'Previne a hepatite B.', 'notes' => null, 'order' => 50],
            ['vaccine_name' => 'Pentavalente (DTP+Hib+HepB)', 'dose' => '3ª dose', 'age_months' => 6, 'age_label' => '6 meses', 'description' => 'Previne difteria, tétano, coqueluche, meningite por Hib e hepatite B.', 'notes' => null, 'order' => 51],
            ['vaccine_name' => 'VIP — Poliomielite inativada', 'dose' => '3ª dose', 'age_months' => 6, 'age_label' => '6 meses', 'description' => 'Previne a poliomielite.', 'notes' => null, 'order' => 52],
            ['vaccine_name' => 'Influenza', 'dose' => '1ª dose', 'age_months' => 6, 'age_label' => '6 meses', 'description' => 'Previne gripe sazonal. Aplicar anualmente.', 'notes' => 'Crianças de 6 meses a < 9 anos na 1ª vez: 2 doses com intervalo de 30 dias.', 'order' => 53],

            // ── 9 meses ───────────────────────────────────────────────────────
            ['vaccine_name' => 'Febre Amarela', 'dose' => 'Dose única', 'age_months' => 9, 'age_label' => '9 meses', 'description' => 'Previne a febre amarela.', 'notes' => 'Para crianças de regiões com recomendação de vacinação.', 'order' => 60],

            // ── 12 meses ──────────────────────────────────────────────────────
            ['vaccine_name' => 'Pneumocócica 10-valente', 'dose' => 'Reforço', 'age_months' => 12, 'age_label' => '12 meses', 'description' => 'Previne pneumonia, meningite e outras infecções por pneumococo.', 'notes' => null, 'order' => 70],
            ['vaccine_name' => 'Meningocócica C', 'dose' => 'Reforço', 'age_months' => 12, 'age_label' => '12 meses', 'description' => 'Previne meningite e septicemia por meningococo C.', 'notes' => null, 'order' => 71],
            ['vaccine_name' => 'Tríplice Viral (SCR)', 'dose' => '1ª dose', 'age_months' => 12, 'age_label' => '12 meses', 'description' => 'Previne sarampo, caxumba e rubéola.', 'notes' => null, 'order' => 72],

            // ── 15 meses ──────────────────────────────────────────────────────
            ['vaccine_name' => 'DTP', 'dose' => '1º Reforço', 'age_months' => 15, 'age_label' => '15 meses', 'description' => 'Reforço contra difteria, tétano e coqueluche.', 'notes' => null, 'order' => 80],
            ['vaccine_name' => 'VOP — Poliomielite oral', 'dose' => '1º Reforço', 'age_months' => 15, 'age_label' => '15 meses', 'description' => 'Reforço contra poliomielite.', 'notes' => null, 'order' => 81],
            ['vaccine_name' => 'Tríplice Viral (SCR)', 'dose' => '2ª dose', 'age_months' => 15, 'age_label' => '15 meses', 'description' => 'Previne sarampo, caxumba e rubéola.', 'notes' => null, 'order' => 82],
            ['vaccine_name' => 'Hepatite A', 'dose' => 'Dose única', 'age_months' => 15, 'age_label' => '15 meses', 'description' => 'Previne a hepatite A.', 'notes' => null, 'order' => 83],
            ['vaccine_name' => 'Tetraviral (SCRV)', 'dose' => 'Dose única', 'age_months' => 15, 'age_label' => '15 meses', 'description' => 'Previne sarampo, caxumba, rubéola e varicela.', 'notes' => 'Substitui a 2ª dose de Tríplice Viral + Varicela separadas.', 'order' => 84],
            ['vaccine_name' => 'Varicela', 'dose' => '1ª dose', 'age_months' => 15, 'age_label' => '15 meses', 'description' => 'Previne a catapora.', 'notes' => 'Quando não aplicada como Tetraviral.', 'order' => 85],

            // ── 4 anos ────────────────────────────────────────────────────────
            ['vaccine_name' => 'DTP', 'dose' => '2º Reforço', 'age_months' => 48, 'age_label' => '4 anos', 'description' => 'Reforço contra difteria, tétano e coqueluche.', 'notes' => null, 'order' => 90],
            ['vaccine_name' => 'VOP — Poliomielite oral', 'dose' => '2º Reforço', 'age_months' => 48, 'age_label' => '4 anos', 'description' => 'Reforço contra poliomielite.', 'notes' => null, 'order' => 91],
            ['vaccine_name' => 'Varicela', 'dose' => '2ª dose', 'age_months' => 48, 'age_label' => '4 anos', 'description' => 'Previne a catapora.', 'notes' => null, 'order' => 92],

            // ── Anual (a partir dos 6 meses) ──────────────────────────────────
            ['vaccine_name' => 'Influenza', 'dose' => 'Dose anual', 'age_months' => 6, 'age_label' => 'Anual (a partir de 6 meses)', 'description' => 'Previne gripe sazonal. Reaplicar todo ano na campanha nacional.', 'notes' => 'Campanhas geralmente em abril/maio.', 'order' => 100],
        ];

        $now = now();
        foreach ($schedules as &$row) {
            $row['created_at'] = $now;
            $row['updated_at'] = $now;
        }
        unset($row);

        DB::table('vaccine_schedules')->insert($schedules);

        $this->command->info('Calendário PNI inserido: ' . count($schedules) . ' vacinas/doses.');
    }
}
