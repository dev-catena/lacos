<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_stream_agents', function (Blueprint $table) {
            $table->uuid('agent_uuid')->nullable()->after('id');
            $table->string('agent_token_hash', 80)->nullable()->after('agent_uuid');
            $table->string('nome', 200)->nullable()->after('stream_api');
            $table->timestamp('last_seen_at')->nullable()->after('linked_at');

            $table->unique('agent_uuid');
            $table->index('agent_token_hash');
        });
    }

    public function down(): void
    {
        Schema::table('user_stream_agents', function (Blueprint $table) {
            $table->dropUnique(['agent_uuid']);
            $table->dropIndex(['agent_token_hash']);
            $table->dropColumn(['agent_uuid', 'agent_token_hash', 'nome', 'last_seen_at']);
        });
    }
};
