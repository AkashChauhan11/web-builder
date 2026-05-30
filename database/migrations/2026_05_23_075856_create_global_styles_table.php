<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('global_styles', function (Blueprint $table) {
            $table->id();
            $table->json('colors');
            $table->json('typography');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('global_styles');
    }
};
