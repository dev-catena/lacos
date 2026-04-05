<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const ALLOWED = ['especialista', 'residencia', 'mestrado', 'doutorado', 'pos_doutorado'];

    public function up(): void
    {
        if (! Schema::hasColumn('users', 'professional_qualification_level')) {
            Schema::table('users', function (Blueprint $table) {
                $table->text('professional_qualification_level')->nullable();
            });

            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->text('professional_qualification_level_tmp')->nullable();
        });

        $rows = DB::table('users')->select('id', 'professional_qualification_level')->get();
        foreach ($rows as $row) {
            $encoded = $this->encodeLevels($row->professional_qualification_level);
            DB::table('users')->where('id', $row->id)->update([
                'professional_qualification_level_tmp' => $encoded,
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('professional_qualification_level');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('professional_qualification_level_tmp', 'professional_qualification_level');
        });
    }

    private function encodeLevels(mixed $raw): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        if (is_string($raw)) {
            $t = trim($raw);
            if ($t === '') {
                return null;
            }
            if (str_starts_with($t, '[')) {
                $decoded = json_decode($t, true);
                if (is_array($decoded)) {
                    $vals = $this->filterAllowed($decoded);

                    return $vals === [] ? null : json_encode(array_values($vals));
                }
            }
            if (in_array($t, self::ALLOWED, true)) {
                return json_encode([$t]);
            }

            return null;
        }
        if (is_array($raw)) {
            $vals = $this->filterAllowed($raw);

            return $vals === [] ? null : json_encode(array_values($vals));
        }

        return null;
    }

    private function filterAllowed(array $items): array
    {
        $out = [];
        foreach ($items as $item) {
            $s = is_string($item) ? trim($item) : '';
            if ($s !== '' && in_array($s, self::ALLOWED, true)) {
                $out[$s] = true;
            }
        }

        return array_keys($out);
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'professional_qualification_level')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('professional_qualification_level_rev', 32)->nullable();
        });

        $rows = DB::table('users')->select('id', 'professional_qualification_level')->get();
        foreach ($rows as $row) {
            $first = null;
            $raw = $row->professional_qualification_level;
            if ($raw !== null && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded) && $decoded !== []) {
                    $first = $decoded[0];
                } elseif (is_string($raw) && ! str_starts_with(trim($raw), '[')) {
                    $first = trim($raw);
                }
            }
            DB::table('users')->where('id', $row->id)->update([
                'professional_qualification_level_rev' => $first,
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('professional_qualification_level');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('professional_qualification_level_rev', 'professional_qualification_level');
        });
    }
};
