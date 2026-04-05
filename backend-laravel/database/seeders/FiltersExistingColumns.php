<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\Schema;

trait FiltersExistingColumns
{
    protected function filterToExistingColumns(string $table, array $record): array
    {
        $existingColumns = Schema::getColumnListing($table);
        return array_intersect_key($record, array_flip($existingColumns));
    }
}
